"""Tests for the build command."""

import json
from pathlib import Path

from design_kit.build import build, tokens_css_artifact
from design_kit.font_preload import PRELOAD_MARKER
from design_kit.head_bootstrap import BOOTSTRAP_MARKER

TOKENS_PATH = Path(__file__).parent.parent / "tokens" / "design-tokens.json"
EXAMPLE_TOKENS_PATH = Path(__file__).parent.parent / "docs" / "examples" / "tokens.css"


def test_build_creates_output_files(tmp_path: Path) -> None:
    """Creates tokens.css and the preview page in the output directory."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)

    tokens_css = tmp_path / "tokens.css"
    assert tokens_css.exists()
    css_content = tokens_css.read_text(encoding="utf-8")
    assert "@layer" in css_content

    index_html = tmp_path / "index.html"
    assert index_html.exists()
    html_content = index_html.read_text(encoding="utf-8")
    assert "<!DOCTYPE html>" in html_content
    assert "tokens.css" in html_content


def test_build_injects_first_paint_bootstrap_into_every_page(tmp_path: Path) -> None:
    """Every built page (the generated index and each copied page) carries the
    render-blocking first-paint bootstrap, so persisted theme state is established
    before paint without each page hand-rolling its own copy (NO_FIRST_PAINT_FLASH)."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)

    index_html = (tmp_path / "index.html").read_text(encoding="utf-8")
    assert BOOTSTRAP_MARKER in index_html

    pages = list(tmp_path.glob("*.html"))
    assert len(pages) > 1
    for page in pages:
        text = page.read_text(encoding="utf-8")
        assert BOOTSTRAP_MARKER in text, f"{page.name} missing first-paint bootstrap"
        # Established before the first stylesheet, so styles compute with it applied.
        assert text.index(BOOTSTRAP_MARKER) < text.index('<link rel="stylesheet"')


def test_build_injects_font_preload_into_every_page(tmp_path: Path) -> None:
    """Every built page carries the self-hosted-font preload before its first stylesheet,
    from one build-managed source rather than a per-page Google Fonts link
    (GENERATE_INVARIANTS_LINT_VARIATION); the early fetch keeps the metric-matched swap
    shift-free (NO_FIRST_PAINT_FLASH)."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)

    pages = list(tmp_path.glob("*.html"))
    assert len(pages) > 1
    for page in pages:
        text = page.read_text(encoding="utf-8")
        assert PRELOAD_MARKER in text, f"{page.name} missing font preload"
        assert text.index(PRELOAD_MARKER) < text.index('<link rel="stylesheet"')


def test_build_drops_google_fonts(tmp_path: Path) -> None:
    """No built page reaches out to Google Fonts: the brand font is self-hosted, so the
    third-party preconnect and css2 link must be gone everywhere."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)

    for page in tmp_path.glob("*.html"):
        text = page.read_text(encoding="utf-8")
        assert "fonts.googleapis.com" not in text, (
            f"{page.name} still links Google Fonts"
        )
        assert "fonts.gstatic.com" not in text, f"{page.name} still preconnects gstatic"


def test_build_serves_self_hosted_font(tmp_path: Path) -> None:
    """The build copies the vendored variable font and its license into dist/fonts/, the
    same-origin source the tokens.css @font-face and the page preload both point at."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)

    fonts_dir = tmp_path / "fonts"
    assert (fonts_dir / "Recursive_VF.woff2").exists()
    assert (fonts_dir / "OFL.txt").exists()

    css = (tmp_path / "tokens.css").read_text(encoding="utf-8")
    assert 'url("fonts/Recursive_VF.woff2")' in css


def test_build_stamps_version_header_on_tokens_css(tmp_path: Path) -> None:
    """tokens.css carries a version header so consumers can identify the source."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)

    css_content = (tmp_path / "tokens.css").read_text(encoding="utf-8")
    assert css_content.startswith("/* design-kit tokens v")
    assert "regenerate via `design-kit build`" in css_content


def test_build_emits_tokens_manifest(tmp_path: Path) -> None:
    """Writes a manifest with version, generated_at, and an artifact sha256."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)

    manifest_path = tmp_path / "tokens.manifest.json"
    assert manifest_path.exists()
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    assert manifest["name"] == "design-kit-tokens"
    assert isinstance(manifest["version"], str) and manifest["version"]
    assert "generated_at" in manifest

    tokens_artifact = manifest["artifacts"]["tokens.css"]
    assert len(tokens_artifact["sha256"]) == 64
    assert tokens_artifact["bytes"] == len((tmp_path / "tokens.css").read_bytes())


def test_build_copies_components(tmp_path: Path) -> None:
    """Copies component JS files into the output directory."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)

    components_dir = tmp_path / "components"
    assert components_dir.is_dir()
    assert (components_dir / "storybook.js").exists()
    assert (components_dir / "storybook.config.json").exists()


