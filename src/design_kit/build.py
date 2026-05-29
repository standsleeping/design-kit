"""Build command: generate CSS and preview pages into an output directory."""

import hashlib
import json
import re
import shutil
import time
from datetime import UTC, datetime
from importlib.metadata import PackageNotFoundError
from importlib.metadata import version as pkg_version
from pathlib import Path
from typing import TypedDict

from design_kit.audit import AuditScope, raise_on_failure, run_audits
from design_kit.audit.registry import REGISTRY
from design_kit.breakpoints import load_breakpoints, substitute_breakpoints
from design_kit.contrast_self_test import run as run_contrast_lint
from design_kit.font_preload import font_preload_violation, inject_font_preload
from design_kit.head_bootstrap import bootstrap_violation, inject_head_bootstrap
from design_kit.icon_registry import generate_registry
from design_kit.logging import get_logger
from design_kit.nav import inject_system_nav
from design_kit.page_lint import PageLintOutcome, run_page_lint
from design_kit.preview import generate_preview_html
from design_kit.token_css import generate_token_css

logger = get_logger(__name__)

COMPONENTS_DIR = Path("components")
PAGES_DIR = Path("pages")
# Self-hosted fonts (Recursive variable woff2 + OFL license). Copied verbatim into
# dist/ so pages serve the brand font from the same origin; see token_css.FONT_FACE
# for the @font-face that points at dist/fonts/ and font_preload for the preload hint.
FONTS_DIR = Path("fonts")
# Top-level .js files under components/ that are framework infrastructure,
# not contract-conformant components. The rest of the framework lives under
# components/system/ and is excluded by directory; storybook.js stays at
# the top level because pages/storybook.html loads it directly.
NON_COMPONENT_TOP_LEVEL_JS = {"storybook.js"}

PACKAGE_NAME = "design-kit"
COMPONENTS_LAYER = "components"
PAGES_LAYER = "pages"
STYLE_BLOCK_RE = re.compile(
    r"(<style\b[^>]*>)(.*?)(</style>)", re.IGNORECASE | re.DOTALL
)
PROPERTY_RULE_RE = re.compile(
    r"(?ms)^[ \t]*@property\s+--[-_a-zA-Z0-9]+\s*\{[^{}]*\}\s*"
)


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


def tokens_css_artifact(tokens_path: Path) -> str:
    """Return the canonical tokens.css contents (header + generated body).

    Single source for "what tokens.css looks like" so the build write, the example
    snapshot in ``docs/examples/tokens.css``, and the freshness test that pins the
    snapshot all derive from one function (GENERATE_INVARIANTS_LINT_VARIATION).
    """
    version = _read_version()
    header = (
        f"/* design-kit tokens v{version}\n"
        " * regenerate via `design-kit build`; do not edit manually\n"
        " */\n"
    )
    breakpoints = load_breakpoints(tokens_path)
    return header + generate_token_css(tokens_path, breakpoints=breakpoints)


def _indent_css(text: str) -> str:
    return "\n".join(f"  {line}" if line else "" for line in text.splitlines())


def _wrap_css_in_layer(css: str, layer: str) -> str:
    """Wrap author CSS in a named cascade layer for distribution.

    Component source files stay plain for authoring and linting, but built CSS
    participates in the public cascade contract declared by tokens.css. Top-level
    @property registrations are kept outside the layer: they register syntax and
    inheritance for the whole stylesheet rather than style an element.
    """
    if not css.strip() or f"@layer {layer}" in css:
        return css

    property_rules = [
        match.group(0).rstrip() for match in PROPERTY_RULE_RE.finditer(css)
    ]
    body = PROPERTY_RULE_RE.sub("", css).strip()
    if not body:
        return "\n\n".join(property_rules) + ("\n" if property_rules else "")

    layered = f"@layer {layer} {{\n{_indent_css(body)}\n}}\n"
    if not property_rules:
        return layered
    return "\n\n".join(property_rules) + "\n\n" + layered


