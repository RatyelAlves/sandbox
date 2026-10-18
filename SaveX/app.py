"""SaveX — local downloader for public Twitter/X videos."""

from __future__ import annotations

import json
import os
import re
import threading
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
from collections import OrderedDict
from pathlib import Path

import yt_dlp
from flask import Flask, Response, abort, jsonify, render_template, request
from yt_dlp.utils import DownloadError

BASE = Path(__file__).resolve().parent
app = Flask(
    __name__,
    template_folder=str(BASE / "templates"),
    static_folder=str(BASE / "static"),
)
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0


@app.context_processor
def inject_asset_version():
    style = BASE / "static" / "style.css"
    return {"asset_v": int(style.stat().st_mtime)}

ALLOWED_HOSTS = {"video.twimg.com", "pbs.twimg.com"}
MEDIA_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    ),
    "Referer": "https://x.com/",
    "Accept": "*/*",
}
STATUS_HOSTS = {
    "twitter.com",
    "www.twitter.com",
    "mobile.twitter.com",
    "x.com",
    "www.x.com",
    "mobile.x.com",
    "fxtwitter.com",
    "vxtwitter.com",
    "fixupx.com",
    "fixvx.com",
}

_sessions: OrderedDict[str, dict] = OrderedDict()
_sessions_lock = threading.Lock()
MAX_SESSIONS = 40


class _QuietLogger:
    def debug(self, msg):
        return None

    def info(self, msg):
        return None

    def warning(self, msg):
        return None

    def error(self, msg):
        return None


def _remember(token: str, payload: dict) -> None:
    with _sessions_lock:
        _sessions[token] = payload
        _sessions.move_to_end(token)
        while len(_sessions) > MAX_SESSIONS:
            _sessions.popitem(last=False)


def _lookup(token: str) -> dict | None:
    with _sessions_lock:
        payload = _sessions.get(token)
        if payload is not None:
            _sessions.move_to_end(token)
        return payload


def _quality_label(width: int, height: int) -> str:
    short_side = min(width, height)
    if short_side >= 2160:
        return "4K"
    if short_side >= 1440:
        return "2K QHD"
    if short_side >= 1080:
        return "Full HD"
    if short_side >= 720:
        return "HD Quality"
    if short_side >= 480:
        return "SD Quality"
    return "Data Saver"


def _dimensions(fmt: dict) -> tuple[int, int] | None:
    width = fmt.get("width")
    height = fmt.get("height")
    if width and height:
        return int(width), int(height)
    match = re.search(r"/(\d{2,5})x(\d{2,5})/", fmt.get("url") or "")
    if not match:
        return None
    return int(match.group(1)), int(match.group(2))


def _mp4_formats(formats: list[dict]) -> list[dict]:
    best: dict[tuple[int, int], dict] = {}
    for fmt in formats or []:
        url = fmt.get("url") or ""
        protocol = (fmt.get("protocol") or "").lower()
        if fmt.get("vcodec") == "none":
            continue
        if ".m3u8" in url or protocol.startswith("m3u8"):
            continue
        if (fmt.get("ext") or "").lower() not in {"mp4", "mov"}:
            continue
        host = (urllib.parse.urlparse(url).hostname or "").lower()
        if host not in ALLOWED_HOSTS:
            continue
        dims = _dimensions(fmt)
        if not dims:
            continue
        width, height = dims
        current = best.get((width, height))
        bitrate = fmt.get("tbr") or 0
        if current is None or bitrate > (current.get("tbr") or 0):
            best[(width, height)] = {
                "url": url,
                "width": width,
                "height": height,
                "tbr": bitrate,
            }
    ranked = sorted(
        best.values(),
        key=lambda item: (min(item["width"], item["height"]), item["width"] * item["height"], item["tbr"]),
        reverse=True,
    )
    public = []
    for index, item in enumerate(ranked):
        public.append(
            {
                "id": str(index),
                "width": item["width"],
                "height": item["height"],
                "label": _quality_label(item["width"], item["height"]),
                "ext": "MP4",
                "url": item["url"],
            }
        )
    return public


