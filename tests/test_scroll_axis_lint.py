"""The scroll-axis lint flags two-axis overflow shorthands and nothing else."""

from __future__ import annotations

from pathlib import Path

from design_kit.scroll_axis_lint import (
    ScrollAxisLintOutcome,
    run_scroll_axis_lint,
)

COMPONENTS = Path(__file__).parent.parent / "components"


def _scan(tmp_path: Path, css: str):
    (tmp_path / "x.css").write_text(css, encoding="utf-8")
    return run_scroll_axis_lint(tmp_path)


def test_single_value_overflow_auto_is_flagged(tmp_path: Path) -> None:
    result = _scan(tmp_path, ".a {\n  overflow: auto;\n}\n")
    assert result.outcome == ScrollAxisLintOutcome.FAILED
    assert len(result.violations) == 1
    assert result.violations[0].selector == ".a"
    assert result.violations[0].value == "auto"
    assert result.violations[0].line == 2


def test_overflow_scroll_is_flagged(tmp_path: Path) -> None:
    result = _scan(tmp_path, ".a { overflow: scroll; }\n")
    assert result.outcome == ScrollAxisLintOutcome.FAILED


def test_overflow_auto_important_is_flagged(tmp_path: Path) -> None:
    result = _scan(tmp_path, ".a { overflow: auto !important; }\n")
    assert result.outcome == ScrollAxisLintOutcome.FAILED


def test_explicit_single_axis_is_allowed(tmp_path: Path) -> None:
    result = _scan(tmp_path, ".a {\n  overflow-y: auto;\n  overflow-x: hidden;\n}\n")
    assert result.outcome == ScrollAxisLintOutcome.PASSED


def test_overflow_hidden_is_allowed(tmp_path: Path) -> None:
    result = _scan(tmp_path, ".a { overflow: hidden; }\n")
    assert result.outcome == ScrollAxisLintOutcome.PASSED


def test_two_value_shorthand_is_allowed(tmp_path: Path) -> None:
    # Axes stated explicitly: x clips, y scrolls.
    result = _scan(tmp_path, ".a { overflow: hidden auto; }\n")
    assert result.outcome == ScrollAxisLintOutcome.PASSED


def test_opt_out_on_declaration_line(tmp_path: Path) -> None:
    result = _scan(tmp_path, ".a { overflow: auto; /* scroll-axis: ok */ }\n")
    assert result.outcome == ScrollAxisLintOutcome.PASSED


def test_opt_out_on_selector_line(tmp_path: Path) -> None:
    result = _scan(tmp_path, ".a { /* scroll-axis: ok */\n  overflow: auto;\n}\n")
    assert result.outcome == ScrollAxisLintOutcome.PASSED


def test_overflow_inside_comment_is_ignored(tmp_path: Path) -> None:
    result = _scan(tmp_path, ".a { /* overflow: auto; */ color: red; }\n")
    assert result.outcome == ScrollAxisLintOutcome.PASSED


def test_live_component_css_is_clean() -> None:
    """The shipped component CSS has no two-axis overflow shorthands."""
    result = run_scroll_axis_lint(COMPONENTS)
    assert result.outcome == ScrollAxisLintOutcome.PASSED, [
        (v.file, v.line, v.selector) for v in result.violations
    ]
