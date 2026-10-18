"""Abre a página, lista os vídeos reais por trás do blob: e salva o escolhido em MP4.

O endereço blob: que aparece no player não é um arquivo. Ele só existe na
memória do navegador. Este programa escuta o que a página pede de verdade
(mp4, webm, m3u8 ou mpd), separa cada vídeo e as resoluções, e baixa o que
você escolher. Não quebra DRM: se o site só entrega o vídeo criptografado,
não há arquivo para salvar.
"""

from __future__ import annotations

import argparse
import queue
import re
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

def application_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


APP_DIR = application_dir()
DEFAULT_OUT = APP_DIR / "downloads"

AD_HINTS = (
    "doubleclick",
    "googlesyndication",
    "googleads",
    "adservice",
    "imasdk",
    "preroll",
    "/ad/",
    "/ads/",
    "adnxs",
    "trafficjunky",
    "exoclick",
    "juicyads",
    "popads",
    "scorecardresearch",
    "favicon",
)
MEDIA_IN_URL = re.compile(r"\.(m3u8|mpd|mp4|webm|m4v|mkv|mov)(?:$|\?)", re.I)
RESOLUTION_RE = re.compile(r"(?:^|[^\d])(2160|1440|1080|720|480|360|240)(?:p)?(?:[^\d]|$)")
STREAM_INF_RES = re.compile(r"RESOLUTION=(\d+)x(\d+)")
STREAM_INF_BW = re.compile(r"BANDWIDTH=(\d+)")


class DownloadError(Exception):
    pass


class Cancelled(DownloadError):
    pass


class StopFlag:
    """Sinaliza o cancelamento e encerra o ffmpeg que estiver rodando."""

    def __init__(self) -> None:
        self._event = threading.Event()
        self._proc: subprocess.Popen | None = None
        self._lock = threading.Lock()
        self.partial: Path | None = None
        self.duration = 0.0

    def cancelled(self) -> bool:
        return self._event.is_set()

    def checkpoint(self) -> None:
        if self._event.is_set():
            raise Cancelled("Download cancelado.")

    def cancel(self) -> None:
        self._event.set()
        with self._lock:
            process = self._proc
        if process is not None and process.poll() is None:
            try:
                process.terminate()
            except OSError:
                pass

    def watch(self, process: subprocess.Popen) -> None:
        with self._lock:
            self._proc = process
            already = self._event.is_set()
        if already:
            kill_process(process)

    def clear_process(self) -> None:
        with self._lock:
            self._proc = None

    def delete_partial(self) -> None:
        path = self.partial
        if path is None:
            return
        for candidate in (path, path.with_suffix(".progress"), path.with_suffix(".err")):
            try:
                candidate.unlink(missing_ok=True)
            except OSError:
                pass


def kill_process(process: subprocess.Popen | None) -> None:
    if process is None or process.poll() is not None:
        return
    process.terminate()
    try:
        process.wait(timeout=3)
    except subprocess.TimeoutExpired:
        process.kill()
        try:
            process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            pass


def clock(seconds: float) -> str:
    total = max(0, int(seconds))
    hours, remainder = divmod(total, 3600)
    minutes, secs = divmod(remainder, 60)
    if hours:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def emit(log, progress, text: str, ratio: float | None = None) -> None:
    if progress is not None:
        progress(text, ratio)
    else:
        log(text)


def explain_failure(exc: Exception) -> str:
    if isinstance(exc, DownloadError):
        return str(exc)
    lowered = str(exc).lower()
    if "timeout" in lowered or "timed out" in lowered:
        return "Essa página demorou demais para abrir. Confere o link e tenta de novo."
    if "net::err" in lowered or "ns_error" in lowered or "err_name_not_resolved" in lowered or "err_connection" in lowered:
        return "Não consegui abrir essa página. Confere se o link está certo."
    return "Não consegui ler os vídeos dessa página. Tenta de novo."


def safe_name(name: str) -> str:
    name = re.sub(r'[<>:"/\\|?*\n\r\t]', " ", name)
    name = re.sub(r"\s+", " ", name).strip(" .")
    return (name[:120] or "video")