def test_build_wraps_component_css_in_components_layer(tmp_path: Path) -> None:
    """Built component CSS participates in the cascade contract declared by tokens.css."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)

    css = (tmp_path / "components" / "button.css").read_text(encoding="utf-8")
    assert css.startswith("@layer components {")
    assert ".dk-button" in css


def test_build_wraps_page_styles_in_pages_layer(tmp_path: Path) -> None:
    """Built page-local styles outrank component CSS without becoming unlayered."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)

    html = (tmp_path / "storybook.html").read_text(encoding="utf-8")
    assert "<style>\n@layer pages {" in html
    assert ".storybook-main-wrap" in html


def test_build_outputs_modern_range_breakpoint_queries(tmp_path: Path) -> None:
    """Responsive CSS uses range queries and logical container size checks."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)

    tokens_css = (tmp_path / "tokens.css").read_text(encoding="utf-8")
    nav_row_css = (tmp_path / "components" / "nav-row.css").read_text(encoding="utf-8")
    storybook_html = (tmp_path / "storybook.html").read_text(encoding="utf-8")
    sticky_toc_css = (tmp_path / "components" / "sticky-toc.css").read_text(
        encoding="utf-8"
    )

    combined = "\n".join([tokens_css, nav_row_css, storybook_html, sticky_toc_css])
    assert "@media (width <= 600px)" in combined
    assert "@media (width <= 899px)" in combined
    assert "@media (width >= 1100px)" in combined
    assert "@container (inline-size <= 200px)" in nav_row_css
    assert "@media (max-width:" not in combined
    assert "@media (min-width:" not in combined
    assert "@container (max-width:" not in nav_row_css


def test_build_outputs_logical_navigation_primitives(tmp_path: Path) -> None:
    """Navigation/menu primitives use flow-relative start/end geometry."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)

    component_dir = tmp_path / "components"
    nav_css = "\n".join(
        (component_dir / name).read_text(encoding="utf-8")
        for name in ("menu-item.css", "nav-row.css", "page-nav.css", "toc.css")
    )

    for physical in (
        "border-left:",
        "border-left-color:",
        "padding-left:",
        "margin-left:",
        "text-align: left",
        "text-align: right",
        "width: 100%;",
        "border-top:",
    ):
        assert physical not in nav_css

    assert "border-inline-start: var(--border-width-medium)" in nav_css
    assert "border-inline-start-color: var(--color-link)" in nav_css
    assert "padding-inline-start: var(--spacing-md)" in nav_css
    assert "margin-inline-start: auto;" in nav_css
    assert "text-align: start;" in nav_css
    assert "text-align: end;" in nav_css
    assert "inline-size: 100%;" in nav_css
    assert "border-block-start: var(--border-width-thin)" in nav_css


def test_build_outputs_logical_chrome_primitives(tmp_path: Path) -> None:
    """Chrome/header row primitives use logical block/inline geometry."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)

    component_dir = tmp_path / "components"
    chrome_css = "\n".join(
        (component_dir / name).read_text(encoding="utf-8")
        for name in (
            "topbar.css",
            "collapsible-section.css",
            "field-row.css",
            "bottom-tab-bar.css",
        )
    )

    for physical in (
        "height:",
        "width: 100%;",
        "min-height:",
        "min-width:",
        "max-width:",
        "border-top:",
        "border-bottom:",
        "border-top-color:",
        "padding-top:",
        "padding-bottom:",
        "top: 0;",
        "text-align: left",
    ):
        assert physical not in chrome_css

    assert "block-size: calc(var(--layout-chrome-bar-h)" in chrome_css
    assert "inline-size: 100%;" in chrome_css
    assert "min-block-size: var(--control-touch-target-md)" in chrome_css
    assert "min-inline-size: 0;" in chrome_css
    assert "max-inline-size: 100%;" in chrome_css
    assert "border-block-start: var(--border-width-thin)" in chrome_css
    assert "border-block-end: var(--border-width-thin)" in chrome_css
    assert "padding-block-end: env(safe-area-inset-bottom, 0)" in chrome_css
    assert "inset-block-start: 0;" in chrome_css
    assert "text-align: start;" in chrome_css


def test_build_outputs_logical_panel_list_primitives(tmp_path: Path) -> None:
    """Panel/list/tab primitives use logical block and inline geometry."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)

    component_dir = tmp_path / "components"
    primitive_css = "\n".join(
        (component_dir / name).read_text(encoding="utf-8")
        for name in (
            "panel.css",
            "tab-bar.css",
            "scroll-list.css",
            "form-layout.css",
            "adaptive-metrics-list.css",
            "code-block.css",
        )
    )

    for physical in (
        "border-bottom:",
        "border-bottom-color:",
        "padding-bottom:",
        "text-align: left",
        "text-align: right",
        "width: 100%;",
        "min-width:",
        "margin-left:",
    ):
        assert physical not in primitive_css

    assert "border-block-end: var(--border-width-thin)" in primitive_css
    assert "border-block-end-color: var(--color-link)" in primitive_css
    assert "padding-block: var(--spacing-sm)" in primitive_css
    assert "padding-inline: var(--spacing-md)" in primitive_css
    assert "text-align: start;" in primitive_css
    assert "text-align: end;" in primitive_css
    assert "inline-size: 100%;" in primitive_css
    assert "min-inline-size: 0;" in primitive_css
    assert "margin-inline-start: auto;" in primitive_css


