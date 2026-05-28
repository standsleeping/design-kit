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
    ``Browser`` (typed loosely: Playwright is an optional, undeclared dependency).
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
    "see SCROLL_CONTAINMENT / NO_PAGE_SCROLL: no page or layout container scrolls "
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


# --- spec: adaptive components behavior page ---

_ADAPT_PAGE = "responsive-adaptive-tests.html"
_ADAPT_MIN_CHECKS = 10
_ADAPT_VERDICT_READY = (
    "document.body.dataset.testStatus === 'pass' "
    "|| document.body.dataset.testStatus === 'fail'"
)
_ADAPT_FAIL_ROWS_JS = (
    "[...document.querySelectorAll('[data-results] tr')]"
    ".filter(r => r.children[1].textContent.trim() === 'FAIL')"
    ".map(r => `${r.children[0].textContent}: ${r.children[2].textContent}`)"
)
_ADAPT_REMEDIATION = (
    "open pages/responsive-adaptive-tests.html; a failing row names the broken "
    "behavior (SessionStatsFooter priority-drop, Breadcrumb middle-collapse, or "
    "AdaptiveMetricsList column-hide). A whole component failing at mount usually "
    "means its ResizeObserver enhancer is not adapting after attach."
)


def _run_adaptive_behavior(ctx: HeadlessContext) -> AuditOutcome:
    """Run the adaptive-components behavior page and read its self-reported verdict."""
    if _ADAPT_PAGE not in ctx.page_names:
        return AuditOutcome(
            slug="adaptive-behavior",
            name="Adaptive components behavior",
            principle="RESPONSIVE_COMPONENTS",
            kind=AuditKind.HEADLESS,
            status=AuditStatus.SKIPPED,
            note=f"{_ADAPT_PAGE} not in served site",
        )
    page = ctx.browser.new_page()
    try:
        page.goto(f"{ctx.base_url}/{_ADAPT_PAGE}")
        page.wait_for_function(_ADAPT_VERDICT_READY, timeout=15_000)
        status = str(page.evaluate("document.body.dataset.testStatus"))
        total = int(page.evaluate("document.body.dataset.testTotal"))
        fail_rows = list(page.evaluate(_ADAPT_FAIL_ROWS_JS))
    finally:
        page.close()

    findings = [Finding(locator=_ADAPT_PAGE, detail=str(row)) for row in fail_rows]
    if total < _ADAPT_MIN_CHECKS:
        findings.append(
            Finding(
                locator=_ADAPT_PAGE,
                detail=f"only {total} checks ran; expected at least {_ADAPT_MIN_CHECKS}",
            )
        )
    failed = status != "pass" or total < _ADAPT_MIN_CHECKS
    return AuditOutcome(
        slug="adaptive-behavior",
        name="Adaptive components behavior",
        principle="RESPONSIVE_COMPONENTS",
        kind=AuditKind.HEADLESS,
        status=AuditStatus.FAILED if failed else AuditStatus.PASSED,
        findings=tuple(findings),
        remediation=_ADAPT_REMEDIATION,
    )


ADAPTIVE_BEHAVIOR_SPEC = HeadlessSpec(
    slug="adaptive-behavior",
    name="Adaptive components behavior",
    principle="RESPONSIVE_COMPONENTS",
    run=_run_adaptive_behavior,
)


# --- spec: every component fits its own box ---

_FIT_PAGE = "responsive-fit-tests.html"
_FIT_MIN_CHECKS = 50
_FIT_VERDICT_READY = (
    "document.body.dataset.testStatus === 'pass' "
    "|| document.body.dataset.testStatus === 'fail'"
)
_FIT_FAIL_ROWS_JS = (
    "[...document.querySelectorAll('[data-results] tr')]"
    ".filter(r => r.children[1].textContent.trim() === 'FAIL')"
    ".map(r => `${r.children[0].textContent}: ${r.children[2].textContent}`)"
)
_FIT_REMEDIATION = (
    "open pages/responsive-fit-tests.html; a failing row names the component, "
    "variant, and width where it overflows its own box. The fix is on the "
    "component (cap with max-width:100%, relax a min-width floor to min(…,100%), "
    "or add ellipsis/scroll/priority-drop) — never on the host. See "
    "RESPONSIVE_COMPONENTS and ELASTIC_CONTENT_NEEDS_GIVE."
)