def _entries(info: dict) -> list[dict]:
    if not info:
        return []
    if info.get("_type") == "playlist" or (
        info.get("entries") and not info.get("formats")
    ):
        return [entry for entry in info.get("entries") or [] if isinstance(entry, dict)]
    return [info]


def _thumbnail(info: dict) -> str | None:
    thumb = info.get("thumbnail")
    if thumb:
        return thumb
    thumbs = info.get("thumbnails") or []
    if not thumbs:
        return None
    orig = next((item for item in thumbs if item.get("id") == "orig"), None)
    return (orig or thumbs[-1]).get("url")


def _normalize_url(raw: str) -> str:
    text = (raw or "").strip()
    if not text:
        raise ValueError("Paste a video link.")
    found = re.search(r"https?://\S+", text, re.I)
    if found:
        text = found.group(0).rstrip(").,]>\"'")
    elif not re.match(r"https?://", text, re.I):
        text = "https://" + text.lstrip("/")

    if "t.co/" in urllib.parse.urlparse(text).netloc.lower():
        request_obj = urllib.request.Request(
            text,
            method="GET",
            headers={"User-Agent": MEDIA_HEADERS["User-Agent"]},
        )
        with urllib.request.urlopen(request_obj, timeout=20) as response:
            text = response.geturl()

    parsed = urllib.parse.urlparse(text)
    host = (parsed.hostname or "").lower()
    if host not in STATUS_HOSTS:
        raise ValueError("Use a twitter.com or x.com link.")
    if not re.search(r"/status(?:es)?/\d+", parsed.path or ""):
        raise ValueError("This link does not point to a post.")
    return urllib.parse.urlunparse(parsed._replace(scheme="https", netloc="x.com"))


def _videos_from_info(info: dict) -> list[dict]:
    videos = []
    for entry in _entries(info):
        formats = _mp4_formats(entry.get("formats") or [])
        if not formats:
            continue
        videos.append(
            {
                "id": str(entry.get("id") or ""),
                "title": (entry.get("title") or "Twitter video").strip(),
                "thumbnail": _thumbnail(entry),
                "formats": formats,
            }
        )
    return videos


def _extract_ytdlp(url: str, api_name: str) -> dict:
    options = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": False,
        "socket_timeout": 20,
        "retries": 1,
        "logger": _QuietLogger(),
        "extractor_args": {"twitter": {"api": [api_name]}},
    }
    with yt_dlp.YoutubeDL(options) as downloader:
        info = downloader.extract_info(url, download=False)
    return {"videos": _videos_from_info(info)}


def _status_parts(url: str) -> tuple[str | None, str]:
    parsed = urllib.parse.urlparse(url)
    match = re.search(r"/status(?:es)?/(\d+)", parsed.path or "")
    if not match:
        raise ValueError("This link does not point to a post.")
    parts = [part for part in parsed.path.split("/") if part]
    user = None
    if len(parts) >= 3 and parts[-2] in {"status", "statuses"} and parts[0] not in {"i", "web"}:
        user = parts[0]
    return user, match.group(1)


def _fx_formats(video: dict) -> list[dict]:
    raw_formats = []
    variants = video.get("formats") or video.get("variants") or []
    for item in variants:
        media_url = item.get("url") or ""
        container = (item.get("container") or item.get("content_type") or "").lower()
        if "mp4" not in container and ".mp4" not in media_url:
            continue
        bitrate = item.get("bitrate") or 0
        raw_formats.append(
            {
                "url": media_url,
                "ext": "mp4",
                "tbr": bitrate / 1000 if bitrate else 0,
                "vcodec": item.get("codec") or "h264",
            }
        )
    direct = video.get("url") or ""
    if not raw_formats and ".mp4" in direct:
        raw_formats.append(
            {
                "url": direct,
                "ext": "mp4",
                "width": video.get("width"),
                "height": video.get("height"),
                "tbr": 0,
                "vcodec": "h264",
            }
        )
    return _mp4_formats(raw_formats)