def test_build_outputs_logical_form_control_primitives(tmp_path: Path) -> None:
    """Form/control primitives use logical sizing and inline-end borders."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)

    component_dir = tmp_path / "components"
    control_css = "\n".join(
        (component_dir / name).read_text(encoding="utf-8")
        for name in (
            "button.css",
            "text-input.css",
            "search-input.css",
            "select.css",
            "textarea.css",
            "range.css",
            "segmented-toggle.css",
            "container.css",
        )
    )

    for physical in (
        "width: 100%;",
        "min-width:",
        "max-width:",
        "min-height:",
        "border-right:",
        "text-align: right",
    ):
        assert physical not in control_css

    assert "inline-size: 100%;" in control_css
    assert "min-inline-size: var(--control-min-width-md)" in control_css
    assert "min-inline-size: min(var(--control-input-width-md), 100%)" in control_css
    assert "min-block-size: var(--control-min-height-lg)" in control_css
    assert "max-inline-size: 100%;" in control_css
    assert "border-inline-end: var(--border-width-thin)" in control_css
    assert "text-align: end;" in control_css


def test_build_outputs_modern_emergency_text_wrapping(tmp_path: Path) -> None:
    """Long diagnostic text uses overflow-wrap rather than word-break hacks."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)

    text_assets = [
        path
        for pattern in ("*.html", "*.css")
        for path in tmp_path.rglob(pattern)
        if path.is_file()
    ]
    combined = "\n".join(path.read_text(encoding="utf-8") for path in text_assets)

    assert "word-break:" not in combined
    assert "overflow-wrap: anywhere" in combined


def test_build_emits_component_manifest(tmp_path: Path) -> None:
    """Writes a manifest.json listing every component .js (excluding runtime)."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)

    manifest_path = tmp_path / "components" / "manifest.json"
    assert manifest_path.exists()
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    assert isinstance(manifest, list)
    assert "storybook.js" not in manifest
    assert all(name.endswith(".js") for name in manifest)
    assert manifest == sorted(manifest)


def test_build_ships_contract_tests_page(tmp_path: Path) -> None:
    """Copies the contract-tests page into the output directory."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)

    contract_tests = tmp_path / "contract-tests.html"
    assert contract_tests.exists()
    html = contract_tests.read_text(encoding="utf-8")
    assert "Contract Tests" in html
    assert "storybook.config.json" in html


def test_example_tokens_snapshot_matches_live_generator() -> None:
    """The shared example tokens.css under docs/examples/ is a checked-in snapshot of
    the live generator output (the three tutorial bundles reference it via ../tokens.css).
    Any token change that does not refresh the snapshot is drift, and this test fails
    until the snapshot is regenerated."""
    snapshot = EXAMPLE_TOKENS_PATH.read_text(encoding="utf-8")
    live = tokens_css_artifact(TOKENS_PATH)
    assert snapshot == live, (
        "docs/examples/tokens.css is stale (drift between the snapshot and the live "
        "tokens generator). Regenerate it after the token change with:\n"
        '    uv run python -c "from pathlib import Path; from design_kit.build '
        "import tokens_css_artifact; "
        "Path('docs/examples/tokens.css').write_text("
        "tokens_css_artifact(Path('tokens/design-tokens.json')), encoding='utf-8')\""
    )


def test_build_creates_output_dir(tmp_path: Path) -> None:
    """Creates the output directory if it does not exist."""
    output_dir = tmp_path / "nested" / "output"
    build(tokens_path=TOKENS_PATH, output_dir=output_dir)

    assert output_dir.is_dir()
    assert (output_dir / "tokens.css").exists()
    assert (output_dir / "index.html").exists()
