"""Headless audits: serve a built site, drive one Chromium, normalize to AuditOutcome.

The static audits read files; these audits measure a *rendered* page. They share one server
and one browser per run (this module owns both lifecycles), and each normalizes its native
result into the same :class:`AuditOutcome` as the static audits, so one report presents both.

Playwright and Chromium are optional and undeclared dependencies: the import is by string so
neither ``src`` nor mypy carries a static dependency on them. When Playwright, Chromium, or
the served site is absent, every headless audit reports SKIPPED, so token-only environments
still complete cleanly.

``audit --headless`` and the headless pytest tests both run the specs in :data:`HEADLESS_REGISTRY`,
so the rendered-page checks are defined once and cannot drift.
"""

from __future__ import annotations

import http.server
import importlib
import socket
import socketserver
import threading
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from design_kit.audit.model import AuditKind, AuditOutcome, AuditStatus, Finding

if TYPE_CHECKING:
    from collections.abc import Callable, Iterable
    from pathlib import Path


@dataclass(frozen=True)
class HeadlessContext:
    """What a headless spec needs to drive the shared browser.

    ``base_url`` serves the built site; ``page_names`` are the ``*.html`` files found in it
    (a spec needing a page that is absent reports SKIPPED); ``browser`` is a live Playwright
    ``Browser`` (typed loosely — Playwright is an optional, undeclared dependency).
    """

    base_url: str
    page_names: tuple[str, ...]
    browser: Any


@dataclass(frozen=True)
class HeadlessSpec:
    """One headless audit, runnable against a :class:`HeadlessContext`."""

    slug: str
    name: str
    principle: str
    run: Callable[[HeadlessContext], AuditOutcome]


def _skipped(spec: HeadlessSpec, note: str) -> AuditOutcome:
    return AuditOutcome(
        slug=spec.slug,
        name=spec.name,
        principle=spec.principle,
        kind=AuditKind.HEADLESS,
        status=AuditStatus.SKIPPED,
        note=note,
    )


# --- shared static-file server (lifted from the two former headless test files) ---


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

    server = socketserver.ThreadingTCPServer(("", port), handler_factory)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


def _load_sync_api() -> Any:
    """Import ``playwright.sync_api`` lazily; return ``None`` when Playwright is absent.

    Imported by string so ``src`` (and mypy) never carries a static dependency on the
    optional Playwright package.
    """
    try:
        return importlib.import_module("playwright.sync_api")
    except ImportError:
        return None


def _launch_chromium(sync_api: Any, pw: Any) -> tuple[Any, str | None]:
    """Launch headless Chromium; return ``(None, error)`` when the binary is unavailable.

    Converts the launch exception into a value at this boundary so the caller branches on a
    sentinel instead of an unknown (``Any``-typed) exception type.
    """
    try:
        return pw.chromium.launch(), None
    except sync_api.Error as err:
        return None, str(err)


def run_headless_audits(
    site_dir: Path, specs: Iterable[HeadlessSpec]
) -> tuple[AuditOutcome, ...]:
    """Serve ``site_dir``, launch one Chromium, run each spec, and collect outcomes.

    Always returns one outcome per spec. Returns SKIPPED outcomes (not failures) when the
    site directory is missing or empty, when Playwright is not installed, or when Chromium
    is not available, so a token-only run still completes. A spec that raises a Playwright
    error is reported SKIPPED rather than crashing the run. The server and browser are torn
    down before returning.
    """
    specs = tuple(specs)
    if not site_dir.is_dir():
        note = f"{site_dir} not found; run `design-kit build` first"
        return tuple(_skipped(s, note) for s in specs)

    sync_api = _load_sync_api()
    if sync_api is None:
        note = "playwright not installed; run `uv sync`"
        return tuple(_skipped(s, note) for s in specs)

    page_names = tuple(sorted(p.name for p in site_dir.glob("*.html")))
    if not page_names:
        return tuple(_skipped(s, f"no HTML pages under {site_dir}") for s in specs)

    port = _free_port()
    server = _serve(site_dir, port)
    try:
        with sync_api.sync_playwright() as pw:
            browser, launch_err = _launch_chromium(sync_api, pw)
            if browser is None:
                note = (
                    f"Chromium not available: {launch_err}. "
                    "Run `uv run playwright install chromium`."
                )
                return tuple(_skipped(s, note) for s in specs)
            ctx = HeadlessContext(
                base_url=f"http://localhost:{port}",
                page_names=page_names,
                browser=browser,
            )
            try:
                outcomes: list[AuditOutcome] = []
                for spec in specs:
                    try:
                        outcomes.append(spec.run(ctx))
                    except sync_api.Error as err:
                        outcomes.append(_skipped(spec, f"Playwright error: {err}"))
                return tuple(outcomes)
            finally:
                browser.close()
    finally:
        server.shutdown()
        server.server_close()


