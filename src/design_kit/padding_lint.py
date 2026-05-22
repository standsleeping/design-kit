"""Static scan of component CSS for non-square padding declarations.

Static-analysis corollary of PADDING_IS_INSET_ONLY: a box's inset is uniform
on all four sides. Any horizontal-vs-vertical, top-vs-bottom, or
left-vs-right asymmetry belongs in a property whose name matches the
concern (``min-width`` / ``gap`` / ``margin``), not in ``padding``.

The lint walks component ``.css`` files, expands every ``padding``
shorthand into its (top, right, bottom, left) 4-tuple, merges per-rule
``padding-*`` longhand declarations into the same tuple, and emits a
finding for any tuple whose four values are not textually equal.

Components are allowed an explicit escape via a ``/* padding-lint: ok */``
trailing comment on the offending declaration line. Use the marker for
documented exceptions; new asymmetric padding should be replaced with the
property that owns the concern.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from typing import TYPE_CHECKING

from design_kit.logging import get_logger

if TYPE_CHECKING:
    from collections.abc import Iterator, Sequence
    from pathlib import Path

logger = get_logger(__name__)


ALLOWLIST_MARKER = "padding-lint: ok"


class AsymmetryKind(Enum):
    HORIZONTAL_VS_VERTICAL = "h ≠ v"
    TOP_VS_BOTTOM = "top ≠ bottom"
    LEFT_VS_RIGHT = "left ≠ right"


class PaddingLintOutcome(Enum):
    PASSED = "passed"
    FAILED = "failed"


@dataclass(frozen=True)
class Sides:
    top: str
    right: str
    bottom: str
    left: str

    def asymmetries(self) -> tuple[AsymmetryKind, ...]:
        kinds: list[AsymmetryKind] = []
        if self.top != self.bottom:
            kinds.append(AsymmetryKind.TOP_VS_BOTTOM)
        if self.left != self.right:
            kinds.append(AsymmetryKind.LEFT_VS_RIGHT)
        if not kinds and self.top != self.left:
            kinds.append(AsymmetryKind.HORIZONTAL_VS_VERTICAL)
        return tuple(kinds)


@dataclass(frozen=True)
class PaddingViolation:
    file: str
    line: int
    selector: str
    snippet: str
    sides: Sides
    kinds: tuple[AsymmetryKind, ...]


@dataclass(frozen=True)
class PaddingLintResult:
    outcome: PaddingLintOutcome
    violations: list[PaddingViolation]

    @classmethod
    def passed(cls) -> PaddingLintResult:
        return cls(outcome=PaddingLintOutcome.PASSED, violations=[])

    @classmethod
    def failed(cls, violations: list[PaddingViolation]) -> PaddingLintResult:
        return cls(outcome=PaddingLintOutcome.FAILED, violations=violations)


# ------------------------- CSS structural helpers ------------------------

_COMMENT_RE = re.compile(r"/\*.*?\*/", re.DOTALL)


def _strip_css_comments(text: str) -> str:
    """Replace ``/* ... */`` with whitespace, preserving line counts and offsets."""

    def _replace(m: re.Match[str]) -> str:
        return "".join("\n" if ch == "\n" else " " for ch in m.group(0))

    return _COMMENT_RE.sub(_replace, text)


def _line_starts(text: str) -> list[int]:
    starts = [0]
    for idx, ch in enumerate(text):
        if ch == "\n":
            starts.append(idx + 1)
    return starts


def _offset_to_line(line_starts: Sequence[int], offset: int) -> int:
    """Binary-search the 1-indexed line containing ``offset``."""
    lo, hi = 0, len(line_starts) - 1
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if line_starts[mid] <= offset:
            lo = mid
        else:
            hi = mid - 1
    return lo + 1


def _split_value_tokens(value: str) -> list[str]:
    """Split a CSS shorthand value into top-level whitespace tokens.

    Preserves parenthesized groups like ``var(--x, 4px)`` or
    ``calc(1rem + 2px)`` as single tokens.
    """
    tokens: list[str] = []
    depth = 0
    buf: list[str] = []
    for ch in value:
        if ch == "(":
            depth += 1
            buf.append(ch)
        elif ch == ")":
            depth = max(0, depth - 1)
            buf.append(ch)
        elif ch.isspace() and depth == 0:
            if buf:
                tokens.append("".join(buf))
                buf = []
        else:
            buf.append(ch)
    if buf:
        tokens.append("".join(buf))
    return tokens


def _expand_shorthand(tokens: Sequence[str]) -> Sides | None:
    """Expand a CSS shorthand into a Sides 4-tuple. Returns None if invalid."""
    n = len(tokens)
    if n == 1:
        t = tokens[0]
        return Sides(top=t, right=t, bottom=t, left=t)
    if n == 2:
        v, h = tokens[0], tokens[1]
        return Sides(top=v, right=h, bottom=v, left=h)
    if n == 3:
        t, h, b = tokens[0], tokens[1], tokens[2]
        return Sides(top=t, right=h, bottom=b, left=h)
    if n == 4:
        top, right, bottom, left = tokens[0], tokens[1], tokens[2], tokens[3]
        return Sides(top=top, right=right, bottom=bottom, left=left)
    return None


def _iter_leaf_rules(text: str) -> Iterator[tuple[str, str, int]]:
    """Yield ``(selector, body, body_start_line)`` for each leaf rule.

    A leaf rule is a ``{ ... }`` block whose body contains no further ``{``.
    At-rule wrappers (``@layer``, ``@media``, ``@supports``, ``@container``)
    are transparently descended into, so the reported selector is the actual
    class/element/id rule that contains the declarations.
    """
    line_starts = _line_starts(text)
    n = len(text)

    def walk(start: int, end: int) -> Iterator[tuple[str, str, int]]:
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
                else:
                    yield (
                        selector,
                        body,
                        _offset_to_line(line_starts, body_start),
                    )
                i = j + 1
                selector_start = i
                continue
            elif ch == "}":
                selector_start = i + 1
            i += 1

    yield from walk(0, n)


_DECL_RE = re.compile(
    r"(?P<prop>[a-zA-Z-]+)\s*:\s*(?P<value>[^;{}]+?)\s*(?:;|$)",
    re.MULTILINE,
)
_PADDING_LONGHANDS = frozenset(
    {"padding-top", "padding-right", "padding-bottom", "padding-left"}
)


@dataclass(frozen=True)
class _Declaration:
    prop_name: str
    value: str
    line: int


def _iter_declarations(body: str, body_start_line: int) -> Iterator[_Declaration]:
    line_starts_body = _line_starts(body)
    for m in _DECL_RE.finditer(body):
        prop = m.group("prop").strip().lower()
        value = m.group("value").strip()
        local_line = _offset_to_line(line_starts_body, m.start())
        yield _Declaration(
            prop_name=prop, value=value, line=body_start_line + local_line - 1
        )


def _is_padding_decl(name: str) -> bool:
    return name == "padding" or name in _PADDING_LONGHANDS


def _side_of_longhand(name: str) -> str | None:
    parts = name.split("-")
    if len(parts) == 2 and parts[1] in {"top", "right", "bottom", "left"}:
        return parts[1]
    return None


def _analyze_block(
    file: Path,
    raw_lines: list[str],
    selector: str,
    body: str,
    body_start_line: int,
) -> list[PaddingViolation]:
    """Emit violations for asymmetric padding declarations in a single rule."""
    violations: list[PaddingViolation] = []
    longhand_state: dict[str, _Declaration] = {}

    for decl in _iter_declarations(body, body_start_line):
        if not _is_padding_decl(decl.prop_name):
            continue
        side = _side_of_longhand(decl.prop_name)
        if side is None:
            tokens = _split_value_tokens(decl.value)
            sides = _expand_shorthand(tokens)
            if sides is None:
                continue
            kinds = sides.asymmetries()
            if not kinds:
                continue
            if _line_has_marker(raw_lines, decl.line):
                continue
            snippet = (
                raw_lines[decl.line - 1].strip()
                if 1 <= decl.line <= len(raw_lines)
                else f"{decl.prop_name}: {decl.value};"
            )
            violations.append(
                PaddingViolation(
                    file=str(file),
                    line=decl.line,
                    selector=selector,
                    snippet=snippet,
                    sides=sides,
                    kinds=kinds,
                )
            )
        else:
            longhand_state[side] = decl

    if longhand_state:
        top = longhand_state["top"].value if "top" in longhand_state else "0"
        right = longhand_state["right"].value if "right" in longhand_state else "0"
        bottom = longhand_state["bottom"].value if "bottom" in longhand_state else "0"
        left = longhand_state["left"].value if "left" in longhand_state else "0"
        sides = Sides(top=top, right=right, bottom=bottom, left=left)
        kinds = sides.asymmetries()
        if kinds:
            first_line = min(d.line for d in longhand_state.values())
            if not _line_has_marker(raw_lines, first_line):
                snippet = "; ".join(
                    f"{d.prop_name}: {d.value}" for d in longhand_state.values()
                )
                violations.append(
                    PaddingViolation(
                        file=str(file),
                        line=first_line,
                        selector=selector,
                        snippet=snippet,
                        sides=sides,
                        kinds=kinds,
                    )
                )

    return violations


def _line_has_marker(raw_lines: list[str], line: int) -> bool:
    if not 1 <= line <= len(raw_lines):
        return False
    return ALLOWLIST_MARKER in raw_lines[line - 1]


def _scan_file(path: Path) -> list[PaddingViolation]:
    """Scan a single CSS file for asymmetric padding declarations."""
    raw = path.read_text(encoding="utf-8")
    raw_lines = raw.splitlines()
    text = _strip_css_comments(raw)
    violations: list[PaddingViolation] = []
    for selector, body, body_start_line in _iter_leaf_rules(text):
        violations.extend(
            _analyze_block(path, raw_lines, selector, body, body_start_line)
        )
    return violations


def run_padding_lint(components_dir: Path) -> PaddingLintResult:
    """Scan every ``components/*.css`` for asymmetric padding declarations."""
    if not components_dir.is_dir():
        logger.warning(
            f"Components directory not found: {components_dir}; skipping padding lint"
        )
        return PaddingLintResult.passed()
    all_violations: list[PaddingViolation] = []
    for path in sorted(components_dir.glob("*.css")):
        all_violations.extend(_scan_file(path))
    if all_violations:
        return PaddingLintResult.failed(all_violations)
    return PaddingLintResult.passed()
