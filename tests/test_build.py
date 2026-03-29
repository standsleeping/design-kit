"""Tests for the build command."""

from pathlib import Path

from design_kit.build import build


TOKENS_PATH = Path(__file__).parent.parent / "tokens" / "design-tokens.json"


def test_build_creates_output_files(tmp_path: Path) -> None:
    """Creates tokens.css, preview pages, and scripts in output directory."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)

    tokens_css = tmp_path / "tokens.css"
    assert tokens_css.exists()
    css_content = tokens_css.read_text(encoding="utf-8")
    assert "@layer" in css_content

    preview_html = tmp_path / "preview.html"
    assert preview_html.exists()
    html_content = preview_html.read_text(encoding="utf-8")
    assert "<!DOCTYPE html>" in html_content
    assert "tokens.css" in html_content
    assert "components/sp-all.js" in html_content

    components_html = tmp_path / "components.html"
    assert components_html.exists()
    components_html_content = components_html.read_text(encoding="utf-8")
    assert "<!DOCTYPE html>" in components_html_content
    assert "components/component-preview.js" in components_html_content


def test_build_copies_components(tmp_path: Path) -> None:
    """Copies component JS files into the output directory."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)

    components_dir = tmp_path / "components"
    assert components_dir.is_dir()
    assert (components_dir / "sp-all.js").exists()
    assert (components_dir / "component-preview.js").exists()


def test_build_creates_output_dir(tmp_path: Path) -> None:
    """Creates the output directory if it does not exist."""
    output_dir = tmp_path / "nested" / "output"
    build(tokens_path=TOKENS_PATH, output_dir=output_dir)

    assert output_dir.is_dir()
    assert (output_dir / "tokens.css").exists()
    assert (output_dir / "preview.html").exists()
    assert (output_dir / "components.html").exists()
