"""Static scan of CSS for two-axis ``overflow`` shorthands.

Static-analysis corollary of SCROLL_CONTAINMENT: a scroll container scrolls
exactly one axis, declared explicitly. The single-value shorthands
``overflow: auto`` and ``overflow: scroll`` arm *both* axes, which silently
converts a too-wide child into a forbidden horizontal scrollbar on a layout
container (the failure that hit ``.dk-app-shell-main``). The fix is to declare
the intended axis explicitly (``overflow-y: auto`` for a vertical scroller)
and let the cross axis clip.

The lint flags single-value ``overflow: auto`` / ``overflow: scroll``. It does
not flag:

- ``overflow-x`` / ``overflow-y``: already an explicit single axis.
- ``overflow: hidden`` / ``overflow: visible`` / ``overflow: clip``: these
  clip both axes; nothing scrolls.
- Two-value forms (``overflow: hidden auto``): the axes are stated explicitly.

A genuinely two-axis-scrollable surface (a pannable canvas, a large diagram
viewer) opts out with ``/* scroll-axis: ok */`` on the selector line or the
``overflow`` declaration's line.

Scope: ``components/*.css`` only. Shared chrome is where a two-axis scroller
becomes a reusable footgun. Page-rendered overflow is caught at runtime by the
overflow audit (tests/test_overflow_audit.py).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from typing import TYPE_CHECKING

from design_kit.logging import get_logger

if TYPE_CHECKING:
    from pathlib import Path

logger = get_logger(__name__)

ALLOWLIST_MARKER = "scroll-axis: ok"
_SCROLLING_VALUES = {"auto", "scroll"}


class ScrollAxisLintOutcome(Enum):
    PASSED = "passed"
    FAILED = "failed"


@dataclass(frozen=True)
class ScrollAxisViolation:
    file: str
    line: int
    selector: str
    value: str
    snippet: str


@dataclass(frozen=True)
class ScrollAxisLintResult:
    outcome: ScrollAxisLintOutcome
    violations: list[ScrollAxisViolation]

    @classmethod
    def passed(cls) -> ScrollAxisLintResult:
        return cls(outcome=ScrollAxisLintOutcome.PASSED, violations=[])

    @classmethod
    def failed(cls, violations: list[ScrollAxisViolation]) -> ScrollAxisLintResult:
        return cls(outcome=ScrollAxisLintOutcome.FAILED, violations=violations)


_COMMENT_RE = re.compile(r"/\*.*?\*/", re.DOTALL)
# `overflow: <value>;`: the shorthand only (overflow-x / overflow-y excluded by
# the negative lookbehind on `-`).
_OVERFLOW_RE = re.compile(r"(?<![-\w])overflow\s*:\s*([^;}]+)[;}]")


def _strip_css_comments(text: str) -> str:
    """Blank out comments while preserving newlines so line numbers hold."""

    def _replace(m: re.Match[str]) -> str:
        return "".join("\n" if ch == "\n" else " " for ch in m.group(0))

    return _COMMENT_RE.sub(_replace, text)


def _enclosing_selector(text: str, offset: int) -> str:
    """Best-effort selector for the rule containing ``offset``."""
    open_brace = text.rfind("{", 0, offset)
    if open_brace == -1:
        return ""
    prev = max(text.rfind("}", 0, open_brace), text.rfind("{", 0, open_brace))
    return text[prev + 1 : open_brace].strip().replace("\n", " ")


def _is_two_axis_scroll(value: str) -> bool:
    """True iff the shorthand value scrolls both axes ambiguously."""
    tokens = value.replace("!important", "").split()
    return len(tokens) == 1 and tokens[0].lower() in _SCROLLING_VALUES


def _marker_on(raw_lines: list[str], line_no: int) -> bool:
    return 1 <= line_no <= len(raw_lines) and ALLOWLIST_MARKER in raw_lines[line_no - 1]


def _scan_file(path: Path) -> list[ScrollAxisViolation]:
    raw = path.read_text(encoding="utf-8")
    raw_lines = raw.splitlines()
    text = _strip_css_comments(raw)

    violations: list[ScrollAxisViolation] = []
    for m in _OVERFLOW_RE.finditer(text):
        value = m.group(1).strip()
        if not _is_two_axis_scroll(value):
            continue
        decl_line = text.count("\n", 0, m.start()) + 1
        sel_offset = text.rfind("{", 0, m.start())
        sel_line = (
            text.count("\n", 0, sel_offset) + 1 if sel_offset != -1 else decl_line
        )
        # Opt-out marker may sit on the declaration line or the selector line.
        if _marker_on(raw_lines, decl_line) or _marker_on(raw_lines, sel_line):
            continue
        snippet = (
            raw_lines[decl_line - 1].strip() if 1 <= decl_line <= len(raw_lines) else ""
        )
        violations.append(
            ScrollAxisViolation(
                file=str(path),
                line=decl_line,
                selector=_enclosing_selector(text, m.start()),
                value=value,
                snippet=snippet,
            )
        )
    return violations


def run_scroll_axis_lint(components_dir: Path) -> ScrollAxisLintResult:
    if not components_dir.is_dir():
        logger.warning(
            f"Components directory not found: {components_dir}; "
            "skipping scroll-axis lint"
        )
        return ScrollAxisLintResult.passed()
    all_violations: list[ScrollAxisViolation] = []
    for path in sorted(components_dir.glob("*.css")):
        all_violations.extend(_scan_file(path))
    if all_violations:
        return ScrollAxisLintResult.failed(all_violations)
    return ScrollAxisLintResult.passed()
