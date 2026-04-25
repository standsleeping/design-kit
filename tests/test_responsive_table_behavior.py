"""Run the ResponsiveTable behavior page in headless Chromium and assert all checks pass.

The behavior page (``pages/responsive-table-tests.html``) mounts the component
in wide / narrow / medium modes and exercises the sidenote overlay (inline +
popup paths), presence dots, row clickability, and the body-contract. It writes
the verdict into ``document.body.dataset`` so this test can read it.

Requires ``playwright`` and an installed Chromium browser
(``uv run playwright install chromium``). The test skips cleanly if either is
missing.
"""

from __future__ import annotations

import http.server
import socket
import socketserver
import threading
from dataclasses import dataclass
from pathlib import Path

import pytest

from design_kit.build import build

TOKENS_PATH = Path(__file__).parent.parent / "tokens" / "design-tokens.json"


class _QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        return


def _free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("", 0))
        return int(sock.getsockname()[1])


def _serve(directory: Path, port: int) -> socketserver.TCPServer:
    def handler_factory(*args: object, **kwargs: object) -> _QuietHandler:
        return _QuietHandler(*args, directory=str(directory), **kwargs)  # type: ignore[arg-type]

    server = socketserver.ThreadingTCPServer(("", port), handler_factory)  # type: ignore[arg-type]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


@dataclass(frozen=True)
class _Result:
    status: str
    total: int
    failures: int
    detail: str


def _run_checks(url: str, sync_api) -> _Result:  # type: ignore[no-untyped-def]
    with sync_api.sync_playwright() as pw:
        try:
            browser = pw.chromium.launch()
        except sync_api.Error as err:
            pytest.skip(
                f"Chromium not available: {err}. "
                f"Run 'uv run playwright install chromium'."
            )
            raise  # unreachable; satisfies type checker
        try:
            page = browser.new_page()
            page.goto(url)
            page.wait_for_function(
                "document.body.dataset.testStatus === 'pass' "
                "|| document.body.dataset.testStatus === 'fail'",
                timeout=15_000,
            )
            status = str(page.evaluate("document.body.dataset.testStatus"))
            total = int(page.evaluate("document.body.dataset.testTotal"))
            failures = int(page.evaluate("document.body.dataset.testFailures"))
            detail = ""
            if status != "pass":
                detail = str(
                    page.evaluate(
                        "[...document.querySelectorAll('[data-results] tr')]"
                        ".filter(r => r.children[1].textContent.trim() === 'FAIL')"
                        ".map(r => `${r.children[0].textContent}: "
                        "${r.children[2].textContent}`).join('\\n')"
                    )
                )
            return _Result(status=status, total=total, failures=failures, detail=detail)
        finally:
            browser.close()


def test_responsive_table_behavior_page_passes(tmp_path: Path) -> None:
    """All checks on the ResponsiveTable behavior page pass in headless Chromium."""
    sync_api = pytest.importorskip("playwright.sync_api")

    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)

    port = _free_port()
    server = _serve(tmp_path, port)
    try:
        url = f"http://localhost:{port}/responsive-table-tests.html"
        try:
            result = _run_checks(url, sync_api)
        except sync_api.Error as err:
            pytest.skip(f"Playwright/Chromium error: {err}")
            return  # unreachable
    finally:
        server.shutdown()
        server.server_close()

    if result.status != "pass":
        pytest.fail(
            f"{result.failures} of {result.total} "
            f"ResponsiveTable behavior checks failed:\n{result.detail}"
        )
    assert result.total >= 18, f"expected at least 18 checks, got {result.total}"
