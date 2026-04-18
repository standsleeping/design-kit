"""Tests for the build command."""

from pathlib import Path

from design_kit.build import build


TOKENS_PATH = Path(__file__).parent.parent / "tokens" / "design-tokens.json"


def test_build_creates_output_files(tmp_path: Path) -> None:
    """Creates tokens.css and the preview page in the output directory."""
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


def test_build_copies_components(tmp_path: Path) -> None:
    """Copies component JS files into the output directory."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)

    components_dir = tmp_path / "components"
    assert components_dir.is_dir()
    assert (components_dir / "storybook.js").exists()
    assert (components_dir / "storybook.config.json").exists()


def test_build_ships_contract_tests_page(tmp_path: Path) -> None:
    """Copies the contract-tests page into the output directory."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)

    contract_tests = tmp_path / "contract-tests.html"
    assert contract_tests.exists()
    html = contract_tests.read_text(encoding="utf-8")
    assert "Contract Tests" in html
    assert "storybook.config.json" in html


def test_build_creates_output_dir(tmp_path: Path) -> None:
    """Creates the output directory if it does not exist."""
    output_dir = tmp_path / "nested" / "output"
    build(tokens_path=TOKENS_PATH, output_dir=output_dir)

    assert output_dir.is_dir()
    assert (output_dir / "tokens.css").exists()
    assert (output_dir / "preview.html").exists()