def _run_fit(ctx: HeadlessContext) -> AuditOutcome:
    """Run the fits-its-own-box page and read its self-reported verdict."""
    if _FIT_PAGE not in ctx.page_names:
        return AuditOutcome(
            slug="component-fit",
            name="Component fits its own box",
            principle="RESPONSIVE_COMPONENTS",
            kind=AuditKind.HEADLESS,
            status=AuditStatus.SKIPPED,
            note=f"{_FIT_PAGE} not in served site",
        )
    page = ctx.browser.new_page()
    try:
        page.goto(f"{ctx.base_url}/{_FIT_PAGE}")
        page.wait_for_function(_FIT_VERDICT_READY, timeout=30_000)
        status = str(page.evaluate("document.body.dataset.testStatus"))
        total = int(page.evaluate("document.body.dataset.testTotal"))
        fail_rows = list(page.evaluate(_FIT_FAIL_ROWS_JS))
    finally:
        page.close()

    findings = [Finding(locator=_FIT_PAGE, detail=str(row)) for row in fail_rows]
    if total < _FIT_MIN_CHECKS:
        findings.append(
            Finding(
                locator=_FIT_PAGE,
                detail=f"only {total} checks ran; expected at least {_FIT_MIN_CHECKS}",
            )
        )
    failed = status != "pass" or total < _FIT_MIN_CHECKS
    return AuditOutcome(
        slug="component-fit",
        name="Component fits its own box",
        principle="RESPONSIVE_COMPONENTS",
        kind=AuditKind.HEADLESS,
        status=AuditStatus.FAILED if failed else AuditStatus.PASSED,
        findings=tuple(findings),
        remediation=_FIT_REMEDIATION,
    )


FIT_SPEC = HeadlessSpec(
    slug="component-fit",
    name="Component fits its own box",
    principle="RESPONSIVE_COMPONENTS",
    run=_run_fit,
)


# --- spec: load trajectory (first-paint state + layout stability) ---
#
# The other headless specs wait for the page to settle, then measure the final DOM.
# This one measures the *trajectory* from first paint to settled — the window where
# FOUC and load-time layout shift live, which a settle-then-measure check cannot see.
#
# Part 1 (NO_FIRST_PAINT_FLASH): seed a non-default theme, then load the page twice —
# once normally, once with every .js request aborted. The inline head bootstrap is not
# a request, so it still runs; the deferred/module scripts do not. If the no-JS render
# already matches the settled render (same theme attributes, same body colors), then the
# synchronous bootstrap alone establishes first-paint state and there is no flash. A page
# that depended on deferred JS to apply the theme fails here: its no-JS colors are the
# default, not the seeded theme.
#
# Part 2 (HYDRATION_RESERVES_GEOMETRY): register a layout-shift PerformanceObserver before
# load and sum the cumulative score across the whole load. A shell that reserves its
# geometry scores ~0; one that mounts chrome into collapsed rails scores a visible jump.
# Enforced on every page at one tight bound now that the self-hosted, metric-matched font
# removed the font-swap shift that previously forced a looser general threshold.

_FP_SEED = {"dk-luminance": "dark", "dk-color-theme": "solarized"}
_FP_LAYOUT_SEED = '{"nav":300,"inspector":400}'
_SB_PAGE = "storybook.html"
# Web-vitals "good" is < 0.1, but every design-kit page should score ~0: the brand font
# is self-hosted with metric-matched fallbacks (token_css.FONT_FACE), so the font swap
# no longer reflows text, and each shell reserves its geometry. With font-swap noise
# eliminated, the former split (a looser 0.1 general bound vs a 0.05 storybook bound)
# collapses into one tight threshold for every page; the only remaining load-time shift
# would be a real geometry-reservation regression, which this catches.
_CLS_THRESHOLD = 0.05
_FP_SETTLE_MS = 700  # storybook: config fetch + dynamic imports + sidebar mount
_CLS_SETTLE_MS = 800  # general: let load-time reflow settle

_FP_CAPTURE_JS = """() => ({
  lum: document.documentElement.getAttribute('data-luminance'),
  theme: document.documentElement.getAttribute('data-color-theme'),
  bg: getComputedStyle(document.body).backgroundColor,
  fg: getComputedStyle(document.body).color,
})"""

_CLS_INIT_JS = """
window.__cls = 0;
new PerformanceObserver((list) => {
  for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
}).observe({ type: 'layout-shift', buffered: true });
"""