def _extract_fxtwitter(url: str) -> dict:
    user, status_id = _status_parts(url)
    endpoints = []
    if user:
        endpoints.append(f"https://api.fxtwitter.com/{urllib.parse.quote(user)}/status/{status_id}")
    endpoints.append(f"https://api.fxtwitter.com/status/{status_id}")
    last_error: Exception | None = None
    for endpoint in endpoints:
        request_obj = urllib.request.Request(endpoint, headers={"User-Agent": MEDIA_HEADERS["User-Agent"]})
        try:
            with urllib.request.urlopen(request_obj, timeout=20) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except Exception as exc:
            last_error = exc
            continue
        tweet = payload.get("tweet") or {}
        media = tweet.get("media") or {}
        items = list(media.get("videos") or [])
        if not items:
            for item in media.get("all") or []:
                kind = (item.get("type") or "").lower()
                if kind in {"video", "gif", "animated_gif"} or ".mp4" in (item.get("url") or ""):
                    items.append(item)
        author = (tweet.get("author") or {}).get("name") or user or ""
        text = re.sub(r"https://t\.co/\S+", "", tweet.get("text") or "").strip()
        title = f"{author} - {text}".strip(" -") or "Twitter video"
        videos = []
        for item in items:
            formats = _fx_formats(item)
            if not formats:
                continue
            videos.append(
                {
                    "id": str(item.get("id") or status_id),
                    "title": title[:140],
                    "thumbnail": item.get("thumbnail_url"),
                    "formats": formats,
                }
            )
        if videos:
            return {"videos": videos}
        if tweet:
            return {"videos": []}
    if last_error:
        raise last_error
    return {"videos": []}


def _extract(url: str) -> dict:
    last_error: Exception | None = None
    for getter in (
        lambda: _extract_ytdlp(url, "syndication"),
        lambda: _extract_fxtwitter(url),
        lambda: _extract_ytdlp(url, "graphql"),
    ):
        try:
            found = getter()
        except Exception as exc:
            last_error = exc
            continue
        if found.get("videos"):
            return found
    if last_error and "No video could be found" not in str(last_error):
        raise last_error
    return {"videos": []}


def _safe_filename(title: str, width: int, height: int) -> str:
    cleaned = re.sub(r'[\\/:*?"<>|]+', " ", title or "video")
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" .")
    cleaned = cleaned[:50].rstrip(" .") or "video"
    return f"{cleaned} {width}x{height}.mp4"


def _assert_media_url(url: str) -> str:
    parsed = urllib.parse.urlparse(url or "")
    host = (parsed.hostname or "").lower()
    if parsed.scheme != "https" or host not in ALLOWED_HOSTS:
        abort(400)
    return url


def _open_remote(url: str):
    headers = dict(MEDIA_HEADERS)
    range_header = request.headers.get("Range")
    if range_header:
        headers["Range"] = range_header
    remote_request = urllib.request.Request(url, headers=headers)
    try:
        remote = urllib.request.urlopen(remote_request, timeout=60)
        return remote, getattr(remote, "status", 200)
    except urllib.error.HTTPError as exc:
        if exc.code in (200, 206):
            return exc, exc.code
        raise


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/api/fetch")
def fetch_video():
    payload = request.get_json(silent=True) or {}
    try:
        url = _normalize_url(payload.get("url") or "")
    except ValueError as exc:
        return jsonify(error=str(exc)), 400
    except Exception:
        return jsonify(error="Could not open that link."), 400

    try:
        extracted = _extract(url)
    except DownloadError as exc:
        if "No video could be found" in str(exc):
            return jsonify(error="This post has no video."), 422
        return jsonify(error="Could not get this video. It may be private or deleted."), 422
    except Exception:
        return jsonify(error="Could not get this video. It may be private or deleted."), 422

    videos = extracted.get("videos") or []
    if not videos:
        return jsonify(error="This post has no video."), 422

    import secrets

    token = secrets.token_urlsafe(18)
    _remember(token, {"videos": videos})
    public_videos = []
    for video in videos:
        public_videos.append(
            {
                "title": video["title"],
                "formats": [
                    {
                        "id": fmt["id"],
                        "width": fmt["width"],
                        "height": fmt["height"],
                        "label": fmt["label"],
                        "ext": fmt["ext"],
                    }
                    for fmt in video["formats"]
                ],
            }
        )
    return jsonify(token=token, videos=public_videos)


