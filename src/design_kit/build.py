"""Build command: generate CSS and preview pages into an output directory."""

import hashlib
import json
import shutil
import time
from datetime import datetime, timezone
from importlib.metadata import PackageNotFoundError, version as pkg_version
from pathlib import Path
from typing import TypedDict

from design_kit.border_width_lint import (
    BorderWidthLintOutcome,
    run_border_width_lint,
)
from design_kit.breakpoints import load_breakpoints, substitute_breakpoints
from design_kit.contrast_self_test import run as run_contrast_lint
from design_kit.dimension_lint import (
    DimensionLintOutcome,
    run_dimension_lint,
)
from design_kit.focus_ring_lint import (
    FocusRingLintOutcome,
    run_focus_ring_lint,
)
from design_kit.interactive_state_lint import (
    InteractiveStateLintOutcome,
    run_interactive_state_lint,
)
from design_kit.icon_registry import generate_registry
from design_kit.logging import get_logger
from design_kit.margin_lint import MarginLintOutcome, run_margin_lint
from design_kit.padding_lint import PaddingLintOutcome, run_padding_lint
from design_kit.page_lint import PageLintOutcome, run_page_lint
from design_kit.peer_edge_lint import (
    PeerEdgeLintOutcome,
    run_peer_edge_lint,
)
from design_kit.preview import generate_preview_html
from design_kit.radius_lint import RadiusLintOutcome, run_radius_lint
from design_kit.scrollbar_gutter_lint import (
    ScrollbarGutterLintOutcome,
    run_scrollbar_gutter_lint,
)
from design_kit.token_css import generate_token_css
from design_kit.token_leak_lint import LeakLintOutcome, run_token_leak_lint

logger = get_logger(__name__)

COMPONENTS_DIR = Path("components")
PAGES_DIR = Path("pages")
# Top-level .js files under components/ that are framework infrastructure,
# not contract-conformant components. The rest of the framework lives under
# components/system/ and is excluded by directory; storybook.js stays at
# the top level because pages/storybook.html loads it directly.
NON_COMPONENT_TOP_LEVEL_JS = {"storybook.js"}

PACKAGE_NAME = "design-kit"


class ArtifactInfo(TypedDict):
    sha256: str
    bytes: int


class TokenManifest(TypedDict):
    name: str
    version: str
    generated_at: str
    artifacts: dict[str, ArtifactInfo]


def _read_version() -> str:
    try:
        return pkg_version(PACKAGE_NAME)
    except PackageNotFoundError:
        return "0.0.0+unknown"


def _copy_components_with_substitution(
    src_dir: Path, dest_dir: Path, breakpoints: dict[str, str]
) -> None:
    """Copy ``src_dir`` to ``dest_dir`` recursively, substituting breakpoints in CSS.

    Non-CSS files (JS, JSON, icons) are copied byte-for-byte via ``shutil.copy2``;
    CSS files have ``$bp-<name>`` references resolved against ``breakpoints``.
    """
    dest_dir.mkdir(parents=True, exist_ok=True)
    for src in src_dir.rglob("*"):
        rel = src.relative_to(src_dir)
        dst = dest_dir / rel
        if src.is_dir():
            dst.mkdir(parents=True, exist_ok=True)
        elif src.suffix == ".css":
            text = src.read_text(encoding="utf-8")
            dst.write_text(
                substitute_breakpoints(text, breakpoints), encoding="utf-8"
            )
        else:
            shutil.copy2(src, dst)


