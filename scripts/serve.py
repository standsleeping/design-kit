"""
Serve design-kit's dist/ directory locally without browser caching.

`python3 -m http.server` emits no `Cache-Control` header, so browsers cache
imported ES modules and CSS aggressively. Module imports in particular are
hard to bust because each `?v=<hash>` change only helps when the importer
reloads — transitive imports can stay stale. Sending `Cache-Control: no-cache`
on every response forces a revalidation on each request, which keeps the dev
loop honest.

Usage:
    python3 scripts/serve.py [port]        # serves ./dist by default
    python3 scripts/serve.py [port] [dir]

Default port: 8787.
"""

import http.server
import socketserver
import sys
from pathlib import Path

DEFAULT_PORT = 8787
DEFAULT_DIR = "dist"


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


def main() -> int:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
    directory = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_DIR
    root = Path(directory).resolve()
    handler = lambda *a, **kw: NoCacheHandler(*a, directory=str(root), **kw)  # noqa: E731
    with socketserver.TCPServer(("", port), handler) as httpd:
        print(f"Serving {root} at http://localhost:{port}/ (no-cache)")
        httpd.serve_forever()
    return 0


if __name__ == "__main__":
    sys.exit(main())
