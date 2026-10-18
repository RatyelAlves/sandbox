import os
import shutil
import sys
from pathlib import Path

import webview

APP_NAME = "LivroCaixa"


def bundled_file(name: str) -> str:
    base = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base, name)


def user_dir() -> Path:
    root = Path(os.environ.get("APPDATA", Path.home())) / APP_NAME
    root.mkdir(parents=True, exist_ok=True)
    return root


def html_url() -> str:
    dest = user_dir()
    shutil.copy2(bundled_file("index.html"), dest / "index.html")
    for name in ("icon.png", "bg.jpg"):
        src = bundled_file(name)
        if os.path.exists(src):
            shutil.copy2(src, dest / name)
    return (dest / "index.html").resolve().as_uri()


if __name__ == "__main__":
    storage = str(user_dir() / "webview")
    os.makedirs(storage, exist_ok=True)
    webview.create_window(
        "CashBook",
        html_url(),
        width=1440,
        height=900,
        min_size=(1100, 700),
        background_color="#12263a",
    )
    webview.start(
        gui="edgechromium",
        private_mode=False,
        storage_path=storage,
        icon=bundled_file("icon.ico"),
    )
