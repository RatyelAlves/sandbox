const pasteView = document.getElementById("paste-view");
const resultView = document.getElementById("result-view");
const form = document.getElementById("fetch-form");
const urlInput = document.getElementById("url");
const fetchBtn = document.getElementById("fetch-btn");
const fetchLabel = document.getElementById("fetch-label");
const formError = document.getElementById("form-error");
const thumb = document.getElementById("thumb");
const player = document.getElementById("player");
const playBtn = document.getElementById("play");
const rows = document.getElementById("rows");
const picker = document.getElementById("picker");
const again = document.getElementById("again");
const themeMeta = document.querySelector('meta[name="theme-color"]');

const downloadIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="m8 10 4 4 4-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 19h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;

let token = null;
let videos = [];
let current = 0;

const themeSwitch = document.getElementById("theme-switch");

function applyTheme(theme) {
  const next = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("savetwt-theme", next);
  themeMeta.content = next === "light" ? "#f3f5f8" : "#121317";
  const light = next === "light";
  themeSwitch.setAttribute("aria-pressed", String(light));
  themeSwitch.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
}

applyTheme(localStorage.getItem("savetwt-theme") || "dark");
themeSwitch.addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
});

function showError(message) {
  formError.hidden = !message;
  formError.textContent = message || "";
}

function setBusy(busy) {
  fetchBtn.disabled = busy;
  urlInput.disabled = busy;
  fetchLabel.textContent = busy ? "Fetching..." : "Get Video";
}

function resetPlayer() {
  player.pause();
  player.removeAttribute("src");
  player.load();
  player.hidden = true;
  player.controls = false;
  thumb.hidden = false;
  playBtn.hidden = false;
}

function fileUrl(formatId, download) {
  const base = `/api/file/${token}/${current}/${formatId}`;
  return download ? `${base}?dl=1` : base;
}

function previewFormat(formats) {
  return formats.find((fmt) => Math.min(fmt.width, fmt.height) <= 720) || formats[formats.length - 1];
}

function renderPicker() {
  picker.replaceChildren();
  if (videos.length < 2) {
    picker.hidden = true;
    return;
  }
  picker.hidden = false;
  videos.forEach((video, index) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip" + (index === current ? " active" : "");
    chip.textContent = `Video ${index + 1}`;
    chip.addEventListener("click", () => {
      current = index;
      render();
    });
    picker.appendChild(chip);
  });
}

function render() {
  const video = videos[current];
  if (!video) return;
  resetPlayer();
  thumb.src = `/api/thumb/${token}/${current}`;
  document.title = `${video.title} — SaveX`;
  renderPicker();
  rows.replaceChildren();

  video.formats.forEach((fmt) => {
    const tr = document.createElement("tr");

    const formatCell = document.createElement("td");
    formatCell.className = "format";
    formatCell.textContent = fmt.ext || "MP4";

    const qualityCell = document.createElement("td");
    const res = document.createElement("div");
    res.className = "res";
    res.textContent = `${fmt.width} × ${fmt.height}`;
    const badge = document.createElement("div");
    badge.className = "badge";
    badge.textContent = fmt.label;
    qualityCell.append(res, badge);

    const linkCell = document.createElement("td");
    linkCell.className = "dl";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dl-btn";
    button.innerHTML = downloadIcon;
    const label = document.createElement("span");
    label.textContent = "Download";
    button.append(label);
    button.addEventListener("click", () => startDownload(button, fmt.id));
    linkCell.append(button);

    tr.append(formatCell, qualityCell, linkCell);
    rows.append(tr);
  });

  pasteView.hidden = true;
  resultView.hidden = false;
}

function startDownload(button, formatId) {
  const label = button.querySelector("span");
  button.disabled = true;
  label.textContent = "Downloading...";
  const link = document.createElement("a");
  link.href = fileUrl(formatId, true);
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => {
    button.disabled = false;
    label.textContent = "Download";
  }, 1200);
}

playBtn.addEventListener("click", () => {
  const video = videos[current];
  if (!video || !video.formats.length) return;
  const fmt = previewFormat(video.formats);
  player.hidden = false;
  thumb.hidden = true;
  playBtn.hidden = true;
  player.controls = true;
  player.src = fileUrl(fmt.id, false);
  player.play().catch(() => {
    playBtn.hidden = false;
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const url = urlInput.value.trim();
  if (!url) {
    showError("Paste a video link.");
    return;
  }
  showError("");
  setBusy(true);
  try {
    const response = await fetch("/api/fetch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      showError(data.error || "Could not get this video.");
      return;
    }
    token = data.token;
    videos = data.videos || [];
    current = 0;
    render();
  } catch {
    showError("Could not reach SaveX. Keep the app window open and try again.");
  } finally {
    setBusy(false);
  }
});

again.addEventListener("click", () => {
  token = null;
  videos = [];
  current = 0;
  resetPlayer();
  thumb.removeAttribute("src");
  rows.replaceChildren();
  resultView.hidden = true;
  pasteView.hidden = false;
  document.title = "SaveX";
  urlInput.value = "";
  showError("");
  urlInput.focus();
});
