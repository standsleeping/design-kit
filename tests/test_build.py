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