_FP_REMEDIATION = (
    "see NO_FIRST_PAINT_FLASH and HYDRATION_RESERVES_GEOMETRY. Persisted render state "
    "(theme, luminance) must be set by the inline head bootstrap (design_kit.head_bootstrap, "
    "injected by build) before any module script; persisted geometry must be reserved in CSS "
    "so JS-mounted chrome fills boxes that are already the right size."
)


def _seed_script(layout: bool) -> str:
    sets = "".join(f"localStorage.setItem({k!r},{v!r});" for k, v in _FP_SEED.items())
    if layout:
        sets += f"localStorage.setItem('dk-storybook-layout',{_FP_LAYOUT_SEED!r});"
    return f"try{{{sets}}}catch(e){{}}"


def _run_first_paint(ctx: HeadlessContext) -> AuditOutcome:
    """Measure the load trajectory: first-paint state correctness, and storybook CLS."""
    findings: list[Finding] = []

    # Part 1: no-JS render must equal settled render, for every page.
    for name in ctx.page_names:
        url = f"{ctx.base_url}/{name}"

        settled_page = ctx.browser.new_page(viewport={"width": 1280, "height": 900})
        settled_page.add_init_script(_seed_script(layout=name == _SB_PAGE))
        try:
            settled_page.goto(url, wait_until="load")
            settled_page.wait_for_timeout(_FP_SETTLE_MS if name == _SB_PAGE else 200)
            settled = settled_page.evaluate(_FP_CAPTURE_JS)
        finally:
            settled_page.close()

        boot_page = ctx.browser.new_page(viewport={"width": 1280, "height": 900})
        boot_page.add_init_script(_seed_script(layout=name == _SB_PAGE))
        boot_page.route("**/*.js", lambda route: route.abort())
        try:
            boot_page.goto(url, wait_until="load")
            boot = boot_page.evaluate(_FP_CAPTURE_JS)
        finally:
            boot_page.close()

        if (
            boot["theme"] != _FP_SEED["dk-color-theme"]
            or boot["lum"] != _FP_SEED["dk-luminance"]
        ):
            findings.append(
                Finding(
                    locator=name,
                    detail=(
                        "first paint (no JS) missing seeded theme: "
                        f"data-color-theme={boot['theme']!r} data-luminance={boot['lum']!r}; "
                        "the head bootstrap did not establish it"
                    ),
                )
            )
        elif boot["bg"] != settled["bg"] or boot["fg"] != settled["fg"]:
            findings.append(
                Finding(
                    locator=name,
                    detail=(
                        f"first paint colors differ from settled (FOUC): "
                        f"first bg={boot['bg']} fg={boot['fg']}; "
                        f"settled bg={settled['bg']} fg={settled['fg']}"
                    ),
                )
            )

    # Part 2: layout stability across the load (CLS), every page held to one tight bound.
    # A page opts out with [data-cls-exempt] only when its load-time shift is by design (a
    # self-reporting test harness injecting results after load, not a user surface) — the
    # attribute's value documents why. Font swap is no longer a valid reason to exempt: the
    # brand font is self-hosted with metric-matched fallbacks, so the swap is shift-free.
    for name in ctx.page_names:
        cls_page = ctx.browser.new_page(viewport={"width": 1280, "height": 900})
        cls_page.add_init_script(_seed_script(layout=name == _SB_PAGE))
        cls_page.add_init_script(_CLS_INIT_JS)
        try:
            cls_page.goto(f"{ctx.base_url}/{name}", wait_until="load")
            cls_page.wait_for_timeout(
                _FP_SETTLE_MS if name == _SB_PAGE else _CLS_SETTLE_MS
            )
            exempt = bool(
                cls_page.evaluate(
                    "!!(document.body && document.body.hasAttribute('data-cls-exempt'))"
                    " || document.documentElement.hasAttribute('data-cls-exempt')"
                )
            )
            cls = float(cls_page.evaluate("window.__cls || 0"))
        finally:
            cls_page.close()
        if exempt:
            continue
        if cls > _CLS_THRESHOLD:
            findings.append(
                Finding(
                    locator=name,
                    detail=(
                        f"cumulative layout shift {cls:.3f} over load exceeds "
                        f"{_CLS_THRESHOLD}; chrome or content is resizing the layout "
                        f"after first paint (reserve its geometry, or opt out with "
                        f"data-cls-exempt if the shift is by design)"
                    ),
                )
            )

    return AuditOutcome(
        slug="first-paint",
        name="Load trajectory (first paint + CLS)",
        principle="NO_FIRST_PAINT_FLASH",
        kind=AuditKind.HEADLESS,
        status=AuditStatus.FAILED if findings else AuditStatus.PASSED,
        findings=tuple(findings),
        remediation=_FP_REMEDIATION,
    )


