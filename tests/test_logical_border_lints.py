"""Logical border declarations stay covered by border-related lints."""

from __future__ import annotations

from typing import TYPE_CHECKING

from design_kit.border_width_lint import (
    BorderWidthLintOutcome,
    run_border_width_lint,
)
from design_kit.peer_edge_lint import PeerEdgeLintOutcome, run_peer_edge_lint

if TYPE_CHECKING:
    from pathlib import Path


def _scan_border_width(tmp_path: Path, css: str):
    (tmp_path / "x.css").write_text(css, encoding="utf-8")
    return run_border_width_lint(tmp_path)


def _scan_peer_edge(tmp_path: Path, css: str):
    (tmp_path / "x.css").write_text(css, encoding="utf-8")
    return run_peer_edge_lint(tmp_path)


def test_logical_border_width_literal_is_flagged(tmp_path: Path) -> None:
    result = _scan_border_width(
        tmp_path,
        ".a {\n  border-inline-start: 2px solid var(--color-border);\n}\n",
    )

    assert result.outcome is BorderWidthLintOutcome.FAILED
    assert result.violations[0].declaration == "border-inline-start"
    assert result.violations[0].literal == "2px"


def test_logical_border_width_token_is_allowed(tmp_path: Path) -> None:
    result = _scan_border_width(
        tmp_path,
        ".a {\n  border-block-end: var(--border-width-thin) solid var(--color-border);\n}\n",
    )

    assert result.outcome is BorderWidthLintOutcome.PASSED


def test_logical_peer_edge_without_reservation_is_flagged(tmp_path: Path) -> None:
    result = _scan_peer_edge(
        tmp_path,
        ".item-selected {\n  border-inline-start-color: var(--color-link);\n}\n",
    )

    assert result.outcome is PeerEdgeLintOutcome.FAILED
    assert result.violations[0].declaration == "border-inline-start-color"
    assert result.violations[0].side == "inline-start"


def test_logical_peer_edge_reservation_is_allowed(tmp_path: Path) -> None:
    result = _scan_peer_edge(
        tmp_path,
        ".item {\n  border-inline-start: var(--border-width-medium) solid transparent;\n}\n"
        ".item-selected {\n  border-inline-start-color: var(--color-link);\n}\n",
    )

    assert result.outcome is PeerEdgeLintOutcome.PASSED