def short_url(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    path = parsed.path or "/"
    if len(path) > 90:
        path = path[:40] + "…" + path[-40:]
    return f"{parsed.scheme}://{parsed.netloc}{path}"


def looks_like_ad(url: str) -> bool:
    lowered = url.lower()
    return any(hint in lowered for hint in AD_HINTS)


def is_segment(url: str) -> bool:
    path = urllib.parse.urlparse(url).path.lower()
    return path.endswith((".ts", ".m4s", ".aac", ".vtt", ".jpg", ".png", ".gif", ".webp"))


def is_media(url: str, content_type: str) -> bool:
    if not url or url.startswith(("blob:", "data:")):
        return False
    if looks_like_ad(url) or is_segment(url):
        return False
    content_type = (content_type or "").lower().split(";", 1)[0].strip()
    if content_type.startswith(("audio/", "image/", "text/", "font/")):
        return False
    if "mp2t" in content_type:
        return False
    if "mpegurl" in content_type or "dash+xml" in content_type:
        return True
    if content_type.startswith("video/"):
        return True
    if "multi=" in url.lower():
        return True
    return bool(MEDIA_IN_URL.search(urllib.parse.urlparse(url).path))


def unescape_text(text: str) -> str:
    return (
        text.replace("\\/", "/")
        .replace("\\u0026", "&")
        .replace("\\u002F", "/")
        .replace("&amp;", "&")
    )


def urls_in_text(text: str) -> list[str]:
    found: list[str] = []
    cleaned = unescape_text(text)
    for match in re.finditer(r"https?://[^\s\"'<>\\]+", cleaned, re.I):
        url = match.group(0).rstrip(".,);]")
        if is_media(url, ""):
            found.append(url)
    return found


def is_side_preview(url: str) -> bool:
    lowered = url.lower()
    name = urllib.parse.unquote(urllib.parse.urlparse(lowered).path).rsplit("/", 1)[-1]
    return (
        "heat-preview" in lowered
        or "trailer" in name
        or "teaser" in name
        or name.startswith(("pv_", "preview", "sample"))
    )


def page_markers(page_url: str) -> set[str]:
    path = urllib.parse.unquote(urllib.parse.urlparse(page_url).path)
    markers = set(re.findall(r"\d{5,}", path))
    parts = [part.strip("-") for part in path.split("/") if part and not part.isdigit()]
    if parts and len(parts[-1]) >= 12:
        markers.add(parts[-1].lower())
    return markers


def mark_owned(items: list[dict], page_url: str) -> None:
    markers = page_markers(page_url)
    for item in items:
        url = (item.get("url") or "").lower()
        if item.get("source") == "player" or any(marker in url for marker in markers):
            item["owned"] = True


def rank_candidate(item: dict) -> int:
    url = item["url"].lower()
    content_type = item.get("ct", "")
    score = 0
    if ".m3u8" in url or "mpegurl" in content_type:
        score += 120
    elif ".mpd" in url or "dash" in content_type:
        score += 110
    elif ".mp4" in url or "mp4" in content_type:
        score += 100
    elif ".webm" in url or "webm" in content_type:
        score += 90
    else:
        score += 40
    if item.get("source") == "network":
        score += 5000
    if "multi=" in url:
        score += 2000
    name = urllib.parse.urlparse(url).path.rsplit("/", 1)[-1]
    if name.startswith("hq_"):
        score += 350
    elif name.startswith("m_"):
        score -= 100
    match = RESOLUTION_RE.search(url)
    if match:
        score += int(match.group(1)) // 2
    score += min(int(item.get("length") or 0), 1_500_000_000) // 200_000
    if is_side_preview(url):
        score -= 4000
    if item.get("owned"):
        score += 100000
    return score


def dedupe_media(items: list[dict]) -> list[dict]:
    by_url: dict[str, dict] = {}
    for item in items:
        url = item.get("url") or ""
        if not is_media(url, item.get("ct", "")):
            continue
        previous = by_url.get(url)
        if previous is None:
            by_url[url] = dict(item)
            continue
        if item.get("source") == "network":
            previous["source"] = "network"
        if item.get("ct") and not previous.get("ct"):
            previous["ct"] = item["ct"]
        if item.get("length", 0) > previous.get("length", 0):
            previous["length"] = item["length"]
    by_path: dict[str, dict] = {}
    for item in by_url.values():
        parsed = urllib.parse.urlparse(item["url"])
        key = f"{(parsed.hostname or '').lower()}{parsed.path}"
        by_path[key] = item
    return list(by_path.values())


def group_key(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    path = urllib.parse.unquote(parsed.path)
    directory, _, name = path.rpartition("/")
    stem = re.sub(r"\.(m3u8|mpd|mp4|webm|m4v|mkv|mov)$", "", name, flags=re.I)
    stem = re.sub(r"[_\-]?(2160|1440|1080|720|480|360|240|144)p?", "", stem, flags=re.I)
    stem = re.sub(r"[_\-]?(master|playlist|index|video|main)$", "", stem, flags=re.I)
    directory = re.sub(r"/(?:2160|1440|1080|720|480|360|240|144)p?(?=/|$)", "", directory, flags=re.I)
    return f"{(parsed.hostname or '').lower()}{directory.lower()}/{stem.lower()}"


GENERIC_NAMES = {"index", "master", "playlist", "video", "main", "manifest", "media"}


def pretty_name(url: str) -> str:
    path = urllib.parse.unquote(urllib.parse.urlparse(url).path).strip("/")
    parts = [part for part in path.split("/") if part]
    stem = re.sub(r"\.(m3u8|mpd|mp4|webm|m4v|mkv|mov)$", "", parts[-1] if parts else "", flags=re.I)
    stem = re.sub(r"[_\-]+", " ", stem)
    stem = re.sub(r"\b(?:2160|1440|1080|720|480|360|240|144)p?\b", "", stem, flags=re.I)
    stem = re.sub(r"\s+", " ", stem).strip()
    if stem.lower() in GENERIC_NAMES or not stem:
        for part in reversed(parts[:-1]):
            cleaned = re.sub(r"[_\-]+", " ", part)
            cleaned = re.sub(r"\b(?:2160|1440|1080|720|480|360|240|144)p?\b", "", cleaned, flags=re.I)
            cleaned = re.sub(r"\s+", " ", cleaned).strip()
            if cleaned and cleaned.lower() not in GENERIC_NAMES:
                stem = cleaned
                break
    return (stem or "Vídeo")[:80]


def manifest_preference(item: dict) -> tuple:
    name = urllib.parse.urlparse(item["url"]).path.rsplit("/", 1)[-1].lower()
    master = int(any(token in name for token in ("master", "playlist", "manifest")))
    rendition = int(bool(RESOLUTION_RE.search(item["url"])))
    return (master, -rendition, rank_candidate(item))


def label_variants(found: list[dict]) -> list[dict]:
    found.sort(key=lambda item: (item.get("pixels") or 0, item.get("bandwidth") or 0, item.get("length") or 0), reverse=True)
    bases = []
    for item in found:
        if item.get("height"):
            bases.append(f"{item['height']}p")
        elif item.get("bandwidth"):
            bases.append(f"{item['bandwidth'] // 1000} kbps")
        else:
            bases.append("Original")
    for item, base in zip(found, bases):
        if bases.count(base) > 1 and item.get("width"):
            item["label"] = f"{item['width']}×{item['height']}"
        else:
            item["label"] = base
    return found


def file_options(items: list[dict]) -> list[dict]:
    found = []
    for item in items:
        match = RESOLUTION_RE.search(item["url"])
        height = int(match.group(1)) if match else 0
        found.append(
            {
                "url": item["url"],
                "width": 0,
                "height": height,
                "pixels": height,
                "bandwidth": 0,
                "length": int(item.get("length") or 0),
            }
        )
    labeled = label_variants(found)
    return [
        {"url": item["url"], "label": item["label"], "bytes": int(item.get("length") or 0)}
        for item in labeled
    ]


def assemble_videos(items: list[dict], resolve, log, on_video=None, on_step=None, measure=None, page_url: str = "") -> list[dict]:
    mark_owned(items, page_url)
    unique = dedupe_media(items)
    groups: dict[str, list[dict]] = {}
    for item in unique:
        groups.setdefault(group_key(item["url"]), []).append(item)
    order = sorted(groups, key=lambda key: max(rank_candidate(item) for item in groups[key]), reverse=True)
    videos: list[dict] = []
    consumed: set[str] = set()
    resolved = 0
    group_total = max(1, len(order))
    for step, key in enumerate(order, start=1):
        if on_step:
            on_step(0.4 + 0.55 * step / group_total)
        members = [item for item in groups[key] if item["url"] not in consumed]
        if not members:
            continue
        playlists = [item for item in members if looks_like_playlist(item["url"])]
        files = [item for item in members if not looks_like_playlist(item["url"])]
        video: dict | None = None
        if playlists and resolved < 15:
            seed = max(playlists, key=manifest_preference)
            resolved += 1
            url, quality, duration, options = resolve(seed["url"], log)
            options = [option for option in options if int(option.get("bytes") or 0) >= 1024]
            if options:
                chosen = url if any(option["url"] == url for option in options) else options[0]["url"]
                match = next(option for option in options if option["url"] == chosen)
                video = {
                    "url": chosen,
                    "quality": match.get("label") or quality,
                    "duration": duration or 0.0,
                    "options": options,
                    "bytes": int(match.get("bytes") or 0),
                }
                consumed.update(option["url"] for option in options)
                consumed.add(seed["url"])
        if video is None and files:
            options = [option for option in file_options(files) if int(option.get("bytes") or 0) >= 1024]
            if options:
                best = options[0]
                video = {
                    "url": best["url"],
                    "quality": best["label"],
                    "duration": 0.0,
                    "options": options if len(options) > 1 else [],
                    "bytes": int(best.get("bytes") or 0),
                }
        elif video is None and playlists:
            seed = max(playlists, key=rank_candidate)
            video = {"url": seed["url"], "quality": "", "duration": 0.0, "options": [], "bytes": 0}
        if video is None:
            continue
        consumed.update(item["url"] for item in members)
        preview = any(is_side_preview(item["url"]) for item in members)
        source = max(playlists, key=manifest_preference)["url"] if playlists else video["url"]
        name = pretty_name(source)
        video["title"] = f"Prévia · {name}" if preview else name
        video["preview"] = preview
        video["owned"] = any(item.get("owned") for item in members)
        video["bytes"] = int(video.get("bytes") or 0)
        if float(video.get("duration") or 0) <= 0.5 and video["bytes"] >= 1024 and measure and not looks_like_playlist(video["url"]):
            try:
                video["duration"] = float(measure(video["url"], video["bytes"]) or 0)
            except Exception:
                video["duration"] = 0.0
        if is_listed_video(video):
            videos.append(video)
    videos.sort(key=main_rank, reverse=True)
    if videos:
        for video in videos:
            video["principal"] = False
        videos[0]["principal"] = True
    if on_video:
        for video in videos:
            on_video(dict(video))
    return videos


def is_listed_video(video: dict) -> bool:
    if video.get("preview"):
        return False
    duration = float(video.get("duration") or 0)
    size = int(video.get("bytes") or 0)
    return duration > 0.5 and size >= 1024


def looks_like_quality(label: str) -> bool:
    return bool(re.fullmatch(r"\d{3,4}p|\d+×\d+|\d+ kbps", (label or "").strip()))


def clean_quality(label: str) -> str:
    label = (label or "").strip()
    return label if looks_like_quality(label) else "Original"


def format_bytes(size: int) -> str:
    size = int(size or 0)
    if size < 1024:
        return ""
    value = size / 1024
    for unit in ("KB", "MB", "GB"):
        if value < 1024 or unit == "GB":
            number = f"{value:.1f}" if unit == "GB" else f"{value:.0f}"
            return f"{number} {unit}"
        value /= 1024
    return ""


def main_rank(video: dict) -> tuple:
    duration = float(video.get("duration") or 0)
    labels = [video.get("quality") or ""] + [option.get("label") or "" for option in video.get("options") or []]
    real_quality = any(looks_like_quality(label) for label in labels)
    tiny = 0 < duration < 30
    return (
        bool(video.get("owned")),
        not video.get("preview"),
        not tiny,
        real_quality,
        duration,
        len(video.get("options") or []),
        int(video.get("bytes") or 0),
    )


def cookie_header(cookies: list[dict], urls: list[str]) -> str:
    hosts: set[str] = set()
    for url in urls:
        host = (urllib.parse.urlparse(url).hostname or "").lower()
        if not host:
            continue
        hosts.add(host)
        parts = host.split(".")
        if len(parts) >= 2:
            hosts.add(".".join(parts[-2:]))

    picked: dict[str, str] = {}
    for cookie in cookies:
        domain = cookie.get("domain", "").lstrip(".").lower()
        if hosts and not any(domain == host or host.endswith("." + domain) or domain.endswith(host) for host in hosts):
            continue
        picked[cookie["name"]] = cookie["value"]
    return "; ".join(f"{name}={value}" for name, value in picked.items())


def request_headers(referer: str, user_agent: str, cookies: str) -> dict[str, str]:
    origin = urllib.parse.urlparse(referer)
    headers = {
        "User-Agent": user_agent,
        "Referer": referer,
        "Accept": "*/*",
    }
    if origin.scheme and origin.netloc:
        headers["Origin"] = f"{origin.scheme}://{origin.netloc}"
    if cookies:
        headers["Cookie"] = cookies
    return headers


def fetch_text(url: str, headers: dict[str, str], limit: int = 2_000_000) -> str:
    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=40) as response:
        data = response.read(limit)
        charset = response.headers.get_content_charset() or "utf-8"
    return data.decode(charset, "replace")


def list_variants(playlist: str, playlist_url: str) -> list[dict]:
    found: list[dict] = []
    pending: dict | None = None
    for raw in playlist.splitlines():
        line = raw.strip()
        if line.startswith("#EXT-X-STREAM-INF"):
            bandwidth = STREAM_INF_BW.search(line)
            resolution = STREAM_INF_RES.search(line)
            width = int(resolution.group(1)) if resolution else 0
            height = int(resolution.group(2)) if resolution else 0
            pending = {
                "bandwidth": int(bandwidth.group(1)) if bandwidth else 0,
                "pixels": width * height,
                "width": width,
                "height": height,
            }
            continue
        if pending is None or not line or line.startswith("#"):
            continue
        pending["url"] = urllib.parse.urljoin(playlist_url, line)
        found.append(pending)
        pending = None
    return label_variants(found)


def list_mpd_variants(xml: str, mpd_url: str) -> list[dict]:
    found: list[dict] = []
    pattern = re.compile(r"<Representation\b([^>]*?)(?:/>|>(.*?)</Representation>)", re.I | re.S)
    for attrs, body in pattern.findall(xml):
        if re.search(r"""mimeType\s*=\s*['"]audio""", attrs, re.I):
            continue
        width_match = re.search(r"""width\s*=\s*['"](\d+)""", attrs, re.I)
        height_match = re.search(r"""height\s*=\s*['"](\d+)""", attrs, re.I)
        bandwidth_match = re.search(r"""bandwidth\s*=\s*['"](\d+)""", attrs, re.I)
        base_match = re.search(r"<BaseURL>\s*([^<]+?)\s*</BaseURL>", body or "", re.I)
        if not base_match:
            continue
        width = int(width_match.group(1)) if width_match else 0
        height = int(height_match.group(1)) if height_match else 0
        found.append(
            {
                "url": urllib.parse.urljoin(mpd_url, base_match.group(1).strip()),
                "width": width,
                "height": height,
                "pixels": width * height,
                "bandwidth": int(bandwidth_match.group(1)) if bandwidth_match else 0,
                "length": 0,
            }
        )
    return label_variants(found)


def best_variant(playlist: str, playlist_url: str) -> dict | None:
    variants = list_variants(playlist, playlist_url)
    return variants[0] if variants else None


def looks_like_playlist(url: str) -> bool:
    lowered = url.lower()
    path = urllib.parse.urlparse(lowered).path
    return path.endswith((".m3u8", ".mpd")) or ".m3u8" in lowered or "multi=" in lowered


def read_mp4_duration(data: bytes) -> float:
    index = 0
    while True:
        found = data.find(b"mvhd", index)
        if found < 0 or found + 24 > len(data):
            return 0.0
        version = data[found + 4]
        timescale = 0
        units = 0
        if version == 0 and found + 24 <= len(data):
            timescale = int.from_bytes(data[found + 16:found + 20], "big")
            units = int.from_bytes(data[found + 20:found + 24], "big")
        elif version == 1 and found + 36 <= len(data):
            timescale = int.from_bytes(data[found + 24:found + 28], "big")
            units = int.from_bytes(data[found + 28:found + 36], "big")
        if timescale > 0 and units > 0:
            seconds = units / timescale
            if 0.5 < seconds < 24 * 60 * 60:
                return seconds
        index = found + 4


def probe_file_duration(url: str, headers: dict[str, str], length: int = 0) -> float:
    path = urllib.parse.urlparse(url).path.lower()
    if not path.endswith((".mp4", ".m4v", ".mov")):
        return 0.0

    def read_range(start: int, end: int) -> bytes:
        ranged = dict(headers)
        ranged["Range"] = f"bytes={start}-{end}"
        request = urllib.request.Request(url, headers=ranged)
        with urllib.request.urlopen(request, timeout=12) as response:
            return response.read(512 * 1024)

    try:
        seconds = read_mp4_duration(read_range(0, 524287))
        if seconds > 0.5:
            return seconds
        if length > 600_000:
            start = length - 262144
            return read_mp4_duration(read_range(start, length - 1))
    except Exception:
        return 0.0
    return 0.0


def playlist_seconds(playlist: str) -> float:
    total = 0.0
    for line in playlist.splitlines():
        if not line.startswith("#EXTINF:"):
            continue
        raw = line.split(":", 1)[1].split(",", 1)[0].strip()
        try:
            total += float(raw)
        except ValueError:
            continue
    return total


def note_duration(stop: StopFlag | None, playlist: str) -> None:
    if stop is None:
        return
    total = playlist_seconds(playlist)
    if total > 1:
        stop.duration = max(stop.duration, total)


def choose_stream(url: str, headers: dict[str, str], log, stop: StopFlag | None = None) -> tuple[str, str]:
    if not looks_like_playlist(url):
        return url, ""
    try:
        playlist = fetch_text(url, headers)
    except Exception as exc:
        log(f"Não consegui ler a lista de qualidades ({exc}). Vou baixar o endereço que o player pediu.")
        return url, ""
    if "#EXT-X-STREAM-INF" not in playlist:
        note_duration(stop, playlist)
        return url, ""
    variant = best_variant(playlist, url)
    if not variant:
        return url, ""
    label = variant["label"] or f"{variant['bandwidth']} bps"
    log(f"Melhor qualidade encontrada: {label}")
    try:
        note_duration(stop, fetch_text(variant["url"], headers))
    except Exception:
        pass
    return variant["url"], label


def resolve_variant(request, url: str, log) -> tuple[str, str, float, list[dict]]:
    if not looks_like_playlist(url):
        return url, "", 0.0, []
    try:
        response = request.get(url, timeout=30000)
        if not response.ok:
            return url, "", 0.0, []
        playlist = response.text()
    except Exception:
        return url, "", 0.0, []
    if "<MPD" in playlist[:2000] or urllib.parse.urlparse(url).path.lower().endswith(".mpd"):
        variants = list_mpd_variants(playlist, url)
    else:
        variants = list_variants(playlist, url)
    if not variants:
        return url, "", playlist_seconds(playlist), []
    variant = variants[0]
    label = variant["label"]
    log(f"Qualidades encontradas: {', '.join(item['label'] for item in variants)}")
    seconds = 0.0
    try:
        media = request.get(variant["url"], timeout=30000)
        if media.ok:
            seconds = playlist_seconds(media.text())
    except Exception:
        pass
    options = []
    for item in variants:
        bandwidth = int(item.get("bandwidth") or 0)
        size = int(bandwidth * seconds / 8) if bandwidth and seconds > 1 else int(item.get("length") or 0)
        options.append({"url": item["url"], "label": item["label"], "bytes": size})
    return variant["url"], label, seconds, options


def unique_path(folder: Path, stem: str, suffix: str) -> Path:
    folder.mkdir(parents=True, exist_ok=True)
    candidate = folder / f"{stem}{suffix}"
    index = 2
    while candidate.exists():
        candidate = folder / f"{stem} ({index}){suffix}"
        index += 1
    return candidate


def ffmpeg_exe() -> str:
    try:
        import imageio_ffmpeg
    except ImportError as exc:
        raise DownloadError("Não encontrei o ffmpeg dentro do programa.") from exc
    return imageio_ffmpeg.get_ffmpeg_exe()


def run_ffmpeg(cmd: list[str], progress_file: Path, log, stop: StopFlag | None = None, progress=None) -> None:
    stderr_file = progress_file.with_suffix(".err")
    creationflags = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
    with stderr_file.open("w", encoding="utf-8", errors="replace") as errors:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.DEVNULL,
            stderr=errors,
            creationflags=creationflags,
        )
        if stop is not None:
            stop.watch(process)
        last_second = -1
        try:
            while process.poll() is None:
                if stop is not None and stop.cancelled():
                    kill_process(process)
                    break
                seconds = read_progress_seconds(progress_file)
                if seconds is not None and seconds != last_second:
                    last_second = seconds
                    if stop is not None and stop.duration:
                        ratio = min(1.0, seconds / stop.duration)
                        text = f"Baixando  {int(ratio * 100)}%"
                    else:
                        ratio = None
                        text = "Baixando…"
                    emit(log, progress, text, ratio)
                time.sleep(0.4)
        finally:
            if stop is not None:
                stop.clear_process()
    if stop is not None and stop.cancelled():
        raise Cancelled("Download cancelado.")
    if process.returncode != 0:
        detail = stderr_file.read_text(encoding="utf-8", errors="replace").strip()
        tail = "\n".join(detail.splitlines()[-12:])
        raise DownloadError(tail or f"ffmpeg terminou com código {process.returncode}")


