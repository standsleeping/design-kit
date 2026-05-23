"""Static scan of CSS for scroll containers missing stable-gutter reservation.

Static-analysis corollary of STABLE_SCROLLBAR_GUTTER: scroll containers
whose scrollbar is intermittent (``overflow: auto`` or ``overflow-y:
auto``) must reserve the scrollbar gutter so the inner content-box
width does not change when the bar appears or disappears.

The lint flags any leaf rule whose vertical-axis overflow can resolve
to ``auto`` without a paired ``scrollbar-gutter: stable`` declaration in
the same rule.

Exemptions auto-detected (no marker required):

- ``overflow-y: scroll`` / ``overflow: scroll``: bar is always rendered;
  gutter is moot.
- ``overflow-x: auto``: horizontal scrollbars do not affect inline-axis
  content width.
- ``scrollbar-width: none`` declared in the same rule: bar is invisible;
  no gutter to reserve.

Scope: ``components/*.css`` only.

Allowlist marker: ``/* scroll-gutter: ok */`` on the rule's selector
line or on the offending overflow declaration's line, for containers
whose content height is provably fixed.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from typing import TYPE_CHECKING

from design_kit.logging import get_logger

if TYPE_CHECKING:
    from collections.abc import Iterator
    from pathlib import Path

logger = get_logger(__name__)

ALLOWLIST_MARKER = "scroll-gutter: ok"


class ScrollbarGutterLintOutcome(Enum):
    PASSED = "passed"
    FAILED = "failed"


@dataclass(frozen=True)
class ScrollbarGutterViolation:
    file: str
    line: int
    selector: str
    declaration: str
    snippet: str


@dataclass(frozen=True)
class ScrollbarGutterLintResult:
    outcome: ScrollbarGutterLintOutcome
    violations: list[ScrollbarGutterViolation]

    @classmethod
    def passed(cls) -> ScrollbarGutterLintResult:
        return cls(outcome=ScrollbarGutterLintOutcome.PASSED, violations=[])

    @classmethod
    def failed(
        cls, violations: list[ScrollbarGutterViolation]
    ) -> ScrollbarGutterLintResult:
        return cls(outcome=ScrollbarGutterLintOutcome.FAILED, violations=violations)


_COMMENT_RE = re.compile(r"/\*.*?\*/", re.DOTALL)


def _strip_css_comments(text: str) -> str:
    def _replace(m: re.Match[str]) -> str:
        return "".join("\n" if ch == "\n" else " " for ch in m.group(0))

    return _COMMENT_RE.sub(_replace, text)


def _line_starts(text: str) -> list[int]:
    starts = [0]
    for idx, ch in enumerate(text):
        if ch == "\n":
            starts.append(idx + 1)
    return starts


def _offset_to_line(line_starts: list[int], offset: int) -> int:
    lo, hi = 0, len(line_starts) - 1
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if line_starts[mid] <= offset:
            lo = mid
        else:
            hi = mid - 1
    return lo + 1


@dataclass(frozen=True)
class _Rule:
    selector: str
    line: int
    body: str
    body_line_offset: int


def _iter_leaf_rules(text: str) -> Iterator[_Rule]:
    line_starts = _line_starts(text)
    n = len(text)

    def first_nonspace(start: int, end: int) -> int:
        i = start
        while i < end and text[i].isspace():
            i += 1
        return i

    def walk(start: int, end: int) -> Iterator[_Rule]:
        i = start
        selector_start = start
        while i < end:
            ch = text[i]
            if ch == "{":
                selector = text[selector_start:i].strip().replace("\n", " ")
                body_start = i + 1
                depth = 0
                j = body_start
                while j < end:
                    cj = text[j]
                    if cj == "{":
                        depth += 1
                    elif cj == "}":
                        if depth == 0:
                            break
                        depth -= 1
                    j += 1
                body = text[body_start:j]
                if "{" in body:
                    yield from walk(body_start, j)
                elif selector and not selector.startswith("@"):
                    sel_pos = first_nonspace(selector_start, i)
                    sel_line = _offset_to_line(line_starts, sel_pos)
                    body_line = _offset_to_line(line_starts, body_start)
                    yield _Rule(
                        selector=selector,
                        line=sel_line,
                        body=body,
                        body_line_offset=body_line,
                    )
                i = j + 1
                selector_start = i
                continue
            elif ch == "}":
                selector_start = i + 1
            i += 1

    yield from walk(0, n)


_OVERFLOW_RE = re.compile(
    r"(?<![-\w])(overflow(?:-y)?)\s*:\s*([^;}]+);",
)
_GUTTER_RE = re.compile(
    r"(?<![-\w])scrollbar-gutter\s*:\s*([^;}]+);",
)
_WIDTH_NONE_RE = re.compile(
    r"(?<![-\w])scrollbar-width\s*:\s*none\s*;",
)


@dataclass(frozen=True)
class _OverflowDecl:
    property: str
    value: str
    line: int


def _y_axis_is_auto(prop: str, value: str) -> bool:
    """True iff the y-axis resolves to ``auto``.

    ``overflow-y: V`` carries V on the single token. The ``overflow``
    shorthand's two-value form is ``<overflow-x> <overflow-y>``; a
    single value applies to both axes. In either shorthand shape, the
    last whitespace-separated token represents the y-axis.
    """
    tokens = value.strip().split()
    if not tokens:
        return False
    if prop == "overflow-y":
        return tokens[0].lower() == "auto"
    return tokens[-1].lower() == "auto"


def _parse_overflow_declarations(rule: _Rule) -> list[_OverflowDecl]:
    results: list[_OverflowDecl] = []
    for m in _OVERFLOW_RE.finditer(rule.body):
        prop = m.group(1)
        value = m.group(2).strip()
        leading = rule.body[: m.start()]
        decl_line = rule.body_line_offset + leading.count("\n")
        results.append(_OverflowDecl(property=prop, value=value, line=decl_line))
    return results


def _has_stable_gutter(body: str) -> bool:
    for m in _GUTTER_RE.finditer(body):
        value = m.group(1).strip().lower()
        if value.startswith("stable"):
            return True
    return False


def _has_hidden_scrollbar(body: str) -> bool:
    return _WIDTH_NONE_RE.search(body) is not None


def _scan_file(path: Path) -> list[ScrollbarGutterViolation]:
    raw = path.read_text(encoding="utf-8")
    raw_lines = raw.splitlines()
    text = _strip_css_comments(raw)

    violations: list[ScrollbarGutterViolation] = []
    for rule in _iter_leaf_rules(text):
        overflow_decls = _parse_overflow_declarations(rule)
        triggering = [d for d in overflow_decls if _y_axis_is_auto(d.property, d.value)]
        if not triggering:
            continue
        if _has_stable_gutter(rule.body):
            continue
        if _has_hidden_scrollbar(rule.body):
            continue
        sel_snippet = (
            raw_lines[rule.line - 1] if 1 <= rule.line <= len(raw_lines) else ""
        )
        if ALLOWLIST_MARKER in sel_snippet:
            continue
        for decl in triggering:
            decl_snippet = (
                raw_lines[decl.line - 1] if 1 <= decl.line <= len(raw_lines) else ""
            )
            if ALLOWLIST_MARKER in decl_snippet:
                continue
            violations.append(
                ScrollbarGutterViolation(
                    file=str(path),
                    line=decl.line,
                    selector=rule.selector,
                    declaration=decl.property,
                    snippet=decl_snippet.strip(),
                )
            )
    return violations


def run_scrollbar_gutter_lint(
    components_dir: Path,
) -> ScrollbarGutterLintResult:
    if not components_dir.is_dir():
        logger.warning(
            f"Components directory not found: {components_dir}; "
            "skipping scrollbar-gutter lint"
        )
        return ScrollbarGutterLintResult.passed()
    all_violations: list[ScrollbarGutterViolation] = []
    for path in sorted(components_dir.glob("*.css")):
        all_violations.extend(_scan_file(path))
    if all_violations:
        return ScrollbarGutterLintResult.failed(all_violations)
    return ScrollbarGutterLintResult.passed()
