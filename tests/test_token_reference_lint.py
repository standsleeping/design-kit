"""Tests for the public-token reference lint."""

from __future__ import annotations

from typing import TYPE_CHECKING

from design_kit.token_reference_lint import (
    TokenReferenceLintOutcome,
    run_token_reference_lint,
)

if TYPE_CHECKING:
    from pathlib import Path


def _tokens(tmp_path: Path, css: str = "") -> Path:
    path = tmp_path / "tokens.css"
    path.write_text(
        css
        or ":root {\n"
        "  --color-text: #111;\n"
        "  --font-size-base: 1rem;\n"
        "  --spacing-md: 0.5rem;\n"
        "}\n",
        encoding="utf-8",
    )
    return path


def _components(tmp_path: Path, css: str) -> Path:
    path = tmp_path / "components"
    path.mkdir()
    (path / "x.css").write_text(css, encoding="utf-8")
    return path


def test_defined_public_tokens_and_private_component_knobs_pass(
    tmp_path: Path,
) -> None:
    tokens = _tokens(tmp_path)
    components = _components(
        tmp_path,
        ".a {\n"
        "  color: var(--color-text);\n"
        "  gap: var(--spacing-md, 0.5rem);\n"
        "  background: var(--dk-card-bg);\n"
        "}\n",
    )

    result = run_token_reference_lint(tokens, components)

    assert result.outcome is TokenReferenceLintOutcome.PASSED
    assert result.violations == []


def test_unknown_public_token_reference_fails(tmp_path: Path) -> None:
    tokens = _tokens(tmp_path)
    components = _components(tmp_path, ".a {\n  color: var(--color-typo);\n}\n")

    result = run_token_reference_lint(tokens, components)

    assert result.outcome is TokenReferenceLintOutcome.FAILED
    assert result.violations
    assert result.violations[0].token == "--color-typo"
    assert result.violations[0].line == 2


def test_scans_page_style_blocks_with_html_line_numbers(tmp_path: Path) -> None:
    tokens = _tokens(tmp_path)
    components = _components(tmp_path, "")
    pages = tmp_path / "pages"
    pages.mkdir()
    (pages / "index.html").write_text(
        "<main>\n"
        "  <style>\n"
        "    .a { border-color: var(--color-missing); }\n"
        "  </style>\n"
        "</main>\n",
        encoding="utf-8",
    )

    result = run_token_reference_lint(tokens, components, pages_dir=pages)

    assert result.outcome is TokenReferenceLintOutcome.FAILED
    assert result.violations[0].token == "--color-missing"
    assert result.violations[0].line == 3


def test_scans_the_generated_token_artifact_itself(tmp_path: Path) -> None:
    tokens = _tokens(
        tmp_path,
        ":root {\n"
        "  --color-text: var(--color-gray-700);\n"
        "  --color-gray-700: #111;\n"
        "}\n"
        ".x { color: var(--color-missing); }\n",
    )
    components = _components(tmp_path, "")

    result = run_token_reference_lint(tokens, components)

    assert result.outcome is TokenReferenceLintOutcome.FAILED
    assert result.violations[0].file == str(tokens)
    assert result.violations[0].token == "--color-missing"


def test_ignores_dynamic_template_references_and_allowlisted_lines(
    tmp_path: Path,
) -> None:
    tokens = _tokens(tmp_path)
    components = _components(
        tmp_path,
        ".a { color: var(--color-external); } /* token-reference: ok */\n",
    )
    extra = tmp_path / "preview.py"
    extra.write_text(
        'f"<span style=\\"color: var(--color-syntax-{name});\\"></span>"\n',
        encoding="utf-8",
    )

    result = run_token_reference_lint(tokens, components, extra_files=[extra])

    assert result.outcome is TokenReferenceLintOutcome.PASSED
