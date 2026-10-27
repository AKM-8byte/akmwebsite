"""Tasarım önizlemesi: public/ klasörünü sunar, /api/* okumalarını scripts/demo/*.json ile taklit eder.

Gerçek API (D1 + TMDB + admin) için:  npx wrangler pages dev
Bu sunucu sadece Node kurulu değilken arayüzü görmek içindir.

Kullanım:  python scripts/dev_preview.py   →  http://localhost:8788
"""
import json
import pathlib
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
DEMO = ROOT / "scripts" / "demo"


class Handler(SimpleHTTPRequestHandler):
    # Windows kayıt defteri .js'i bazen text/plain verir; modüller yüklenmez.
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".json": "application/json",
    }

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path.startswith("/api/"):
            return self.api(path[len("/api/"):].strip("/").split("/"))
        return super().do_GET()

    def api(self, parts):
        if parts[0] == "admin":
            return self.send_json({"error": "Önizleme sunucusu: admin için 'npx wrangler pages dev' kullan"}, 401)
        file = DEMO / f"{parts[0]}.json"
        if not file.exists():
            return self.send_json({"error": "Bulunamadı"}, 404)
        data = json.loads(file.read_text(encoding="utf-8"))
        if len(parts) > 1:
            key = "slug" if parts[0] == "projects" else "id"
            data = next((d for d in data if str(d.get(key)) == parts[1]), None)
            if data is None:
                return self.send_json({"error": "Bulunamadı"}, 404)
        return self.send_json(data)

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("content-type", "application/json; charset=utf-8")
        self.send_header("content-length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 8788), partial(Handler, directory=str(PUBLIC)))
    print("AKM önizleme: http://localhost:8788")
    server.serve_forever()