def read_progress_seconds(path: Path) -> int | None:
    if not path.exists():
        return None
    clock_text = ""
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        if line.startswith("out_time=") and not line.startswith(("out_time_ms=", "out_time_us=")):
            clock_text = line.split("=", 1)[1].strip()
    parts = clock_text.split(":")
    if len(parts) != 3:
        return None
    try:
        total = int(float(parts[0])) * 3600 + int(float(parts[1])) * 60 + int(float(parts[2]))
    except ValueError:
        return None
    if total <= 0:
        return None
    return total


def ffmpeg_command(executable: str, url: str, header_blob: str, destination: Path, progress: Path, mode: str) -> list[str]:
    command = [executable, "-y", "-hide_banner", "-loglevel", "error"]
    if header_blob:
        command.extend([
            "-reconnect", "1",
            "-reconnect_streamed", "1",
            "-reconnect_delay_max", "5",
            "-http_persistent", "0",
            "-headers", header_blob,
        ])
    command.extend(["-i", url])
    if mode == "transcode":
        command.extend(["-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-c:a", "aac"])
    else:
        command.extend(["-c", "copy"])
        if mode == "aac":
            command.extend(["-bsf:a", "aac_adtstoasc"])
    command.extend(["-movflags", "+faststart", "-progress", str(progress), "-nostats", str(destination)])
    return command


def download_with_ffmpeg(url: str, headers: dict[str, str], destination: Path, log, stop: StopFlag | None = None, progress=None) -> None:
    executable = ffmpeg_exe()
    header_blob = "".join(f"{key}: {value}\r\n" for key, value in headers.items())
    progress_file = destination.with_suffix(".progress")
    last_error = ""
    try:
        for mode in ("aac", "copy", "transcode"):
            if stop is not None:
                stop.checkpoint()
            if destination.exists():
                destination.unlink()
            progress_file.unlink(missing_ok=True)
            try:
                run_ffmpeg(
                    ffmpeg_command(executable, url, header_blob, destination, progress_file, mode),
                    progress_file,
                    log,
                    stop=stop,
                    progress=progress,
                )
                if stop is not None and stop.cancelled():
                    raise Cancelled("Download cancelado.")
                if destination.exists() and destination.stat().st_size > 0:
                    return
                last_error = "O arquivo saiu vazio."
            except Cancelled:
                destination.unlink(missing_ok=True)
                raise
            except DownloadError as exc:
                last_error = str(exc)
                continue
        raise DownloadError(last_error or "Não consegui montar o MP4.")
    finally:
        progress_file.unlink(missing_ok=True)
        progress_file.with_suffix(".err").unlink(missing_ok=True)


def is_mp4_file(path: Path) -> bool:
    try:
        with path.open("rb") as handle:
            return b"ftyp" in handle.read(64)
    except OSError:
        return False


