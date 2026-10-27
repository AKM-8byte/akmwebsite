"""Yerel önizleme: public/ klasörünü http://localhost:8788 adresinde sunar.

Önce verileri üret:  npm run sync
Sonra:               python scripts/dev_preview.py
"""
import pathlib
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PUBLIC = pathlib.Path(__file__).resolve().parent.parent / "public"


class Handler(SimpleHTTPRequestHandler):
    # Windows kayıt defteri .js'i bazen text/plain verir; modüller yüklenmez.
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".json": "application/json",
    }


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 8788), partial(Handler, directory=str(PUBLIC)))
    print("AKM önizleme: http://localhost:8788")
    server.serve_forever()
