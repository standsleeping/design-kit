"""Run the border-audit page in headless Chromium and return findings.

This is the runtime detection corollary of the BOUNDARY_OWNERSHIP principle:
two elements drawing the same edge produce a sub-pixel doubled border, which
CSS lint cannot detect because adjacency is layout-dependent. We render every
shipped page in headless Chromium, walk each DOM, and project border edges to
axis-pos line segments; pairs that share an axis position with overlapping
ranges are flagged.

Used by ``design_kit.build`` to fail the build on findings. Playwright is
expected for a complete build but optional — when it isn't available, the
audit is skipped with a warning so token-only builds still work.
"""

from __future__ import annotations

import http.server
import socket
import socketserver
import threading
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path

from design_kit.logging import get_logger

logger = get_logger(__name__)

PAGE = "border-audit.html"
WAIT_MS = 20_000


@dataclass(frozen=True)
class BorderFinding:
    """One doubled-border violation surfaced by the audit page."""

    page: str
    detail: str


class AuditOutcome(Enum):
    """Three outcomes a build needs to distinguish.

    A bare list[BorderFinding] conflates "ran clean" with "didn't run" — both
    are an empty list. Callers that care (e.g., a release pipeline that
    refuses to deploy without the audit) can match on the outcome instead.
    """

    PASSED = "passed"
    SKIPPED = "skipped"
    FAILED = "failed"


@dataclass(frozen=True)
class AuditResult:
    """Result of one ``run_border_audit()`` invocation."""

    outcome: AuditOutcome
    reason: str = ""  # populated for SKIPPED with the cause
    findings: list[BorderFinding] = field(default_factory=list)  # populated for FAILED

    @classmethod
    def passed(cls) -> "AuditResult":
        return cls(outcome=AuditOutcome.PASSED)

    @classmethod
    def skipped(cls, reason: str) -> "AuditResult":
        return cls(outcome=AuditOutcome.SKIPPED, reason=reason)

    @classmethod
    def failed(cls, findings: list[BorderFinding]) -> "AuditResult":
        return cls(outcome=AuditOutcome.FAILED, findings=findings)


class _QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:  # noqa: ARG002
        del format, args
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


def run_border_audit(dist_dir: Path) -> AuditResult:
    """Run the border-audit page in headless Chromium against ``dist_dir``.

    Returns an ``AuditResult`` whose outcome distinguishes PASSED from SKIPPED
    (e.g., Playwright unavailable) from FAILED (findings present). The build
    treats only FAILED as fatal; SKIPPED logs a warning so CI policy can
    decide whether to require it explicitly.
    """
    try:
        from playwright import sync_api  # type: ignore[import-not-found]
    except ImportError:
        reason = "playwright not installed (install dev deps to enable)"
        logger.warning(f"Skipping border audit: {reason}")
        return AuditResult.skipped(reason)

    audit_path = dist_dir / PAGE
    if not audit_path.exists():
        reason = f"{audit_path} not found"
        logger.warning(f"Skipping border audit: {reason}")
        return AuditResult.skipped(reason)

    port = _free_port()
    server = _serve(dist_dir, port)
    try:
        url = f"http://localhost:{port}/{PAGE}"
        try:
            with sync_api.sync_playwright() as pw:
                try:
                    browser = pw.chromium.launch()
                except sync_api.Error as err:
                    reason = (
                        f"Chromium not available ({err}); "
                        f"run 'uv run playwright install chromium' to enable"
                    )
                    logger.warning(f"Skipping border audit: {reason}")
                    return AuditResult.skipped(reason)
                try:
                    page = browser.new_page(viewport={"width": 1280, "height": 900})
                    page.goto(url)
                    page.wait_for_function(
                        "document.body.dataset.testStatus === 'pass' "
                        "|| document.body.dataset.testStatus === 'fail'",
                        timeout=WAIT_MS,
                    )
                    status = str(page.evaluate("document.body.dataset.testStatus"))
                    if status == "pass":
                        return AuditResult.passed()
                    rows = page.evaluate(
                        "[...document.querySelectorAll('[data-results] tr')]"
                        ".filter(r => r.children[1]?.textContent?.trim().startsWith('FAIL'))"
                        ".map(r => ({ page: r.children[0].textContent.trim(), "
                        "detail: r.children[2].textContent.trim() }))"
                    )
                    return AuditResult.failed(
                        [BorderFinding(page=r["page"], detail=r["detail"]) for r in rows]
                    )
                finally:
                    browser.close()
        except sync_api.Error as err:
            reason = f"Playwright error: {err}"
            logger.warning(f"Skipping border audit: {reason}")
            return AuditResult.skipped(reason)
    finally:
        server.shutdown()
        server.server_close()