def download_direct(url: str, headers: dict[str, str], destination: Path, log, stop: StopFlag | None = None, progress=None) -> None:
    if stop is not None:
        stop.checkpoint()
    request = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            content_type = (response.headers.get("content-type") or "").lower()
            if "mpegurl" in content_type or "dash" in content_type:
                raise DownloadError("PLAYLIST")
            total = int(response.headers.get("content-length") or 0)
            done = 0
            last_pct = -1
            with destination.open("wb") as handle:
                while True:
                    if stop is not None:
                        stop.checkpoint()
                    chunk = response.read(1024 * 256)
                    if not chunk:
                        break
                    if done == 0 and chunk.lstrip().startswith(b"#EXTM3U"):
                        raise DownloadError("PLAYLIST")
                    handle.write(chunk)
                    done += len(chunk)
                    if total:
                        pct = int(done * 100 / total)
                        if pct != last_pct:
                            emit(log, progress, f"Baixando  {pct}%", pct / 100)
                            last_pct = pct
                    elif done % (2 * 1024 * 1024) < len(chunk):
                        emit(log, progress, f"Baixando  {done / (1024 * 1024):.0f} MB", None)
    except Cancelled:
        destination.unlink(missing_ok=True)
        raise
    if stop is not None and stop.cancelled():
        destination.unlink(missing_ok=True)
        raise Cancelled("Download cancelado.")
    if destination.stat().st_size <= 0:
        raise DownloadError("O arquivo saiu vazio.")


def save_media(url: str, referer: str, user_agent: str, cookies: str, folder: Path, title: str, log, stop: StopFlag | None = None, progress=None) -> Path:
    if stop is not None:
        stop.checkpoint()
    headers = request_headers(referer, user_agent, cookies)
    stream_url, _label = choose_stream(url, headers, log, stop=stop)
    destination = unique_path(folder, safe_name(title), ".mp4")
    if stop is not None:
        stop.partial = destination
        stop.checkpoint()
    log(f"Salvando em {destination}")
    playlist = looks_like_playlist(stream_url)
    if not playlist:
        try:
            download_direct(stream_url, headers, destination, log, stop=stop, progress=progress)
            if is_mp4_file(destination):
                return destination
            raw = destination.with_suffix(".source")
            destination.replace(raw)
            try:
                log("Convertendo para MP4…")
                download_with_ffmpeg(str(raw), {}, destination, log, stop=stop, progress=progress)
            finally:
                raw.unlink(missing_ok=True)
            return destination
        except Cancelled:
            raise
        except DownloadError as exc:
            if str(exc) != "PLAYLIST":
                raise
            log("O endereço era uma lista, não um MP4 solto. Montando o vídeo…")
        except urllib.error.HTTPError as exc:
            if exc.code not in (403, 401):
                raise DownloadError(f"O servidor recusou o arquivo ({exc.code}).") from exc
            log("Download direto recusado. Tentando pelo ffmpeg…")
    download_with_ffmpeg(stream_url, headers, destination, log, stop=stop, progress=progress)
    return destination


def open_context(playwright):
    profile = APP_DIR / "perfil"
    profile.mkdir(parents=True, exist_ok=True)
    errors = []
    base = {
        "user_data_dir": str(profile),
        "headless": False,
        "locale": "pt-BR",
        "viewport": {"width": 1280, "height": 720},
        "args": [
            "--window-position=-32000,-32000",
            "--window-size=1280,720",
            "--start-minimized",
            "--autoplay-policy=no-user-gesture-required",
            "--mute-audio",
            "--disable-blink-features=AutomationControlled",
        ],
        "ignore_default_args": ["--enable-automation"],
    }
    for channel in ("msedge", "chrome", None):
        try:
            options = dict(base)
            if channel:
                options["channel"] = channel
            context = playwright.chromium.launch_persistent_context(**options)
            context.add_init_script(
                "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
            )
            return context
        except Exception as exc:
            errors.append(str(exc).splitlines()[0])
    message = "\n".join(errors[:3])
    if any(token in message.lower() for token in ("already", "user data", "singleton", "em uso")):
        raise DownloadError("A janela do baixador já está aberta. Fecha ela e tenta de novo.")
    raise DownloadError(
        "Não consegui abrir o Edge. Confere se o Microsoft Edge está instalado "
        "e se não há outra janela do baixador aberta.\n" + message
    )


def tuck_away(context, page) -> None:
    try:
        session = context.new_cdp_session(page)
        info = session.send("Browser.getWindowForTarget")
        session.send(
            "Browser.setWindowBounds",
            {"windowId": info["windowId"], "bounds": {"windowState": "minimized"}},
        )
    except Exception:
        pass


def read_preview(page) -> dict:
    try:
        info = page.evaluate(
            """() => {
                const meta = (sel) => {
                    const el = document.querySelector(sel);
                    return el ? (el.content || '') : '';
                };
                const abs = (value) => {
                    const src = String(value || '').trim();
                    if (!src || src.startsWith('data:')) return '';
                    try { return new URL(src, location.href).href; } catch (e) { return ''; }
                };
                const heading = document.querySelector('h1');
                const og = document.querySelector('meta[property="og:title"]');
                const poster = [...document.querySelectorAll('video')].find((video) => video.poster && !video.closest('a'));
                return {
                    title: (heading && heading.innerText) || (og && og.content) || document.title || '',
                    image: abs(
                        meta('meta[property="og:image"]')
                        || meta('meta[property="og:image:secure_url"]')
                        || meta('meta[name="twitter:image"]')
                        || (poster && poster.poster)
                        || ''
                    ),
                };
            }"""
        )
    except Exception:
        return {"title": "", "image": ""}
    return info or {"title": "", "image": ""}


def fetch_preview_image(request, url: str, timeout: int = 20000, referer: str = "") -> bytes:
    if not url or not str(url).startswith(("http://", "https://", "//")):
        return b""
    if str(url).startswith("//"):
        url = "https:" + url
    headers = {"Referer": referer} if referer else None
    try:
        response = request.get(url, timeout=timeout, headers=headers)
        if not response.ok:
            return b""
        body = response.body()
        content_type = (response.headers.get("content-type") or "").lower()
    except Exception:
        return b""
    if "image" not in content_type and not body.startswith((b"\xff\xd8", b"\x89PNG", b"RIFF")):
        return b""
    if len(body) < 400:
        return b""
    return body


def read_gallery(page) -> list[dict]:
    try:
        cards = page.evaluate(
            """() => {
                const out = [];
                const seen = new Set();
                const abs = (value) => {
                    const src = String(value || '').trim();
                    if (!src || src.startsWith('data:')) return '';
                    try { return new URL(src, location.href).href; } catch (e) { return ''; }
                };
                const bad = (src) => /sprite|favicon|logo|icon|blank|pixel|1x1|spacer|avatar|emoji/i.test(src);
                const push = (title, image, link) => {
                    const src = abs(image);
                    let name = String(title || '').replace(/\\s+/g, ' ').trim();
                    if (name.length > 140) name = '';
                    if (!src || seen.has(src) || bad(src)) return;
                    if (/\\.(svg|gif)(\\?|$)/i.test(src)) return;
                    seen.add(src);
                    out.push({ title: name, image: src, link: abs(link) });
                };
                const sourceOf = (img) => {
                    const srcset = img.getAttribute('srcset') || img.getAttribute('data-srcset') || '';
                    const fromSet = srcset.split(',')[0].trim().split(/\\s+/)[0];
                    return img.getAttribute('data-src')
                        || img.getAttribute('data-original')
                        || img.getAttribute('data-thumb')
                        || img.getAttribute('data-lazy')
                        || img.getAttribute('data-bg')
                        || fromSet
                        || img.currentSrc
                        || img.getAttribute('src')
                        || '';
                };
                const og = document.querySelector('meta[property="og:image"]');
                const h1 = document.querySelector('h1');
                const pageTitle = (h1 && h1.innerText) || document.title || '';
                if (og && og.content) push(pageTitle, og.content, location.href);
                const player = [...document.querySelectorAll('video')].find((video) => video.poster && !video.closest('a'))
                    || document.querySelector('video');
                if (player && player.poster) push(pageTitle, player.poster, location.href);
                for (const img of document.querySelectorAll('img, video')) {
                    const attrW = parseInt(img.getAttribute('width') || '0', 10);
                    if (attrW && attrW < 60) continue;
                    const src = img.tagName === 'VIDEO' ? (img.getAttribute('poster') || '') : sourceOf(img);
                    let title = img.getAttribute('alt') || img.getAttribute('title') || '';
                    const card = img.closest('a, article, li, figure') || img.parentElement;
                    if (card) {
                        const heading = card.querySelector('h2, h3, h4, h5');
                        const linkTitle = card.getAttribute('title') || card.getAttribute('aria-label') || '';
                        if (heading && heading.innerText.trim()) title = heading.innerText;
                        else if (linkTitle) title = linkTitle;
                        else if (!title) {
                            title = (card.innerText || '').trim().split('\\n').map((line) => line.trim()).filter(Boolean)[0] || '';
                        }
                    }
                    push(title, src, (img.closest('a') && img.closest('a').href) || '');
                    if (out.length >= 40) break;
                }
                return out;
            }"""
        )
    except Exception:
        return []
    return cards or []


def link_markers(url: str) -> set[str]:
    path = urllib.parse.unquote(urllib.parse.urlparse(url).path)
    markers = set(re.findall(r"\d{5,}", path))
    name = path.rstrip("/").rsplit("/", 1)[-1]
    stem = re.sub(r"\.(m3u8|mpd|mp4|webm|m4v|mkv|mov|jpe?g|png|webp)$", "", name, flags=re.I)
    stem = stem.strip("-_").lower()
    if len(stem) >= 8 and not re.fullmatch(r"[0-9a-f]+", stem):
        markers.add(stem)
    return markers


def same_item(left: str, right: str) -> bool:
    if not left or not right:
        return False
    return bool(link_markers(left) & link_markers(right))