# --- spec: horizontal overflow (runtime arm of SCROLL_CONTAINMENT) ---

# Probe widths. 960 exercises the storybook's narrow tier (the responsive shell has
# hidden the right inspector and the center column reflows); the wider widths are sanity
# probes. A regression here is a center column that scrolls instead of yielding.
_WIDTHS = (960, 1280, 1680)
_HEIGHT = 900
# scrollWidth / clientWidth are integers; allow 2px slack for sub-pixel borders so the
# audit flags real overflow, not rounding.
_TOLERANCE = 2
_SETTLE_MS = 350  # let JS-driven layout settle after load

# Returns the list of layout violations on the page as preformatted detail objects. Runs in
# the browser; `tol` is passed from Python.
_OVERFLOW_JS = """
(tol) => {
  // A zero-width element (e.g. content inside a rail collapsed to width:0) cannot
  // present a visible horizontal scrollbar, so its scrollWidth is not real overflow.
  const overflowing = (el) => el.clientWidth > 0 && el.scrollWidth - el.clientWidth > tol;
  const label = (el) => el.tagName.toLowerCase()
    + (typeof el.className === 'string' && el.className.trim()
        ? '.' + el.className.trim().split(/\\s+/).join('.') : '');
  const out = [];
  const push = (detail, culprits = []) => out.push({ detail, culprits });

  // 1. Page-level horizontal scroll.
  const de = document.documentElement;
  if (overflowing(de)) push(`page documentElement scrollW=${de.scrollWidth} clientW=${de.clientWidth}`);

  // 2. The center container (clips x, but scrollWidth still reports overflow).
  document.querySelectorAll('.dk-app-shell-main').forEach((m, i) => {
    if (!overflowing(m)) return;
    const culprits = [];
    m.querySelectorAll('*').forEach((el) => {
      if (overflowing(el)) culprits.push(label(el) + ' [+' + (el.scrollWidth - el.clientWidth) + 'px]');
    });
    push(`center .dk-app-shell-main[${i}] scrollW=${m.scrollWidth} clientW=${m.clientWidth}`, culprits.slice(0, 6));
  });

  // 3. Any element that is an actual horizontal scroller, minus opt-outs.
  document.querySelectorAll('*').forEach((el) => {
    if (el.classList.contains('dk-app-shell-main')) return; // covered by (2)
    const ox = getComputedStyle(el).overflowX;
    if ((ox !== 'auto' && ox !== 'scroll') || !overflowing(el)) return;
    if (el.closest('[data-allow-x-scroll]')) return; // intentional leaf scroller
    push(`x-scroll ${label(el)} scrollW=${el.scrollWidth} clientW=${el.clientWidth}`);
  });

  // 4. Fixed chrome rails must not wrap (ELASTIC_CONTENT_NEEDS_GIVE). A dk-topbar
  //    whose children fall on more than one row has taken on elastic content it
  //    cannot give for, unless it is an explicit wrapping strip (data-wrap-ok).
  //    align-items:center puts a single row's children on one center line, so a
  //    spread between child centers means the strip wrapped.
  document.querySelectorAll('.dk-topbar').forEach((rail) => {
    if (rail.closest('[data-wrap-ok]')) return;
    const kids = [...rail.children].filter((c) => c.getClientRects().length);
    if (kids.length < 2) return;
    const centers = kids.map((c) => { const r = c.getBoundingClientRect(); return r.top + r.height / 2; });
    const spread = Math.max(...centers) - Math.min(...centers);
    if (spread > 8) push(`rail-wrap ${label(rail)} children span >1 row (spread ${Math.round(spread)}px)`, kids.map(label).slice(0, 6));
  });

  return out;
}
"""

_OVERFLOW_REMEDIATION = (
    "see SCROLL_CONTAINMENT / NO_PAGE_SCROLL — no page or layout container scrolls "
    "horizontally. Opt a genuine leaf scroller out with data-allow-x-scroll; opt an "
    "intentional wrapping rail out with data-wrap-ok."
)