def _wrap_style_blocks_in_layer(html: str, layer: str) -> str:
    """Place page-local <style> blocks in the page cascade layer."""

    def repl(match: re.Match[str]) -> str:
        open_tag, css, close_tag = match.groups()
        return f"{open_tag}\n{_wrap_css_in_layer(css, layer)}{close_tag}"

    return STYLE_BLOCK_RE.sub(repl, html)


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
            text = substitute_breakpoints(text, breakpoints)
            text = _wrap_css_in_layer(text, COMPONENTS_LAYER)
            dst.write_text(text, encoding="utf-8")
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
    breakpoints = load_breakpoints(tokens_path)
    css = tokens_css_artifact(tokens_path)
    css_path = output_dir / "tokens.css"
    css_path.write_text(css, encoding="utf-8")
    logger.info(f"Generated {css_path} (v{version})")

    lint_results, lint_report = run_contrast_lint(css_path)
    lint_failures = [r for r in lint_results if not r.passed]
    if lint_failures:
        logger.error(f"Token-pair contrast lint found {len(lint_failures)} failure(s)")
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
        "generated_at": datetime.now(UTC).isoformat(timespec="seconds"),
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

    # Every built page carries two build-managed head injections before its first
    # stylesheet: the first-paint render-state bootstrap and the font preload. Both
    # come from a single source (GENERATE_INVARIANTS_LINT_VARIATION) and both are
    # verified here, at build time, so a silent injection skip (marker collision, head
    # with no stylesheet) is a named build failure instead of a runtime flash or a slow
    # first paint that only the headless audit would notice (SHIFT_VALIDATION_LEFT).
    head_failures: list[str] = []

    def _inject_head(text: str) -> str:
        # Preload first so the font fetch is discovered before the blocking bootstrap
        # script; both land before the first stylesheet.
        return inject_head_bootstrap(inject_font_preload(text))

    def _check_head(name: str, text: str) -> None:
        if (violation := bootstrap_violation(text)) is not None:
            head_failures.append(f"{name}: {violation}")
        if (violation := font_preload_violation(text)) is not None:
            head_failures.append(f"{name}: {violation}")

    html = inject_system_nav(
        _inject_head(
            _wrap_style_blocks_in_layer(
                substitute_breakpoints(generate_preview_html(), breakpoints),
                PAGES_LAYER,
            )
        )
    )
    html_path = output_dir / "index.html"
    html_path.write_text(html, encoding="utf-8")
    logger.info(f"Generated {html_path}")
    _check_head("index.html", html)

    cache_bust = str(int(time.time()))
    if PAGES_DIR.is_dir():
        for page in PAGES_DIR.glob("*.html"):
            dest = output_dir / page.name
            text = page.read_text(encoding="utf-8")
            text = text.replace("{{CACHE_BUST}}", cache_bust)
            text = substitute_breakpoints(text, breakpoints)
            text = _wrap_style_blocks_in_layer(text, PAGES_LAYER)
            text = _inject_head(text)
            text = inject_system_nav(text)
            dest.write_text(text, encoding="utf-8")
            logger.info(f"Copied {dest}")
            _check_head(page.name, text)

    if head_failures:
        for failure in head_failures:
            logger.error(f"Head injection: {failure}")
        raise RuntimeError(
            f"First-paint bootstrap or font preload missing or misplaced in "
            f"{len(head_failures)} page(s); see design_kit.head_bootstrap / "
            f"design_kit.font_preload (NO_FIRST_PAINT_FLASH)"
        )

    if FONTS_DIR.is_dir():
        dest_fonts = output_dir / "fonts"
        if dest_fonts.exists():
            shutil.rmtree(dest_fonts)
        shutil.copytree(FONTS_DIR, dest_fonts)
        logger.info(f"Copied fonts to {dest_fonts}")
    else:
        logger.warning(f"Fonts directory not found: {FONTS_DIR}")

    if COMPONENTS_DIR.is_dir():
        dest_components = output_dir / "components"
        if dest_components.exists():
            shutil.rmtree(dest_components)
        _copy_components_with_substitution(COMPONENTS_DIR, dest_components, breakpoints)
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

    # The file-scanning lints run as one sweep over the audit registry, so the
    # set of audits is defined once (in design_kit.audit.registry) and `build`
    # and `design-kit audit` cannot drift. Contrast (run above, before the
    # manifest is stamped) and the page contract (below, for its scanned-count
    # and stale-allowlist signal) keep their inline blocks for build-only output.
    audit_scope = AuditScope.for_repo(css_path)
    sweep = run_audits(
        audit_scope, [s for s in REGISTRY if s.slug not in {"contrast", "page"}]
    )
    raise_on_failure(sweep, logger)
    for outcome in sweep:
        logger.info(f"{outcome.name} lint passed")

    page_result = run_page_lint(PAGES_DIR)
    if page_result.outcome == PageLintOutcome.FAILED:
        logger.error(
            f"Page lint found {len(page_result.violations)} contract "
            f"violation(s) in pages/"
        )
        for v in page_result.violations:
            logger.error(f"  {v.page}: {v.rule}: {v.message}")
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
