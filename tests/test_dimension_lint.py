"""Tests for the dimension-literal lint."""

from __future__ import annotations

from typing import TYPE_CHECKING

from design_kit.dimension_lint import DimensionLintOutcome, run_dimension_lint

if TYPE_CHECKING:
    from pathlib import Path


def _scan(tmp_path: Path, css: str):
    (tmp_path / "x.css").write_text(css, encoding="utf-8")
    return run_dimension_lint(tmp_path)


def test_raw_logical_size_literal_is_flagged(tmp_path: Path) -> None:
    result = _scan(tmp_path, ".a {\n  inline-size: 12rem;\n}\n")

    assert result.outcome is DimensionLintOutcome.FAILED
    assert result.violations
    assert result.violations[0].declaration == "inline-size"
    assert result.violations[0].literal == "12rem"
    assert result.violations[0].line == 2


def test_tokenized_logical_sizes_and_dynamic_viewport_units_pass(
    tmp_path: Path,
) -> None:
    result = _scan(
        tmp_path,
        ".a {\n"
        "  inline-size: var(--layout-content-max-width);\n"
        "  max-block-size: 70dvb;\n"
        "  inset-block-start: 0;\n"
        "}\n",
    )

    assert result.outcome is DimensionLintOutcome.PASSED


def test_logical_breakpoint_preludes_do_not_false_positive(tmp_path: Path) -> None:
    result = _scan(
        tmp_path,
        "@container (max-inline-size: 20rem) {\n"
        "  .a { color: var(--color-text); }\n"
        "}\n",
    )

    assert result.outcome is DimensionLintOutcome.PASSED