def _plain(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def ugly_title(title: str) -> bool:
    plain = _plain(title)
    if not plain:
        return True
    compact = re.sub(r"\s+", "", plain)
    if compact in {"video", "preview", "previa", "tpl"}:
        return True
    if re.fullmatch(r"[0-9a-f]{6,}", compact) or re.fullmatch(r"\d{4,}", compact):
        return True
    if re.fullmatch(r"\d+\s*video", plain):
        return True
    words = [word for word in plain.split() if word not in {"video", "mp4"}]
    return len(words) == 1 and (words[0].isdigit() or len(words[0]) <= 3)


def attach_covers(request, videos: list[dict], gallery: list[dict], page_image: bytes, page_title: str, referer: str = "") -> None:
    page_title = re.sub(r"\s+", " ", page_title or "").strip()
    if videos and page_image:
        videos[0]["image"] = page_image
    cards: list[dict] = []
    seen: set[str] = set()
    for card in gallery:
        url = str(card.get("image") or "")
        if url.startswith("//"):
            url = "https:" + url
        title = re.sub(r"\s+", " ", str(card.get("title") or "")).strip()
        if not url.startswith("http") or url in seen:
            continue
        seen.add(url)
        link = str(card.get("link") or "")
        if link.startswith("//"):
            link = "https:" + link
        cards.append({"title": title[:80], "image": url, "link": link})
    used: set[str] = set()
    if videos and videos[0].get("image") and cards:
        used.add(cards[0]["image"])
    for video in videos[1:]:
        video_url = video.get("url") or ""
        name = _plain(video.get("title") or "")
        chosen = None
        for card in cards:
            if card["image"] in used:
                continue
            if same_item(video_url, card.get("link") or ""):
                chosen = card
                break
        if chosen is None and name and not ugly_title(video.get("title") or ""):
            for card in cards:
                if card["image"] in used:
                    continue
                other = _plain(card["title"])
                if other and (name in other or other in name):
                    chosen = card
                    break
        if chosen is None:
            continue
        video["image_url"] = chosen["image"]
        if chosen["title"]:
            video["title"] = chosen["title"]
        used.add(chosen["image"])
    if videos and not videos[0].get("image"):
        for card in cards[:4]:
            data = fetch_preview_image(request, card.get("image") or "", timeout=8000, referer=referer)
            if data:
                videos[0]["image"] = data
                used.add(card["image"])
                break
    fetched = 0
    for video in videos:
        url = video.get("image_url") or ""
        if not url or video.get("image"):
            continue
        if fetched >= 24:
            break
        fetched += 1
        data = fetch_preview_image(request, url, timeout=8000, referer=referer)
        if data:
            video["image"] = data
    for video in videos:
        if video is videos[0] and not video.get("image") and page_image:
            video["image"] = page_image
        if page_title and video is videos[0]:
            video["title"] = page_title


def page_is_blocked(page) -> bool:
    try:
        title = page.title().lower()
    except Exception:
        return False
    if not title:
        return False
    return any(phrase in title for phrase in ("just a moment", "um momento", "attention required", "checking your browser"))


def wait_until_ready(page, log, stop: StopFlag | None = None) -> None:
    warned = False
    deadline = time.time() + 20
    while time.time() < deadline:
        if stop is not None:
            stop.checkpoint()
        if not page_is_blocked(page):
            return
        if not warned:
            log("O site está verificando a visita. A busca continua em segundo plano.")
            warned = True
        page.wait_for_timeout(500)
    if not page_is_blocked(page):
        return
    raise DownloadError("O site bloqueou a busca em segundo plano. Espera um pouco e clica em Buscar de novo.")


def nudge_page(page) -> str:
    try:
        return page.evaluate(
            """() => {
                const textOf = (el) => (el.innerText || el.value || el.getAttribute('aria-label') || '').trim();
                const interesting = /(play|assistir|watch|enter|entrar|continue|continuar|aceito|concordo|agree|i am|i'm|tenho 18|sou maior|18\\+|anos ou mais|years old|over 18|^yes$|^sim$)/i;
                for (const el of document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]')) {
                    const text = textOf(el);
                    if (text && text.length < 80 && interesting.test(text)) {
                        el.click();
                    }
                }
                const path = location.pathname || '';
                const idMatch = path.match(/\\/(\\d{5,})(?:\\/|$)/);
                const pageId = idMatch ? idMatch[1] : '';
                const videos = [...document.querySelectorAll('video')];
                const scoreOf = (video) => {
                    let score = 0;
                    const parent = video.parentElement;
                    const around = `${video.id || ''} ${video.className || ''} ${video.getAttribute('poster') || ''} ${video.currentSrc || ''} ${video.src || ''} ${parent ? parent.id : ''} ${parent ? parent.className : ''}`;
                    if (pageId && around.includes(pageId)) score += 80;
                    if (video.closest('a')) score -= 40;
                    const box = video.getBoundingClientRect();
                    score += Math.min(box.width || 0, 1280) / 20;
                    score += Math.min(parseInt(video.getAttribute('width') || '0', 10) || 0, 1280) / 20;
                    if (video.poster) score += 8;
                    return score;
                };
                const loose = videos.filter((video) => !video.closest('a'));
                const pool = loose.length ? loose : videos;
                pool.sort((a, b) => scoreOf(b) - scoreOf(a));
                const video = pool[0];
                if (video) {
                    video.muted = true;
                    const play = video.play();
                    if (play && play.catch) play.catch(() => {});
                }
                const heading = document.querySelector('h1');
                const og = document.querySelector('meta[property="og:title"]');
                return (heading && heading.innerText) || (og && og.content) || document.title || '';
            }"""
        ) or ""
    except Exception:
        return ""


def collect_player(page, found: list[dict]) -> None:
    try:
        urls = page.evaluate(
            """() => {
                const path = location.pathname || '';
                const idMatch = path.match(/\\/(\\d{5,})(?:\\/|$)/);
                const pageId = idMatch ? idMatch[1] : '';
                const videos = [...document.querySelectorAll('video')];
                const scoreOf = (video) => {
                    let score = 0;
                    const parent = video.parentElement;
                    const around = `${video.id || ''} ${video.className || ''} ${video.getAttribute('poster') || ''} ${video.currentSrc || ''} ${video.src || ''} ${parent ? parent.id : ''} ${parent ? parent.className : ''}`;
                    if (pageId && around.includes(pageId)) score += 80;
                    if (video.closest('a')) score -= 40;
                    score += Math.min(video.getBoundingClientRect().width || 0, 1280) / 20;
                    if (video.poster) score += 8;
                    return score;
                };
                videos.sort((a, b) => scoreOf(b) - scoreOf(a));
                const video = videos[0];
                if (!video) return [];
                const urls = [];
                if (video.currentSrc) urls.push(video.currentSrc);
                if (video.src) urls.push(video.src);
                for (const source of video.querySelectorAll('source')) {
                    if (source.src) urls.push(source.src);
                }
                return urls;
            }"""
        )
    except Exception:
        return
    for url in urls or []:
        if is_media(url, ""):
            found.append({"url": url, "ct": "", "length": 0, "source": "player", "owned": True})


def collect_from_page(page, found: list[dict]) -> None:
    try:
        html = page.content()
    except Exception:
        html = ""
    for url in urls_in_text(html):
        found.append({"url": url, "ct": "", "length": 0, "source": "page"})
    try:
        resources = page.evaluate(
            """() => {
                const urls = [];
                for (const node of document.querySelectorAll('video, video source, a')) {
                    if (node.currentSrc) urls.push(node.currentSrc);
                    if (node.src) urls.push(node.src);
                    if (node.href) urls.push(node.href);
                }
                for (const entry of performance.getEntriesByType('resource')) urls.push(entry.name);
                return urls;
            }"""
        )
    except Exception:
        resources = []
    for url in resources:
        if is_media(url, ""):
            found.append({"url": url, "ct": "", "length": 0, "source": "network"})


def find_on_page(page_url: str, log, stop: StopFlag | None = None, report=None) -> dict:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as exc:
        raise DownloadError("Não encontrei o navegador interno do programa.") from exc

    found: list[dict] = []

    def on_response(response) -> None:
        try:
            url = response.url
            content_type = response.headers.get("content-type", "")
            length = int(response.headers.get("content-length") or 0)
        except Exception:
            return
        if is_media(url, content_type):
            found.append({"url": url, "ct": content_type, "length": length, "source": "network"})

    log("Buscando o vídeo em segundo plano…")
    with sync_playwright() as playwright:
        context = open_context(playwright)
        try:
            context.on("response", on_response)
            page = context.pages[0] if context.pages else context.new_page()
            tuck_away(context, page)
            if stop is not None:
                stop.checkpoint()
            try:
                page.goto(page_url, wait_until="commit", timeout=30000)
            except Exception as exc:
                current = ""
                try:
                    current = page.url or ""
                except Exception:
                    current = ""
                started = current not in ("", "about:blank")
                lowered = str(exc).lower()
                if started and ("timeout" in lowered or "timed out" in lowered):
                    log("A página está demorando. A busca continua.")
                else:
                    raise DownloadError(explain_failure(exc)) from exc
            tuck_away(context, page)
            wait_until_ready(page, log, stop=stop)
            title = ""
            deadline = time.time() + 28
            scan_started = time.time()
            seen = 0
            quiet_since = time.time()
            published_keys: set[str] = set()

            def publish(video: dict) -> None:
                key = group_key(video.get("url") or "")
                if not key or key in published_keys or not report:
                    return
                published_keys.add(key)
                report("video", video)

            while time.time() < deadline:
                if stop is not None:
                    stop.checkpoint()
                title = nudge_page(page) or title
                collect_player(page, found)
                collect_from_page(page, found)
                count = len(dedupe_media(found))
                if count != seen:
                    seen = count
                    quiet_since = time.time()
                    log(f"Achei {count} endereço(s) de vídeo…")
                    assemble_videos(
                        found,
                        lambda _url, _log: ("", "", 0.0, []),
                        log,
                        on_video=publish,
                        page_url=page_url,
                    )
                elif count and time.time() - quiet_since > 3.5:
                    break
                if report:
                    report("progress", min(0.4, (time.time() - scan_started) / 28 * 0.4))
                page.wait_for_timeout(500)
            if not title:
                title = nudge_page(page)
            collect_from_page(page, found)
            preview = read_preview(page)
            if not title:
                title = preview.get("title") or ""

            def resolve(url: str, progress_log) -> tuple[str, str, float, list[dict]]:
                return resolve_variant(context.request, url, progress_log)

            probes = {"count": 0}

            def measure(url: str, length: int = 0) -> float:
                if probes["count"] >= 8:
                    return 0.0
                probes["count"] += 1
                user_agent = page.evaluate("() => navigator.userAgent")
                headers = request_headers(page_url, user_agent, cookie_header(context.cookies(), [page_url, url]))
                return probe_file_duration(url, headers, length)

            videos = assemble_videos(
                found,
                resolve,
                log,
                on_video=publish,
                on_step=lambda ratio: report and report("progress", ratio),
                measure=measure,
                page_url=page_url,
            )
            if "just a moment" in title.lower() or "um momento" in title.lower():
                title = ""
            title = re.sub(r"\s+", " ", title).strip()
            gallery = read_gallery(page)
            image = fetch_preview_image(context.request, preview.get("image") or "", referer=page_url)
            attach_covers(context.request, videos, gallery, image, title, referer=page_url)
            if report:
                report("progress", 1)
            user_agent = page.evaluate("() => navigator.userAgent")
            cookies = context.cookies()
            tuck_away(context, page)
        finally:
            context.close()

    if not videos:
        raise DownloadError(
            "Abri a página, mas não achei um arquivo de vídeo que dê para salvar.\n"
            "O endereço blob: do player não é o arquivo. Se o site usa DRM "
            "(Netflix, Prime, Disney+ e parecidos), o vídeo fica criptografado e não sai da página.\n"
            "Confere se o link abre o player e tenta de novo."
        )
    if "just a moment" in title.lower() or "um momento" in title.lower():
        title = ""
    title = re.sub(r"\s+", " ", title).strip()
    if videos:
        for video in videos:
            video["principal"] = False
        videos[0]["principal"] = True
        if title:
            videos[0]["title"] = title
    return {
        "videos": videos,
        "image": image,
        "user_agent": user_agent,
        "cookies": cookie_header(cookies, [page_url] + [video["url"] for video in videos]),
        "referer": page_url,
    }


def download_page(page_url: str, folder: Path, log, detect_only: bool = False, stop: StopFlag | None = None, progress=None) -> Path | None:
    parsed = urllib.parse.urlparse(page_url.strip())
    if parsed.scheme not in ("http", "https"):
        raise DownloadError("Cola o link completo da página, começando com https://")

    direct = is_media(page_url, "")
    if direct:
        log("O link já é o arquivo de vídeo.")
        if detect_only:
            log("Modo detectar: não vou salvar o vídeo.")
            return None
        log("Baixando…")
        media = {
            "url": page_url,
            "title": safe_name(Path(parsed.path).stem or "video"),
            "user_agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0"
            ),
            "cookies": "",
            "referer": f"{parsed.scheme}://{parsed.netloc}/",
        }
        return save_media(
            media["url"],
            media["referer"],
            media["user_agent"],
            media["cookies"],
            folder,
            media["title"],
            log,
            stop=stop,
            progress=progress,
        )

    catalog = find_on_page(page_url, log, stop=stop)
    videos = catalog["videos"]
    for index, video in enumerate(videos, start=1):
        qualities = ", ".join(option["label"] for option in video.get("options") or [])
        detail = qualities or video.get("quality") or "arquivo"
        log(f"{index}. {video['title']} ({detail})")
    if detect_only:
        log("Modo detectar: não vou salvar o vídeo.")
        return None
    chosen = videos[0]
    log(f"Baixando o primeiro da lista: {chosen['title']}")
    return save_media(
        chosen["url"],
        catalog["referer"],
        catalog["user_agent"],
        catalog["cookies"],
        folder,
        chosen["title"],
        log,
        stop=stop,
        progress=progress,
    )