def build(tokens_path: Path, output_dir: Path) -> None:
    """Generate tokens.css and preview pages into output_dir.

    Also copies component JS files so the preview can import them.
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    if COMPONENTS_DIR.is_dir() and (COMPONENTS_DIR / "icons").is_dir():
        generate_registry(COMPONENTS_DIR)
    else:
        logger.warning("Skipping icon registry: components/icons/ not found")

    version = _read_version()
    header = (
        f"/* design-kit tokens v{version}\n"
        " * regenerate via `design-kit build`; do not edit manually\n"
        " */\n"
    )
    breakpoints = load_breakpoints(tokens_path)
    css = header + generate_token_css(tokens_path, breakpoints=breakpoints)
    css_path = output_dir / "tokens.css"
    css_path.write_text(css, encoding="utf-8")
    logger.info(f"Generated {css_path} (v{version})")

    lint_results, lint_report = run_contrast_lint(css_path)
    lint_failures = [r for r in lint_results if not r.passed]
    if lint_failures:
        logger.error(
            f"Token-pair contrast lint found {len(lint_failures)} failure(s)"
        )
        print(lint_report)
        for f in lint_failures:
            logger.error(
                f"  --{f.pair.a} x --{f.pair.b} ({f.theme}): "
                f"{f.ratio:.2f} < {f.pair.min_ratio} - {f.pair.reason}"
            )
        raise RuntimeError(
            f"tokens.css violates {len(lint_failures)} palette contract(s)"
        )
    logger.info(f"Contrast lint passed ({len(lint_results)} checks)")

    encoded_css = css.encode("utf-8")
    tokens_manifest: TokenManifest = {
        "name": "design-kit-tokens",
        "version": version,
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "artifacts": {
            "tokens.css": {
                "sha256": hashlib.sha256(encoded_css).hexdigest(),
                "bytes": len(encoded_css),
            }
        },
    }
    tokens_manifest_path = output_dir / "tokens.manifest.json"
    tokens_manifest_path.write_text(
        json.dumps(tokens_manifest, indent=2) + "\n", encoding="utf-8"
    )
    logger.info(f"Generated {tokens_manifest_path} (v{version})")

    html = substitute_breakpoints(generate_preview_html(), breakpoints)
    html_path = output_dir / "index.html"
    html_path.write_text(html, encoding="utf-8")
    logger.info(f"Generated {html_path}")

    cache_bust = str(int(time.time()))
    if PAGES_DIR.is_dir():
        for page in PAGES_DIR.glob("*.html"):
            dest = output_dir / page.name
            text = page.read_text(encoding="utf-8")
            text = text.replace("{{CACHE_BUST}}", cache_bust)
            text = substitute_breakpoints(text, breakpoints)
            dest.write_text(text, encoding="utf-8")
            logger.info(f"Copied {dest}")

    if COMPONENTS_DIR.is_dir():
        dest_components = output_dir / "components"
        if dest_components.exists():
            shutil.rmtree(dest_components)
        _copy_components_with_substitution(
            COMPONENTS_DIR, dest_components, breakpoints
        )
        logger.info(f"Copied components to {dest_components}")

        manifest = sorted(
            p.name
            for p in dest_components.glob("*.js")
            if p.name not in NON_COMPONENT_TOP_LEVEL_JS
        )
        manifest_path = dest_components / "manifest.json"
        manifest_path.write_text(
            json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
        )
        logger.info(f"Generated {manifest_path} ({len(manifest)} components)")
    else:
        logger.warning(f"Components directory not found: {COMPONENTS_DIR}")

    leak_result = run_token_leak_lint(
        COMPONENTS_DIR,
        pages_dir=PAGES_DIR,
        extra_files=[Path("src/design_kit/preview.py")],
    )
    if leak_result.outcome == LeakLintOutcome.FAILED:
        logger.error(
            f"Token-leak lint found {len(leak_result.leaks)} raw-color literal(s)"
        )
        for leak in leak_result.leaks:
            logger.error(f"  {leak.file}:{leak.line}: {leak.value} — {leak.snippet}")
        raise RuntimeError(
            f"Token-leak lint found {len(leak_result.leaks)} raw-color literal(s); "
            f"see TOKEN_DRIVEN_DESIGN — every surface consumes colors via var(--color-*)"
        )
    logger.info("Token-leak lint passed")

    focus_result = run_focus_ring_lint(COMPONENTS_DIR)
    if focus_result.outcome == FocusRingLintOutcome.FAILED:
        logger.error(
            f"Focus-ring lint found {len(focus_result.violations)} outwardly "
            f"offset focus ring(s) in component CSS"
        )
        for v in focus_result.violations:
            logger.error(f"  {v.file}:{v.line}: {v.selector} — {v.snippet}")
        raise RuntimeError(
            f"Focus-ring lint found {len(focus_result.violations)} outwardly "
            f"offset focus ring(s); see FOCUS_RING_INSIDE_CLIPPED_CONTAINER — "
            f"use negative outline-offset, or mark genuinely standalone "
            f"controls with /* focus-ring: standalone */"
        )
    logger.info("Focus-ring lint passed")

    state_result = run_interactive_state_lint(COMPONENTS_DIR)
    if state_result.outcome == InteractiveStateLintOutcome.FAILED:
        logger.error(
            f"Interactive-state lint found {len(state_result.violations)} "
            f":hover/:active rule(s) on non-focusable selectors"
        )
        for v in state_result.violations:
            logger.error(
                f"  {v.file}:{v.line}: {v.selector} — {v.snippet}"
            )
        raise RuntimeError(
            f"Interactive-state lint found {len(state_result.violations)} "
            f":hover/:active rule(s) on non-focusable selectors; see "
            f"STATE_BELONGS_TO_INTERACTIVE — pair the rule with a "
            f":focus-visible declaration on the same base, target a natively "
            f"focusable element, or mark drag-only handles with "
            f"/* state-lint: ok */"
        )
    logger.info("Interactive-state lint passed")

    peer_edge_result = run_peer_edge_lint(COMPONENTS_DIR)
    if peer_edge_result.outcome == PeerEdgeLintOutcome.FAILED:
        logger.error(
            f"Peer-edge lint found {len(peer_edge_result.violations)} "
            f"unreserved peer-edge accent(s) in component CSS"
        )
        for v in peer_edge_result.violations:
            logger.error(
                f"  {v.file}:{v.line}: {v.selector} → {v.declaration} — {v.snippet}"
            )
        raise RuntimeError(
            f"Peer-edge lint found {len(peer_edge_result.violations)} "
            f"unreserved peer-edge accent(s); see PEER_EDGE_RESERVATION — "
            f"the rest state must declare the same border-(side) with "
            f"solid transparent so the modifier state recolours a reserved "
            f"channel instead of shifting the box. Mark documented "
            f"exceptions with /* peer-edge: ok */"
        )
    logger.info("Peer-edge lint passed")

    gutter_result = run_scrollbar_gutter_lint(COMPONENTS_DIR)
    if gutter_result.outcome == ScrollbarGutterLintOutcome.FAILED:
        logger.error(
            f"Scrollbar-gutter lint found {len(gutter_result.violations)} "
            f"intermittent scroll container(s) without stable gutter"
        )
        for v in gutter_result.violations:
            logger.error(
                f"  {v.file}:{v.line}: {v.selector} → {v.declaration} — {v.snippet}"
            )
        raise RuntimeError(
            f"Scrollbar-gutter lint found {len(gutter_result.violations)} "
            f"intermittent scroll container(s) without stable gutter; see "
            f"STABLE_SCROLLBAR_GUTTER — pair every `overflow-y: auto` (or "
            f"`overflow: auto`) with `scrollbar-gutter: stable` in the same "
            f"rule, or hide the bar with `scrollbar-width: none`. Mark "
            f"documented exceptions with /* scroll-gutter: ok */"
        )
    logger.info("Scrollbar-gutter lint passed")

    padding_result = run_padding_lint(COMPONENTS_DIR)
    if padding_result.outcome == PaddingLintOutcome.FAILED:
        logger.error(
            f"Padding lint found {len(padding_result.violations)} "
            f"asymmetric padding declaration(s) in component CSS"
        )
        for v in padding_result.violations:
            kinds = ", ".join(k.value for k in v.kinds)
            logger.error(
                f"  {v.file}:{v.line}: {v.selector} — {v.snippet}  [{kinds}]"
            )
        raise RuntimeError(
            f"Padding lint found {len(padding_result.violations)} "
            f"asymmetric padding declaration(s); see PADDING_IS_INSET_ONLY — "
            f"padding is square; horizontal/vertical asymmetry lives in "
            f"min-width/gap/margin. Mark documented exceptions with "
            f"/* padding-lint: ok */"
        )
    logger.info("Padding lint passed")

    radius_result = run_radius_lint(COMPONENTS_DIR)
    if radius_result.outcome == RadiusLintOutcome.FAILED:
        logger.error(
            f"Radius lint found {len(radius_result.violations)} non-zero "
            f"border-radius declaration(s) in component CSS"
        )
        for v in radius_result.violations:
            logger.error(f"  {v.file}:{v.line}: {v.snippet}  [value: {v.value}]")
        raise RuntimeError(
            f"Radius lint found {len(radius_result.violations)} non-zero "
            f"border-radius declaration(s); the visual language is "
            f"square-cornered. Remove the declaration (zero is the default), "
            f"or mark genuine circles with /* radius-lint: ok */"
        )
    logger.info("Radius lint passed")

    margin_result = run_margin_lint(
        COMPONENTS_DIR,
        pages_dir=PAGES_DIR,
        extra_files=[Path("src/design_kit/preview.py")],
    )
    if margin_result.outcome == MarginLintOutcome.FAILED:
        logger.error(
            f"Margin lint found {len(margin_result.violations)} margin "
            f"declaration(s) carrying layout intent"
        )
        for v in margin_result.violations:
            logger.error(
                f"  {v.file}:{v.line}: {v.declaration}: {v.value} — {v.snippet}"
            )
        raise RuntimeError(
            f"Margin lint found {len(margin_result.violations)} margin "
            f"declaration(s) with layout intent; see NEVER_MARGIN — rhythm "
            f"lives in the parent's gap, centering in grid alignment, full-bleed "
            f"in restructured layout. Permitted forms: margin: 0 (UA reset) and "
            f"margin-(side): auto (flex/grid alignment hook). Mark documented "
            f"exceptions with /* margin-lint: ok */"
        )
    logger.info("Margin lint passed")

    bw_result = run_border_width_lint(
        COMPONENTS_DIR,
        pages_dir=PAGES_DIR,
        extra_files=[Path("src/design_kit/preview.py")],
    )
    if bw_result.outcome == BorderWidthLintOutcome.FAILED:
        logger.error(
            f"Border-width lint found {len(bw_result.violations)} raw "
            f"border-width literal(s)"
        )
        for v in bw_result.violations:
            logger.error(
                f"  {v.file}:{v.line}: {v.declaration} → {v.literal} — {v.snippet}"
            )
        raise RuntimeError(
            f"Border-width lint found {len(bw_result.violations)} raw "
            f"border-width literal(s); see TOKEN_DRIVEN_DESIGN — borders bind "
            f"to var(--border-width-thin|medium|thick). Mark documented "
            f"exceptions with /* token-leak: ok */"
        )
    logger.info("Border-width lint passed")

    dimension_result = run_dimension_lint(
        COMPONENTS_DIR,
        pages_dir=PAGES_DIR,
        extra_files=[Path("src/design_kit/preview.py")],
    )
    if dimension_result.outcome == DimensionLintOutcome.FAILED:
        logger.error(
            f"Dimension lint found {len(dimension_result.violations)} raw "
            f"layout-dimension literal(s)"
        )
        for v in dimension_result.violations:
            logger.error(
                f"  {v.file}:{v.line}: {v.declaration} → {v.literal} — {v.snippet}"
            )
        raise RuntimeError(
            f"Dimension lint found {len(dimension_result.violations)} raw "
            f"layout-dimension literal(s); see TOKEN_DRIVEN_DESIGN / "
            f"JUSTIFY_EVERY_DIMENSION — widths, heights, gaps, font-sizes, "
            f"and position offsets bind to design tokens. Permitted literals: "
            f"0, auto, %, viewport/container-query units, lh, fr. Mark "
            f"documented exceptions with /* dimension-lint: ok */"
        )
    logger.info("Dimension lint passed")

    page_result = run_page_lint(PAGES_DIR)
    if page_result.outcome == PageLintOutcome.FAILED:
        logger.error(
            f"Page lint found {len(page_result.violations)} contract "
            f"violation(s) in pages/"
        )
        for v in page_result.violations:
            logger.error(f"  {v.page}: {v.rule} — {v.message}")
        raise RuntimeError(
            f"Page lint found {len(page_result.violations)} violation(s); "
            f"see docs/reference/page-contract.md"
        )
    for name in page_result.stale_allowlist:
        logger.warning(
            f"Page {name} conforms to the contract but is still in "
            f"KNOWN_NON_CONFORMANT; remove the entry from page_lint.py"
        )
    if page_result.deferred:
        logger.info(
            f"Page lint: {len(page_result.deferred)} page(s) on migration "
            f"backlog: {', '.join(page_result.deferred)}"
        )
    logger.info(f"Page lint passed ({page_result.scanned} pages scanned)")

