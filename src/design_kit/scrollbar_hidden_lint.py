"""Static scan of CSS for visible-scrollbar regressions.

Static-analysis corollary of SCROLLBAR_HIDDEN_BY_DEFAULT: every scroll
container hides its bar via the two-line recipe
(``scrollbar-width: none`` plus ``::-webkit-scrollbar { display: none }``).
A visible bar — full or partial — is a layout-shift and flushness risk
that the principle forbids in the layout-CSS surface area.

Violations the lint catches:

1. ``overflow: scroll`` / ``overflow-y: scroll`` / ``overflow-x: scroll``:
   the ``scroll`` value forces a permanent bar; use ``auto`` and hide it.
2. A scroll container (``overflow(-x|-y)?: auto``) without
   ``scrollbar-width: none`` in the same rule.
3. ``scrollbar-gutter:`` anywhere: hidden bars need no gutter to reserve.
4. ``scrollbar-color:`` anywhere: a tinted bar is a visible bar.
5. ``scrollbar-width:`` with any value other than ``none``: ``thin`` and
   ``auto`` paint a bar.
6. ``::-webkit-scrollbar`` rules whose body is anything other than
   ``display: none``: width/track/thumb declarations all paint a bar.

Scope: ``components/*.css`` only.

Allowlist marker: ``/* scrollbar: ok */`` on the rule's selector line
or on the offending declaration's line. Use only where the visible bar
is the deliberate point of the surface (e.g., a code editor or terminal
component that owns its own viewport metaphor; see INDEPENDENT_VIEWPORT).
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

ALLOWLIST_MARKER = "scrollbar: ok"


class ScrollbarHiddenLintOutcome(Enum):
    PASSED = "passed"
    FAILED = "failed"


class ViolationKind(Enum):
    OVERFLOW_SCROLL = "overflow-scroll"
    MISSING_HIDDEN_WIDTH = "missing-hidden-width"
    SCROLLBAR_GUTTER = "scrollbar-gutter"
    SCROLLBAR_COLOR = "scrollbar-color"
    NON_NONE_WIDTH = "non-none-width"
    WEBKIT_NON_DISPLAY_NONE = "webkit-non-display-none"


@dataclass(frozen=True)
class ScrollbarHiddenViolation:
    file: str
    line: int
    selector: str
    kind: ViolationKind
    snippet: str


@dataclass(frozen=True)
class ScrollbarHiddenLintResult:
    outcome: ScrollbarHiddenLintOutcome
    violations: list[ScrollbarHiddenViolation]

    @classmethod
    def passed(cls) -> ScrollbarHiddenLintResult:
        return cls(outcome=ScrollbarHiddenLintOutcome.PASSED, violations=[])

    @classmethod
    def failed(
        cls, violations: list[ScrollbarHiddenViolation]
    ) -> ScrollbarHiddenLintResult:
        return cls(outcome=ScrollbarHiddenLintOutcome.FAILED, violations=violations)


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
    r"(?<![-\w])(overflow(?:-[xy])?)\s*:\s*([^;}]+);",
)
_GUTTER_RE = re.compile(
    r"(?<![-\w])(scrollbar-gutter)\s*:\s*([^;}]+);",
)
_COLOR_RE = re.compile(
    r"(?<![-\w])(scrollbar-color)\s*:\s*([^;}]+);",
)
_WIDTH_RE = re.compile(
    r"(?<![-\w])(scrollbar-width)\s*:\s*([^;}]+);",
)
_ANY_DECL_RE = re.compile(
    r"(?<![-\w])([a-z-]+)\s*:\s*([^;}]+);",
)


@dataclass(frozen=True)
class _Decl:
    property: str
    value: str
    line: int


def _parse_decls(rule: _Rule, regex: re.Pattern[str]) -> list[_Decl]:
    results: list[_Decl] = []
    for m in regex.finditer(rule.body):
        prop = m.group(1)
        value = m.group(2).strip()
        leading = rule.body[: m.start()]
        decl_line = rule.body_line_offset + leading.count("\n")
        results.append(_Decl(property=prop, value=value, line=decl_line))
    return results


def _scrolls_on_some_axis(value: str) -> bool:
    """True iff at least one axis of the value scrolls (auto or scroll)."""
    tokens = value.strip().lower().split()
    return any(t in ("auto", "scroll") for t in tokens)


def _value_is_scroll(value: str) -> bool:
    """True iff the value forces a permanent bar on at least one axis."""
    tokens = value.strip().lower().split()
    return "scroll" in tokens


def _has_scrollbar_width_none(rule: _Rule) -> bool:
    for decl in _parse_decls(rule, _WIDTH_RE):
        if decl.value.strip().lower() == "none":
            return True
    return False


def _is_webkit_scrollbar_selector(selector: str) -> bool:
    return "::-webkit-scrollbar" in selector


def _webkit_body_is_display_none(body: str) -> bool:
    decls = []
    for m in _ANY_DECL_RE.finditer(body):
        decls.append((m.group(1).strip().lower(), m.group(2).strip().lower()))
    if not decls:
        return False
    return all(prop == "display" and value == "none" for prop, value in decls)


def _scan_file(path: Path) -> list[ScrollbarHiddenViolation]:
    raw = path.read_text(encoding="utf-8")
    raw_lines = raw.splitlines()
    text = _strip_css_comments(raw)

    def line_marked(line: int) -> bool:
        if not 1 <= line <= len(raw_lines):
            return False
        return ALLOWLIST_MARKER in raw_lines[line - 1]

    def selector_marked(rule: _Rule) -> bool:
        return line_marked(rule.line)

    def snippet_at(line: int) -> str:
        if 1 <= line <= len(raw_lines):
            return raw_lines[line - 1].strip()
        return ""

    violations: list[ScrollbarHiddenViolation] = []

    for rule in _iter_leaf_rules(text):
        if selector_marked(rule):
            continue

        if _is_webkit_scrollbar_selector(rule.selector):
            if not _webkit_body_is_display_none(rule.body):
                violations.append(
                    ScrollbarHiddenViolation(
                        file=str(path),
                        line=rule.line,
                        selector=rule.selector,
                        kind=ViolationKind.WEBKIT_NON_DISPLAY_NONE,
                        snippet=snippet_at(rule.line),
                    )
                )
            continue

        for decl in _parse_decls(rule, _GUTTER_RE):
            if line_marked(decl.line):
                continue
            violations.append(
                ScrollbarHiddenViolation(
                    file=str(path),
                    line=decl.line,
                    selector=rule.selector,
                    kind=ViolationKind.SCROLLBAR_GUTTER,
                    snippet=snippet_at(decl.line),
                )
            )

        for decl in _parse_decls(rule, _COLOR_RE):
            if line_marked(decl.line):
                continue
            violations.append(
                ScrollbarHiddenViolation(
                    file=str(path),
                    line=decl.line,
                    selector=rule.selector,
                    kind=ViolationKind.SCROLLBAR_COLOR,
                    snippet=snippet_at(decl.line),
                )
            )

        for decl in _parse_decls(rule, _WIDTH_RE):
            if line_marked(decl.line):
                continue
            if decl.value.strip().lower() != "none":
                violations.append(
                    ScrollbarHiddenViolation(
                        file=str(path),
                        line=decl.line,
                        selector=rule.selector,
                        kind=ViolationKind.NON_NONE_WIDTH,
                        snippet=snippet_at(decl.line),
                    )
                )

        overflow_decls = _parse_decls(rule, _OVERFLOW_RE)
        scrolls = False
        for decl in overflow_decls:
            if line_marked(decl.line):
                continue
            if _value_is_scroll(decl.value):
                violations.append(
                    ScrollbarHiddenViolation(
                        file=str(path),
                        line=decl.line,
                        selector=rule.selector,
                        kind=ViolationKind.OVERFLOW_SCROLL,
                        snippet=snippet_at(decl.line),
                    )
                )
            if _scrolls_on_some_axis(decl.value):
                scrolls = True

        if scrolls and not _has_scrollbar_width_none(rule):
            first_overflow = next(
                (d for d in overflow_decls if _scrolls_on_some_axis(d.value)),
                None,
            )
            line_no = first_overflow.line if first_overflow else rule.line
            violations.append(
                ScrollbarHiddenViolation(
                    file=str(path),
                    line=line_no,
                    selector=rule.selector,
                    kind=ViolationKind.MISSING_HIDDEN_WIDTH,
                    snippet=snippet_at(line_no),
                )
            )

    return violations


def run_scrollbar_hidden_lint(
    components_dir: Path,
) -> ScrollbarHiddenLintResult:
    if not components_dir.is_dir():
        logger.warning(
            f"Components directory not found: {components_dir}; "
            "skipping scrollbar-hidden lint"
        )
        return ScrollbarHiddenLintResult.passed()
    all_violations: list[ScrollbarHiddenViolation] = []
    for path in sorted(components_dir.glob("*.css")):
        all_violations.extend(_scan_file(path))
    if all_violations:
        return ScrollbarHiddenLintResult.failed(all_violations)
    return ScrollbarHiddenLintResult.passed()