def _video_and_format(token: str, video_index: int, format_id: str | None = None):
    payload = _lookup(token)
    if not payload:
        abort(404)
    videos = payload.get("videos") or []
    if video_index < 0 or video_index >= len(videos):
        abort(404)
    video = videos[video_index]
    if format_id is None:
        return video, None
    match = next((fmt for fmt in video["formats"] if fmt["id"] == format_id), None)
    if match is None:
        abort(404)
    return video, match


@app.get("/api/thumb/<token>/<int:video_index>")
def thumb(token: str, video_index: int):
    video, _fmt = _video_and_format(token, video_index)
    thumb_url = video.get("thumbnail")
    if not thumb_url:
        abort(404)
    _assert_media_url(thumb_url)
    try:
        remote, status = _open_remote(thumb_url)
    except Exception:
        abort(502)

    def generate():
        try:
            while True:
                chunk = remote.read(64 * 1024)
                if not chunk:
                    break
                yield chunk
        finally:
            remote.close()

    content_type = remote.headers.get("Content-Type", "image/jpeg")
    response = Response(generate(), status=status, mimetype=content_type.split(";")[0])
    response.headers["Cache-Control"] = "private, max-age=600"
    return response


@app.get("/api/file/<token>/<int:video_index>/<format_id>")
def media_file(token: str, video_index: int, format_id: str):
    video, fmt = _video_and_format(token, video_index, format_id)
    media_url = _assert_media_url(fmt["url"])
    try:
        remote, status = _open_remote(media_url)
    except Exception:
        abort(502)

    def generate():
        try:
            while True:
                chunk = remote.read(256 * 1024)
                if not chunk:
                    break
                yield chunk
        finally:
            remote.close()

    response = Response(generate(), status=status, mimetype="video/mp4")
    length = remote.headers.get("Content-Length")
    if length:
        response.headers["Content-Length"] = length
    content_range = remote.headers.get("Content-Range")
    if content_range:
        response.headers["Content-Range"] = content_range
    response.headers["Accept-Ranges"] = "bytes"
    response.headers["Cache-Control"] = "private, max-age=300"
    if request.args.get("dl") == "1":
        filename = _safe_filename(video.get("title") or "video", fmt["width"], fmt["height"])
        ascii_name = re.sub(r"[^A-Za-z0-9._ -]", "", filename).strip() or "video.mp4"
        quoted = urllib.parse.quote(filename)
        response.headers["Content-Disposition"] = (
            f"attachment; filename=\"{ascii_name}\"; filename*=UTF-8''{quoted}"
        )
    return response


def _pick_port(start: int = 5477) -> int:
    import socket

    for port in range(start, start + 20):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            try:
                sock.bind(("127.0.0.1", port))
            except OSError:
                continue
            return port
    return start


if __name__ == "__main__":
    port = _pick_port()
    url = f"http://127.0.0.1:{port}"
    print()
    print("SaveX esta rodando.")
    print(f"Abra: {url}")
    print("Feche esta janela para encerrar.")
    print()
    if os.environ.get("SAVETWT_NO_BROWSER") != "1":
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    app.run(host="127.0.0.1", port=port, debug=False, threaded=True)