FIRST_PAINT_SPEC = HeadlessSpec(
    slug="first-paint",
    name="Load trajectory (first paint + CLS)",
    principle="NO_FIRST_PAINT_FLASH",
    run=_run_first_paint,
)


# --- spec: vertical metric drift (runtime arm of VERTICAL_METRIC_DRIFT) ---

# Two glyph-baseline positions on the same flex row are "drifted" when their visible
# glyph rectangles disagree by more than this many CSS pixels on the block axis. 1.0
# catches the canonical case (the storybook header's 1.4px count-vs-button drift before
# text-box-trim) while staying above sub-pixel anti-aliasing noise (typically < 0.5px).
_VMD_GLYPH_TOLERANCE = 1.0

# Compare only sibling pairs whose font-sizes match within this many CSS pixels. A flex
# row that intentionally mixes scales (a heading next to a count) is not vertical-metric
# drift; that is design. Tighter than 0.5px would treat 12px-vs-12.5px sub-token sizes as
# distinct, which they are not for any practical alignment intent.
_VMD_FONT_SIZE_TOLERANCE = 0.5

_VMD_REMEDIATION = (
    "see VERTICAL_METRIC_DRIFT: sibling inline elements drift when each computes its "
    "inline-box height from a different reference (UA defaults vs cascade vs explicit "
    "override). Anchor every peer's visible glyph rectangle to font metrics with "
    "text-box: trim-both cap alphabetic. Opt a documented pair out with "
    "data-vmd-exempt on the row or any ancestor."
)

# Walks every single-line, row-direction flex container and reports pairs of children
# whose visible glyph rectangles drift on the block axis despite sharing a font-size.
# `Range.getBoundingClientRect()` measures actual rendered glyph pixels — independent of
# the surrounding line-box — so the comparison is glyph-anchored, not box-anchored, and
# catches drift inside boxes that PEER_RAIL would consider correctly sized. The
# single-line filter (glyph height < ~2x font-size) excludes block-level columns and
# multi-line prose containers, which produce huge unaligned glyph rects under
# `selectNodeContents` and would otherwise drown the chrome-rail signal.
_VMD_JS = """
(args) => {
  const { glyphTolerance, fontSizeTolerance } = args;
  const label = (el) => {
    const tag = el.tagName.toLowerCase();
    const cls = (typeof el.className === 'string' && el.className.trim())
      ? '.' + el.className.trim().split(/\\s+/).join('.') : '';
    return tag + cls;
  };
  const preview = (el) => {
    const t = (el.textContent || '').trim().replace(/\\s+/g, ' ');
    return t.length > 30 ? t.slice(0, 30) + '\\u2026' : t;
  };
  // Measure the rect of the first significant text node only, not selectNodeContents
  // over the whole element. A child that contains a form control or inline visual
  // alongside its text (e.g. <label><input>Text</label>) would otherwise report a
  // rect dominated by the control's box, not the visible glyphs we want to align.
  // Also return the font-size of the text's parent (not of the flex child el):
  // a placeholder span inheriting body font-size at 16px may wrap a button at 12px,
  // and the rect we measure is the button's text, not the placeholder's.
  const glyphMeasure = (el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.textContent && n.textContent.trim())
        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });
    const firstText = walker.nextNode();
    if (!firstText || !firstText.parentElement) return null;
    const r = document.createRange();
    try {
      r.selectNodeContents(firstText);
      const rect = r.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      const cs = getComputedStyle(firstText.parentElement);
      return { rect, fontSize: parseFloat(cs.fontSize) };
    } catch { return null; }
  };
  const out = [];
  document.querySelectorAll('*').forEach((el) => {
    if (el.closest('[data-vmd-exempt]')) return;
    const style = getComputedStyle(el);
    const disp = style.display;
    if (disp !== 'flex' && disp !== 'inline-flex') return;
    const dir = style.flexDirection;
    if (dir !== 'row' && dir !== 'row-reverse') return;
    const wrap = style.flexWrap;
    if (wrap === 'wrap' || wrap === 'wrap-reverse') return;
    const kids = [...el.children].filter((c) => {
      const r = c.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      return (c.textContent || '').trim().length > 0;
    });
    if (kids.length < 2) return;
    const measured = [];
    for (const c of kids) {
      const box = c.getBoundingClientRect();
      // Chrome-rail filter: a peer in a chrome rail has a short outer box (a
      // row of items, not a page column). A flex container whose children are
      // hundreds of pixels tall is a layout shell, not a rail; skip its
      // children entirely. The threshold (80px) is comfortably above typical
      // chrome-row item heights (titles, toggles, badges run 14-40px) and
      // well below column heights (300px+).
      if (box.height > 80) continue;
      const gm = glyphMeasure(c);
      if (!gm) continue;
      // Single-line text filter: even within chrome, skip a child whose
      // first-text-node rect spans more than two font-sizes; that's a
      // multi-line block, not a chrome label.
      if (gm.rect.height > gm.fontSize * 2) continue;
      measured.push({ el: c, glyph: gm.rect, fontSize: gm.fontSize });
    }
    for (let i = 0; i < measured.length; i++) {
      for (let j = i + 1; j < measured.length; j++) {
        const a = measured[i], b = measured[j];
        if (Math.abs(a.fontSize - b.fontSize) > fontSizeTolerance) continue;
        const topDiff = Math.abs(a.glyph.top - b.glyph.top);
        const bottomDiff = Math.abs(a.glyph.bottom - b.glyph.bottom);
        if (topDiff <= glyphTolerance && bottomDiff <= glyphTolerance) continue;
        out.push({
          container: label(el),
          a: label(a.el) + (preview(a.el) ? ' "' + preview(a.el) + '"' : ''),
          b: label(b.el) + (preview(b.el) ? ' "' + preview(b.el) + '"' : ''),
          topDrift: topDiff.toFixed(2),
          bottomDrift: bottomDiff.toFixed(2),
          fontSize: a.fontSize + 'px',
        });
      }
    }
  });
  return out;
}
"""


