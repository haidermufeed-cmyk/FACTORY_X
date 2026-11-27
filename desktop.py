
import sys
import threading
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

import webview

if getattr(sys, "frozen", False):
    BASE_DIR = Path(sys._MEIPASS)
else:
    BASE_DIR = Path(__file__).resolve().parent

BACKEND_DIR = BASE_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app import app
from werkzeug.serving import make_server


class FactoryXDesktop:
    def __init__(self):
        self.api_server = make_server(
            "127.0.0.1", 5000, app, threaded=True
        )

        handler = partial(
            SimpleHTTPRequestHandler,
            directory=str(BASE_DIR)
        )

        self.web_server = ThreadingHTTPServer(
            ("127.0.0.1", 8000),
            handler
        )

        self.api_thread = threading.Thread(
            target=self.api_server.serve_forever,
            daemon=True
        )

        self.web_thread = threading.Thread(
            target=self.web_server.serve_forever,
            daemon=True
        )

    def start(self):
        self.api_thread.start()
        self.web_thread.start()

    def stop(self):
        self.web_server.shutdown()
        self.web_server.server_close()
        self.api_server.shutdown()
        self.api_server.server_close()


if __name__ == "__main__":
    desktop = FactoryXDesktop()

    try:
        desktop.start()

        webview.create_window(
            "FACTORY-X | Intelligent Industrial Factory Simulator",
            "http://127.0.0.1:8000/index.html",
            width=1440,
            height=900,
            min_size=(1100, 700)
        )

        webview.start()

    finally:
        desktop.stop()
