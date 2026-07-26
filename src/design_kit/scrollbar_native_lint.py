"""Static scan of CSS for scrollbar overrides that fight the native bar.

Static-analysis corollary of NATIVE_SCROLLBAR: scroll containers use
``overflow: auto``. The platform paints its own bar, themed by
``color-scheme`` on the root. Overriding the bar — hiding it, tinting it,
or resizing it — is what this lint forbids. On overlay-scrollbar platforms
the native bar floats and reserves no space (flush layout and zero shift
hold); on classic-scrollbar platforms it rides the column edge, the one
place a bar does not break a flush seam.

Reserving space is not overriding: ``scrollbar-gutter: stable`` sets aside
the width of a bar the platform still paints, sizes, and themes, and leaves
the user's OS scrollbar preference intact. It is permitted, and the lint
guards its value rather than its property name.

Violations the lint catches:

1. ``overflow: scroll`` / ``overflow-y: scroll`` / ``overflow-x: scroll``:
   the ``scroll`` value forces a permanent bar even when nothing overflows;
   use ``auto`` so the bar appears only when needed.
2. ``scrollbar-width:`` with any value: ``none`` hides the bar (the old
   contract), ``thin`` / ``auto`` resize it; the native default is to set
   nothing at all.
3. ``scrollbar-color:`` anywhere: a tinted bar overrides the platform bar;
   theme via ``color-scheme`` instead.
4. ``scrollbar-gutter:`` with any value other than ``stable``: notably
   ``stable both-edges``, which reserves a strip on the side no bar can
   occupy — reservation without a bar is decoration.
5. ``::-webkit-scrollbar`` rules of any kind: track / thumb / display
   declarations all replace or suppress the native bar.

Scope: ``components/*.css`` only.

Allowlist marker: ``/* scrollbar: ok */`` on the rule's selector line or on
the offending declaration's line. Use only where a component owns its own
viewport metaphor and deliberately styles its own bar (e.g., a code editor
or terminal; see INDEPENDENT_VIEWPORT).
"""

import re
from collections.abc import Iterator
from dataclasses import dataclass
from enum import Enum
from pathlib import Path

from design_kit.logging import get_logger

logger = get_logger(__name__)

ALLOWLIST_MARKER = "scrollbar: ok"


class ScrollbarNativeLintOutcome(Enum):
    PASSED = "passed"
    FAILED = "failed"


class ViolationKind(Enum):
    OVERFLOW_SCROLL = "overflow-scroll"
    SCROLLBAR_WIDTH = "scrollbar-width"
    SCROLLBAR_COLOR = "scrollbar-color"
    SCROLLBAR_GUTTER = "scrollbar-gutter"
    WEBKIT_SCROLLBAR = "webkit-scrollbar"


@dataclass(frozen=True)
class ScrollbarNativeViolation:
    file: str
    line: int
    selector: str
    kind: ViolationKind
    snippet: str


@dataclass(frozen=True)
class ScrollbarNativeLintResult:
    outcome: ScrollbarNativeLintOutcome
    violations: list[ScrollbarNativeViolation]

    @classmethod
    def passed(cls) -> "ScrollbarNativeLintResult":
        return cls(outcome=ScrollbarNativeLintOutcome.PASSED, violations=[])

    @classmethod
    def failed(
        cls, violations: list[ScrollbarNativeViolation]
    ) -> "ScrollbarNativeLintResult":
        return cls(outcome=ScrollbarNativeLintOutcome.FAILED, violations=violations)


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


def _value_is_scroll(value: str) -> bool:
    """True iff the value forces a permanent bar on at least one axis."""
    tokens = value.strip().lower().split()
    return "scroll" in tokens


def _value_is_permitted_gutter(value: str) -> bool:
    """True iff the value reserves the classic bar's width and nothing more.

    ``stable`` is the whole permitted set. ``both-edges`` reserves a strip on
    the side no bar can occupy, and ``auto`` written out longhand is the
    default stated as if it were a decision.
    """
    return value.strip().lower() == "stable"


def _is_webkit_scrollbar_selector(selector: str) -> bool:
    return "::-webkit-scrollbar" in selector


# Each forbidden scrollbar property maps to the violation kind it raises.
# scrollbar-gutter is absent: it is guarded by value, not by name, because
# `stable` is legitimate reservation while every other value is styling.
_FORBIDDEN_PROPERTIES = (
    (_COLOR_RE, ViolationKind.SCROLLBAR_COLOR),
    (_WIDTH_RE, ViolationKind.SCROLLBAR_WIDTH),
)


def _scan_file(path: Path) -> list[ScrollbarNativeViolation]:
    raw = path.read_text(encoding="utf-8")
    raw_lines = raw.splitlines()
    text = _strip_css_comments(raw)

    def line_marked(line: int) -> bool:
        if not 1 <= line <= len(raw_lines):
            return False
        return ALLOWLIST_MARKER in raw_lines[line - 1]

    def snippet_at(line: int) -> str:
        if 1 <= line <= len(raw_lines):
            return raw_lines[line - 1].strip()
        return ""

    violations: list[ScrollbarNativeViolation] = []

    for rule in _iter_leaf_rules(text):
        if line_marked(rule.line):
            continue

        if _is_webkit_scrollbar_selector(rule.selector):
            violations.append(
                ScrollbarNativeViolation(
                    file=str(path),
                    line=rule.line,
                    selector=rule.selector,
                    kind=ViolationKind.WEBKIT_SCROLLBAR,
                    snippet=snippet_at(rule.line),
                )
            )
            continue

        for regex, kind in _FORBIDDEN_PROPERTIES:
            for decl in _parse_decls(rule, regex):
                if line_marked(decl.line):
                    continue
                violations.append(
                    ScrollbarNativeViolation(
                        file=str(path),
                        line=decl.line,
                        selector=rule.selector,
                        kind=kind,
                        snippet=snippet_at(decl.line),
                    )
                )

        for decl in _parse_decls(rule, _GUTTER_RE):
            if line_marked(decl.line):
                continue
            if not _value_is_permitted_gutter(decl.value):
                violations.append(
                    ScrollbarNativeViolation(
                        file=str(path),
                        line=decl.line,
                        selector=rule.selector,
                        kind=ViolationKind.SCROLLBAR_GUTTER,
                        snippet=snippet_at(decl.line),
                    )
                )

        for decl in _parse_decls(rule, _OVERFLOW_RE):
            if line_marked(decl.line):
                continue
            if _value_is_scroll(decl.value):
                violations.append(
                    ScrollbarNativeViolation(
                        file=str(path),
                        line=decl.line,
                        selector=rule.selector,
                        kind=ViolationKind.OVERFLOW_SCROLL,
                        snippet=snippet_at(decl.line),
                    )
                )

    return violations


def run_scrollbar_native_lint(
    components_dir: Path,
) -> ScrollbarNativeLintResult:
    if not components_dir.is_dir():
        logger.warning(
            f"Components directory not found: {components_dir}; "
            "skipping scrollbar-native lint"
        )
        return ScrollbarNativeLintResult.passed()
    all_violations: list[ScrollbarNativeViolation] = []
    for path in sorted(components_dir.glob("*.css")):
        all_violations.extend(_scan_file(path))
    if all_violations:
        return ScrollbarNativeLintResult.failed(all_violations)
    return ScrollbarNativeLintResult.passed()