def run_cli(page_url: str, folder: Path, detect_only: bool) -> int:
    def log(message: str) -> None:
        print(message, flush=True)

    try:
        saved = download_page(page_url, folder, log, detect_only=detect_only)
    except DownloadError as exc:
        print(f"Erro: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:
        print(f"Erro: {explain_failure(exc)}", file=sys.stderr)
        return 1
    if saved:
        print(f"Pronto: {saved}")
    return 0


def run_gui() -> None:
    import tkinter as tk
    from tkinter import filedialog, messagebox, ttk

    bg = "#1e1e1e"
    card = "#2a2a2a"
    ink = "#f0f0f0"
    muted = "#a0a0a0"
    accent = "#3ddc84"
    accent_ink = "#06210f"
    line = "#3a3a3a"
    thumb_bg = (32, 32, 32)
    danger = "#e7b2b2"

    root = tk.Tk()
    root.title("BF Down")
    root.geometry("1120x760")
    root.minsize(880, 640)
    root.configure(bg=bg)
    icon_path = Path(__file__).resolve().parent / "android" / "app" / "src" / "main" / "res" / "mipmap-xxxhdpi" / "ic_launcher.png"
    if icon_path.exists():
        try:
            icon = tk.PhotoImage(file=str(icon_path))
            root.iconphoto(True, icon)
            root._icon = icon
        except tk.TclError:
            pass

    style = ttk.Style(root)
    try:
        style.theme_use("clam")
    except tk.TclError:
        pass
    style.configure(
        "Work.Horizontal.TProgressbar",
        troughcolor=line,
        background=accent,
        thickness=4,
        borderwidth=0,
        lightcolor=accent,
        darkcolor=accent,
    )

    def capsule(canvas, x1, y1, x2, y2, fill, outline=None, width=2, tags=None):
        def fill_shape(left, top, right, bottom, color):
            diameter = max(2, bottom - top)
            canvas.create_oval(left, top, left + diameter, bottom, fill=color, outline=color, tags=tags)
            canvas.create_oval(right - diameter, top, right, bottom, fill=color, outline=color, tags=tags)
            canvas.create_rectangle(left + diameter / 2, top, right - diameter / 2, bottom, fill=color, outline=color, tags=tags)

        stroke = outline or fill
        if stroke != fill:
            fill_shape(x1, y1, x2, y2, stroke)
            fill_shape(x1 + width, y1 + width, x2 - width, y2 - width, fill)
        else:
            fill_shape(x1, y1, x2, y2, fill)

    class Pill(tk.Canvas):
        def __init__(self, master, text, fill, fg, command=None, outline=None, height=52, width=None):
            options = {"height": height, "bg": bg, "highlightthickness": 0, "bd": 0}
            if width:
                options["width"] = width
            super().__init__(master, **options)
            self._text = text
            self._fill = fill
            self._fg = fg
            self._outline = outline or fill
            self.command = command
            self.enabled = True
            self.bind("<Configure>", lambda _event: self.redraw())
            self.bind("<Button-1>", self._click)
            self.configure(cursor="hand2")

        def redraw(self) -> None:
            self.delete("all")
            width = max(self.winfo_width(), 2)
            height = max(self.winfo_height(), 2)
            fill = self._fill if self.enabled else "#333333"
            fg = self._fg if self.enabled else "#7a7a7a"
            outline = self._outline if self.enabled else "#333333"
            self.create_rectangle(0, 0, width, height, fill=fill, outline=outline, width=1)
            self.create_text(width / 2, height / 2, text=self._text, fill=fg, font=("Segoe UI", 10))

        def set_enabled(self, enabled: bool) -> None:
            self.enabled = enabled
            self.configure(cursor="hand2" if enabled else "arrow")
            self.redraw()

        def configure(self, cnf=None, **kwargs):
            if cnf is not None and not isinstance(cnf, dict):
                return super().configure(cnf)
            if isinstance(cnf, dict):
                kwargs = {**cnf, **kwargs}
            if not kwargs:
                return super().configure()
            if "state" in kwargs:
                self.set_enabled(kwargs.pop("state") != "disabled")
            if "command" in kwargs:
                self.command = kwargs.pop("command")
            if kwargs:
                return super().configure(**kwargs)

        def _click(self, _event) -> None:
            if self.enabled and self.command:
                self.command()

        config = configure

    url_var = tk.StringVar()
    folder_var = tk.StringVar(value=str(DEFAULT_OUT))
    status_var = tk.StringVar(value="Pronto.")
    messages: queue.Queue = queue.Queue()
    working = {"value": False}
    job: dict = {"stop": None}

    stage = tk.Frame(root, bg=bg)
    shell = tk.Frame(stage, bg=bg)
    shell.pack(fill="both", expand=True, padx=8, pady=(20, 16))

    header = tk.Frame(shell, bg=bg)
    header.pack(fill="x")
    tk.Label(header, text="BF Down", bg=bg, fg=accent, font=("Segoe UI", 16, "bold"), anchor="w").pack(side="left")
    hint = tk.Label(header, text="", bg=bg, fg=muted, font=("Segoe UI", 10))

    toolbar = tk.Frame(shell, bg=bg)
    toolbar.pack(fill="x", pady=(16, 0))
    toolbar.columnconfigure(0, weight=1)
    field = tk.Canvas(toolbar, height=32, bg=bg, highlightthickness=0, bd=0)
    field.grid(row=0, column=0, sticky="ew")
    url_entry = tk.Entry(
        field,
        textvariable=url_var,
        bd=0,
        highlightthickness=0,
        relief="flat",
        bg=card,
        fg=ink,
        insertbackground=ink,
        disabledbackground=card,
        disabledforeground=muted,
        font=("Segoe UI", 10),
    )
    paste_btn = tk.Label(
        field,
        text="\uE77F",
        font=("Segoe MDL2 Assets", 12),
        bg=card,
        fg=accent,
        cursor="hand2",
    )
    entry_window = field.create_window(20, 16, window=url_entry, anchor="w")
    paste_window = field.create_window(40, 16, window=paste_btn, anchor="center")

    def draw_field(event=None) -> None:
        width = field.winfo_width()
        height = field.winfo_height()
        if width < 20:
            return
        field.delete("shape")
        field.create_rectangle(0, 0, width, height, fill=card, outline=line, width=1, tags="shape")
        field.tag_lower("shape")
        field.coords(entry_window, 18, height / 2)
        field.itemconfigure(entry_window, width=max(40, width - 78))
        field.coords(paste_window, width - 30, height / 2)

    field.bind("<Configure>", draw_field)

    def paste_link(_event=None) -> None:
        if working["value"]:
            return
        try:
            text = root.clipboard_get().strip()
        except tk.TclError:
            text = ""
        if not text:
            status_var.set("Não há nada para colar.")
            paint(muted)
            return
        url_var.set(text)

    paste_btn.bind("<Button-1>", paste_link)

    search_btn = Pill(toolbar, "Buscar", accent, accent_ink, height=32, width=88)
    search_btn.grid(row=0, column=1, padx=(12, 0), sticky="ns")

    video_frame = tk.Frame(shell, bg=card, highlightthickness=1, highlightbackground=line)
    video_frame.pack(fill="both", expand=True, pady=(18, 0))
    list_head = tk.Frame(video_frame, bg=card)
    list_head.pack(fill="x", padx=18, pady=(14, 0))
    tk.Label(list_head, text="Vídeos", bg=card, fg=muted, font=("Segoe UI", 10), anchor="w").pack(side="left")
    list_wrap = tk.Frame(video_frame, bg=card)
    list_wrap.pack(fill="both", expand=True, padx=10, pady=(8, 12))
    video_canvas = tk.Canvas(list_wrap, bg=card, highlightthickness=0, bd=0)
    video_canvas.pack(fill="both", expand=True)
    marker = tk.Canvas(list_wrap, width=4, height=48, bg="#737373", highlightthickness=0, bd=0)
    marker_job = {"id": None}

    def hide_marker() -> None:
        marker_job["id"] = None
        marker.place_forget()

    def move_marker(first: str, last: str) -> None:
        start = float(first)
        end = float(last)
        height = list_wrap.winfo_height()
        if height < 40 or end - start >= 0.995:
            hide_marker()
            return
        thumb_h = max(36, int((end - start) * height))
        thumb_h = min(thumb_h, height - 8)
        top = int(start * max(1, height - thumb_h))
        marker.place(relx=1, y=top, x=-3, width=4, height=thumb_h, anchor="ne")
        marker.lift()
        if marker_job["id"] is not None:
            root.after_cancel(marker_job["id"])
        marker_job["id"] = root.after(700, hide_marker)

    video_canvas.configure(yscrollcommand=move_marker)
    video_inner = tk.Frame(video_canvas, bg=card)
    video_window = video_canvas.create_window((0, 0), window=video_inner, anchor="nw")
    video_rows: list[dict] = []

    def fit_video_list(event=None) -> None:
        width = event.width if event is not None else video_canvas.winfo_width()
        video_canvas.itemconfigure(video_window, width=max(1, width))
        wrap = max(140, width - 196)
        for row in video_rows:
            row["name"].configure(wraplength=wrap)
        video_canvas.configure(scrollregion=video_canvas.bbox("all"))

    def wheel_video(event) -> None:
        video_canvas.yview_scroll(int(-event.delta / 120), "units")

    video_canvas.bind("<Configure>", fit_video_list)
    video_inner.bind("<Configure>", lambda _event: video_canvas.configure(scrollregion=video_canvas.bbox("all")))
    video_canvas.bind("<Enter>", lambda _event: video_canvas.bind_all("<MouseWheel>", wheel_video))
    video_canvas.bind("<Leave>", lambda _event: video_canvas.unbind_all("<MouseWheel>"))

    bar = ttk.Progressbar(shell, style="Work.Horizontal.TProgressbar", mode="determinate", maximum=100)
    bar.pack(fill="x", pady=(16, 8), ipady=0)
    status = tk.Label(
        shell,
        textvariable=status_var,
        bg=bg,
        fg=ink,
        font=("Segoe UI", 12),
        anchor="w",
        justify="left",
    )
    status.pack(anchor="w", fill="x")

    folder_row = tk.Frame(shell, bg=bg)
    folder_row.pack(fill="x", pady=(8, 0))
    tk.Label(folder_row, text="Salvar em", bg=bg, fg=muted, font=("Segoe UI", 9)).pack(side="left")
    folder_entry = tk.Label(
        folder_row,
        textvariable=folder_var,
        bg=bg,
        fg=ink,
        font=("Segoe UI", 9),
        anchor="w",
        width=34,
    )
    folder_entry.pack(side="left", fill="x", expand=True, padx=(8, 8))
    folder_btn = tk.Label(folder_row, text="Escolher", bg=bg, fg=accent, font=("Segoe UI", 9, "bold"), cursor="hand2")
    folder_btn.pack(side="right")

    def choose_folder(_event=None) -> None:
        if working["value"]:
            return
        chosen = filedialog.askdirectory(initialdir=folder_var.get() or str(DEFAULT_OUT))
        if chosen:
            folder_var.set(chosen)

    folder_btn.bind("<Button-1>", choose_folder)
    folder_entry.bind("<Button-1>", choose_folder)

    buttons = tk.Frame(shell, bg=bg)
    buttons.pack(fill="x", pady=(14, 0))
    go_btn = Pill(buttons, "Baixar", accent, accent_ink, height=32, width=108)
    go_btn.pack(side="right")
    go_btn.set_enabled(False)
    cancel_btn = Pill(buttons, "Cancelar", bg, danger, outline=danger, height=32, width=96)
    cancel_btn.pack(side="right", padx=(0, 10))
    cancel_btn.set_enabled(False)

    def paint(color: str) -> None:
        status.configure(fg=color)

    url_entry.focus_set()

    def quality_caption(media: dict) -> str:
        duration = float(media.get("duration") or 0)
        time_text = clock(duration) if duration > 0.5 else "- : -"
        quality = clean_quality(str(media.get("quality") or ""))
        size = format_bytes(int(media.get("bytes") or 0)) or "0 MB"
        return f"{time_text}  ·  {quality}  ·  {size}"

    def make_thumb(raw: bytes | None):
        try:
            import io

            from PIL import Image, ImageDraw, ImageTk

            width, height = 168, 94
            if raw:
                picture = Image.open(io.BytesIO(raw)).convert("RGB")
                scale = max(width / picture.width, height / picture.height)
                resized = picture.resize(
                    (max(1, int(picture.width * scale)), max(1, int(picture.height * scale))),
                    Image.Resampling.LANCZOS,
                )
                left = (resized.width - width) // 2
                top = (resized.height - height) // 2
                frame = resized.crop((left, top, left + width, top + height))
            else:
                frame = Image.new("RGB", (width, height), thumb_bg)
                draw = ImageDraw.Draw(frame)
                draw.polygon([(72, 30), (72, 64), (108, 47)], fill=(243, 246, 250))
            return ImageTk.PhotoImage(frame)
        except Exception:
            return None

    def paint_resolution(row: dict, media: dict) -> None:
        for chip, option in row["chips"]:
            selected = option["url"] == media.get("url")
            chip.configure(bg=accent if selected else "#3a3a3a", fg=accent_ink if selected else ink)

    def paint_video_rows(selected: int) -> None:
        catalog = job.get("catalog") or {}
        videos = catalog.get("videos") or []
        for index, row in enumerate(video_rows):
            chosen = index == selected
            color = "#353535" if chosen else card
            row["frame"].configure(bg=color)
            row["text"].configure(bg=color)
            row["thumb"].configure(bg=color)
            row["name"].configure(bg=color, fg=ink)
            row["quality"].configure(bg=color, fg=ink if chosen else muted)
            row["chips_frame"].configure(bg=color)
            if index < len(videos):
                paint_resolution(row, videos[index])

    def show_empty_playlist() -> None:
        for child in video_inner.winfo_children():
            child.destroy()
        video_rows.clear()
        tk.Label(
            video_inner,
            text="Nenhum vídeo.",
            bg=card,
            fg=muted,
            font=("Segoe UI", 11),
            anchor="w",
        ).pack(anchor="w", pady=(8, 0))

    def clear_preview() -> None:
        show_empty_playlist()

    def apply_quality(index: int, option: dict) -> None:
        catalog = job.get("catalog") or {}
        videos = catalog.get("videos") or []
        if index < 0 or index >= len(videos) or index >= len(video_rows):
            return
        media = videos[index]
        media["url"] = option["url"]
        media["quality"] = option["label"]
        media["bytes"] = int(option.get("bytes") or 0)
        video_rows[index]["quality"].configure(text=quality_caption(media))
        paint_resolution(video_rows[index], media)

    def activate_video(index: int) -> None:
        catalog = job.get("catalog") or {}
        videos = catalog.get("videos") or []
        if index < 0 or index >= len(videos):
            return
        media = videos[index]
        media["user_agent"] = catalog.get("user_agent", "")
        media["cookies"] = catalog.get("cookies", "")
        media["referer"] = catalog.get("referer", "")
        job["media"] = media
        job["index"] = index
        paint_video_rows(index)

    def place_row(index: int, video: dict) -> dict:
        wrap = max(140, video_canvas.winfo_width() - 196)
        row = tk.Frame(video_inner, bg=card, cursor="hand2")
        row.pack(fill="x", padx=8, pady=(0, 8))
        photo = make_thumb(video.get("image") or None)
        if photo is None:
            thumb_lbl = tk.Frame(row, width=168, height=94, bg="#121920", cursor="hand2")
            thumb_lbl.pack_propagate(False)
        else:
            thumb_lbl = tk.Label(row, image=photo, bg=card, bd=0, cursor="hand2")
            thumb_lbl.image = photo
        thumb_lbl.pack(side="left", padx=(0, 12))
        text_col = tk.Frame(row, bg=card, cursor="hand2")
        text_col.pack(side="left", fill="both", expand=True)
        name = tk.Label(
            text_col,
            text=video.get("title") or "Vídeo",
            bg=card,
            fg=ink,
            anchor="w",
            justify="left",
            font=("Segoe UI", 11),
            wraplength=wrap,
        )
        name.pack(anchor="w", fill="x")
        quality = tk.Label(
            text_col,
            text=quality_caption(video),
            bg=card,
            fg=muted,
            anchor="w",
            justify="left",
            font=("Segoe UI", 10),
        )
        quality.pack(anchor="w", fill="x", pady=(4, 0))
        chips_frame = tk.Frame(text_col, bg=card)
        chips: list[tuple] = []
        options = video.get("options") or []
        if len(options) > 1 or (len(options) == 1 and clean_quality(options[0].get("label") or "") != "Original"):
            chips_frame.pack(anchor="w", pady=(8, 0))
            for option_index, option in enumerate(options):
                selected = option["url"] == video.get("url")
                chip = tk.Label(
                    chips_frame,
                    text=option["label"],
                    bg=accent if selected else "#3a3a3a",
                    fg=accent_ink if selected else ink,
                    font=("Segoe UI", 9),
                    padx=8,
                    pady=2,
                    cursor="hand2",
                )
                chip.pack(side="left", padx=(0 if option_index == 0 else 6, 0))
                chip.bind("<Button-1>", lambda _event, item=index, opt=option: pick_quality(item, opt))
                chips.append((chip, option))
        for widget in (row, thumb_lbl, text_col, name, quality):
            widget.bind("<Button-1>", lambda _event, item=index: choose_video(item))
        return {
            "frame": row,
            "text": text_col,
            "thumb": thumb_lbl,
            "name": name,
            "quality": quality,
            "chips_frame": chips_frame,
            "chips": chips,
        }

    def show_preview(catalog: dict) -> None:
        videos = catalog.get("videos") or []
        if videos and catalog.get("image") and not videos[0].get("image"):
            videos[0]["image"] = catalog["image"]
        job["catalog"] = catalog
        for child in video_inner.winfo_children():
            child.destroy()
        video_rows.clear()
        for index, video in enumerate(videos):
            video_rows.append(place_row(index, video))
        video_canvas.update_idletasks()
        video_canvas.configure(scrollregion=video_canvas.bbox("all"))
        video_canvas.yview_moveto(0)
        if videos:
            activate_video(0)
        if len(videos) == 1:
            status_var.set("1 vídeo.")
        elif videos:
            status_var.set(f"{len(videos)} vídeos.")
        else:
            status_var.set("Nenhum vídeo.")
        paint(ink)

    def append_found_video(video: dict) -> None:
        if not video_rows:
            for child in video_inner.winfo_children():
                child.destroy()
        index = len(video_rows)
        video_rows.append(place_row(index, video))
        video_canvas.update_idletasks()
        video_canvas.configure(scrollregion=video_canvas.bbox("all"))
        video_canvas.yview_moveto(1)
        status_var.set("1 vídeo." if index == 0 else f"{index + 1} vídeos.")
        paint(ink)

    def choose_video(index: int) -> None:
        if working["value"]:
            return
        activate_video(index)

    def pick_quality(index: int, option: dict) -> None:
        if working["value"]:
            return
        activate_video(index)
        apply_quality(index, option)

    def set_busy(busy: bool) -> None:
        working["value"] = busy
        state = "disabled" if busy else "normal"
        search_btn.configure(state=state)
        url_entry.configure(state=state)
        paste_btn.configure(fg=muted if busy else accent, cursor="arrow" if busy else "hand2")
        folder_btn.configure(fg=muted if busy else accent, cursor="arrow" if busy else "hand2")
        cancel_btn.configure(state="normal" if busy else "disabled")
        if busy or not job.get("media"):
            go_btn.configure(state="disabled")
        else:
            go_btn.configure(state="normal")

    def pump() -> None:
        try:
            while True:
                kind, payload, extra = messages.get_nowait()
                if kind == "line":
                    status_var.set(payload)
                    paint(ink)
                elif kind == "progress":
                    if payload:
                        status_var.set(payload)
                        paint(ink)
                    if extra is None:
                        if str(bar.cget("mode")) != "indeterminate":
                            bar.configure(mode="indeterminate")
                            bar.start(10)
                    else:
                        if str(bar.cget("mode")) != "determinate":
                            bar.stop()
                            bar.configure(mode="determinate", maximum=100)
                        bar["value"] = max(0, min(100, extra * 100))
                elif kind == "add":
                    append_found_video(payload)
                elif kind == "preview":
                    show_preview(payload)
                    bar.stop()
                    bar.configure(mode="determinate", maximum=100, value=100)
                elif kind == "ok":
                    status_var.set("Download concluído.")
                    paint(ink)
                    bar.stop()
                    bar.configure(mode="determinate", maximum=100, value=100)
                elif kind == "cancel":
                    if payload == "search":
                        status_var.set("Busca cancelada.")
                    else:
                        status_var.set("Download cancelado.")
                    paint(danger)
                    bar.stop()
                    bar.configure(mode="determinate", value=0)
                elif kind == "fail":
                    status_var.set("Não deu certo.")
                    paint(danger)
                    bar.stop()
                    bar.configure(mode="determinate", value=0)
                    messagebox.showerror("BF Down", payload)
                elif kind == "done":
                    set_busy(False)
        except queue.Empty:
            pass
        except Exception as exc:
            status_var.set(str(exc))
        root.after(120, pump)

    def cancel() -> None:
        if not working["value"]:
            return
        stop = job.get("stop")
        if stop is not None:
            stop.cancel()
        status_var.set("Cancelando…")
        paint(muted)
        cancel_btn.configure(state="disabled")

    def begin_work(status_text: str, fill: bool = False) -> StopFlag:
        stop = StopFlag()
        job["stop"] = stop
        set_busy(True)
        status_var.set(status_text)
        paint(ink)
        bar.stop()
        if fill:
            bar.configure(mode="determinate", maximum=100, value=0)
        else:
            bar.configure(mode="indeterminate", value=0)
            bar.start(10)
        return stop

    def start_search() -> None:
        if working["value"]:
            return
        page_url = url_var.get().strip()
        if not page_url:
            messagebox.showinfo("BF Down", "Cole o link da página do vídeo.")
            return
        job["media"] = None
        job["catalog"] = None
        clear_preview()
        stop = begin_work("Buscando…", fill=True)

        def worker() -> None:
            def log(message: str) -> None:
                messages.put(("line", message, None))

            def report(kind: str, payload) -> None:
                if kind == "progress":
                    messages.put(("progress", "", payload))
                elif kind == "video":
                    messages.put(("add", payload, None))

            try:
                media = find_on_page(page_url, log, stop=stop, report=report)
                messages.put(("preview", media, None))
            except Cancelled:
                messages.put(("cancel", "search", None))
            except DownloadError as exc:
                messages.put(("fail", str(exc), None))
            except Exception as exc:
                messages.put(("fail", explain_failure(exc), None))
            finally:
                messages.put(("done", None, None))

        threading.Thread(target=worker, daemon=True).start()

    def start_download() -> None:
        if working["value"]:
            return
        media = job.get("media")
        page_url = url_var.get().strip()
        if not media or media.get("referer") != page_url:
            messagebox.showinfo("BF Down", "Busca o vídeo antes de baixar.")
            return
        folder = Path(folder_var.get().strip() or DEFAULT_OUT)
        stop = begin_work("Preparando o arquivo…")

        def worker() -> None:
            def log(message: str) -> None:
                messages.put(("line", message, None))

            def on_progress(text: str, ratio: float | None) -> None:
                messages.put(("progress", text, ratio))

            try:
                saved = save_media(
                    media["url"],
                    media["referer"],
                    media["user_agent"],
                    media["cookies"],
                    folder,
                    media["title"],
                    log,
                    stop=stop,
                    progress=on_progress,
                )
                log(f"Pronto. Arquivo salvo em {saved}")
                messages.put(("ok", None, None))
            except Cancelled:
                messages.put(("cancel", "download", None))
            except DownloadError as exc:
                messages.put(("fail", str(exc), None))
            except Exception as exc:
                messages.put(("fail", explain_failure(exc), None))
            finally:
                messages.put(("done", None, None))

        threading.Thread(target=worker, daemon=True).start()

    def on_url_change(*_args) -> None:
        if working["value"]:
            return
        media = job.get("media")
        if media and media.get("referer") != url_var.get().strip():
            job["media"] = None
            job["catalog"] = None
            clear_preview()
            go_btn.configure(state="disabled")

    def on_return(_event=None) -> None:
        if working["value"]:
            return
        media = job.get("media")
        if media and media.get("referer") == url_var.get().strip():
            start_download()
        else:
            start_search()

    def on_close() -> None:
        if working["value"]:
            if not messagebox.askokcancel("Fechar", "Tem um download em andamento. Cancelar e fechar?"):
                return
            cancel()
        root.destroy()

    def on_resize(event=None) -> None:
        if event is not None and event.widget is not root:
            return
        width = max(root.winfo_width(), 1)
        height = max(root.winfo_height(), 1)
        target = min(1080, width)
        stage.place(x=(width - target) // 2, y=0, width=target, height=height)
        status.configure(wraplength=max(240, target - 40))
        fit_video_list()

    search_btn.configure(command=start_search)
    go_btn.configure(command=start_download)
    cancel_btn.configure(command=cancel)
    url_var.trace_add("write", on_url_change)
    root.bind("<Return>", on_return)
    root.bind("<Escape>", lambda _event: cancel())
    root.protocol("WM_DELETE_WINDOW", on_close)
    root.bind("<Configure>", on_resize, add="+")
    root.after(1, lambda: on_resize(None))
    show_empty_playlist()
    pump()
    root.mainloop()


def main() -> None:
    parser = argparse.ArgumentParser(description="Lista os vídeos da página e salva o escolhido em MP4.")
    parser.add_argument("url", nargs="?", help="Link da página do vídeo")
    parser.add_argument("--pasta", default=str(DEFAULT_OUT), help="Pasta de destino")
    parser.add_argument("--detect", action="store_true", help="Só mostra o arquivo encontrado")
    args = parser.parse_args()
    if args.url:
        sys.exit(run_cli(args.url, Path(args.pasta), args.detect))
    run_gui()


if __name__ == "__main__":
    main()