def _run_overflow(ctx: HeadlessContext) -> AuditOutcome:
    """Load every page at several widths and collect any horizontal-overflow violation."""
    findings: list[Finding] = []
    for width in _WIDTHS:
        page = ctx.browser.new_page(viewport={"width": width, "height": _HEIGHT})
        try:
            for name in ctx.page_names:
                page.goto(f"{ctx.base_url}/{name}", wait_until="load")
                page.wait_for_timeout(_SETTLE_MS)
                for o in page.evaluate(_OVERFLOW_JS, _TOLERANCE):
                    detail = o["detail"]
                    if o["culprits"]:
                        detail += "; culprits: " + ", ".join(o["culprits"])
                    findings.append(
                        Finding(locator=f"{name} @ {width}px", detail=detail)
                    )
        finally:
            page.close()
    status = AuditStatus.FAILED if findings else AuditStatus.PASSED
    return AuditOutcome(
        slug="overflow",
        name="Horizontal overflow",
        principle="SCROLL_CONTAINMENT",
        kind=AuditKind.HEADLESS,
        status=status,
        findings=tuple(findings),
        remediation=_OVERFLOW_REMEDIATION,
    )


OVERFLOW_SPEC = HeadlessSpec(
    slug="overflow",
    name="Horizontal overflow",
    principle="SCROLL_CONTAINMENT",
    run=_run_overflow,
)


# --- spec: ResponsiveTable behavior page ---

_RT_PAGE = "responsive-table-tests.html"
_RT_MIN_CHECKS = 18
# The behavior page writes its verdict into document.body.dataset; these read it back.
_RT_VERDICT_READY = (
    "document.body.dataset.testStatus === 'pass' "
    "|| document.body.dataset.testStatus === 'fail'"
)
_RT_FAIL_ROWS_JS = (
    "[...document.querySelectorAll('[data-results] tr')]"
    ".filter(r => r.children[1].textContent.trim() === 'FAIL')"
    ".map(r => `${r.children[0].textContent}: ${r.children[2].textContent}`)"
)
_RT_REMEDIATION = (
    "open pages/responsive-table-tests.html; a failing row names the broken check "
    "(wide/narrow/medium mode, sidenote overlay, presence dots, or the body contract)."
)


def _run_responsive_table(ctx: HeadlessContext) -> AuditOutcome:
    """Run the ResponsiveTable behavior page and read its self-reported verdict."""
    if _RT_PAGE not in ctx.page_names:
        return AuditOutcome(
            slug="responsive-table",
            name="ResponsiveTable behavior",
            principle="responsive-table-contract",
            kind=AuditKind.HEADLESS,
            status=AuditStatus.SKIPPED,
            note=f"{_RT_PAGE} not in served site",
        )
    page = ctx.browser.new_page()
    try:
        page.goto(f"{ctx.base_url}/{_RT_PAGE}")
        page.wait_for_function(_RT_VERDICT_READY, timeout=15_000)
        status = str(page.evaluate("document.body.dataset.testStatus"))
        total = int(page.evaluate("document.body.dataset.testTotal"))
        fail_rows = list(page.evaluate(_RT_FAIL_ROWS_JS))
    finally:
        page.close()

    findings = [Finding(locator=_RT_PAGE, detail=str(row)) for row in fail_rows]
    if total < _RT_MIN_CHECKS:
        findings.append(
            Finding(
                locator=_RT_PAGE,
                detail=f"only {total} checks ran; expected at least {_RT_MIN_CHECKS}",
            )
        )
    failed = status != "pass" or total < _RT_MIN_CHECKS
    return AuditOutcome(
        slug="responsive-table",
        name="ResponsiveTable behavior",
        principle="responsive-table-contract",
        kind=AuditKind.HEADLESS,
        status=AuditStatus.FAILED if failed else AuditStatus.PASSED,
        findings=tuple(findings),
        remediation=_RT_REMEDIATION,
    )


RESPONSIVE_TABLE_SPEC = HeadlessSpec(
    slug="responsive-table",
    name="ResponsiveTable behavior",
    principle="responsive-table-contract",
    run=_run_responsive_table,
)


HEADLESS_REGISTRY: tuple[HeadlessSpec, ...] = (OVERFLOW_SPEC, RESPONSIVE_TABLE_SPEC)


def headless_specs() -> tuple[HeadlessSpec, ...]:
    return HEADLESS_REGISTRY