def _run_vertical_metric_drift(ctx: HeadlessContext) -> AuditOutcome:
    """Load every page and collect every glyph-drift pair on row-direction flex rails."""
    findings: list[Finding] = []
    args = {
        "glyphTolerance": _VMD_GLYPH_TOLERANCE,
        "fontSizeTolerance": _VMD_FONT_SIZE_TOLERANCE,
    }
    for width in _WIDTHS:
        page = ctx.browser.new_page(viewport={"width": width, "height": _HEIGHT})
        try:
            for name in ctx.page_names:
                page.goto(f"{ctx.base_url}/{name}", wait_until="load")
                page.wait_for_timeout(_SETTLE_MS)
                for d in page.evaluate(_VMD_JS, args):
                    findings.append(
                        Finding(
                            locator=f"{name} @ {width}px → {d['container']}",
                            detail=(
                                f"{d['a']} vs {d['b']} "
                                f"(font {d['fontSize']}): glyph top drift "
                                f"{d['topDrift']}px, bottom drift {d['bottomDrift']}px"
                            ),
                        )
                    )
        finally:
            page.close()
    status = AuditStatus.FAILED if findings else AuditStatus.PASSED
    return AuditOutcome(
        slug="vertical-metric-drift",
        name="Vertical metric drift",
        principle="VERTICAL_METRIC_DRIFT",
        kind=AuditKind.HEADLESS,
        status=status,
        findings=tuple(findings),
        remediation=_VMD_REMEDIATION,
    )


VERTICAL_METRIC_DRIFT_SPEC = HeadlessSpec(
    slug="vertical-metric-drift",
    name="Vertical metric drift",
    principle="VERTICAL_METRIC_DRIFT",
    run=_run_vertical_metric_drift,
)


HEADLESS_REGISTRY: tuple[HeadlessSpec, ...] = (
    OVERFLOW_SPEC,
    RESPONSIVE_TABLE_SPEC,
    ADAPTIVE_BEHAVIOR_SPEC,
    FIT_SPEC,
    FIRST_PAINT_SPEC,
    VERTICAL_METRIC_DRIFT_SPEC,
)


def headless_specs() -> tuple[HeadlessSpec, ...]:
    return HEADLESS_REGISTRY
