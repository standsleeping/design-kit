"""Static scan of CSS for missing peer-edge reservations.

Static-analysis corollary of PEER_EDGE_RESERVATION: when one state of an
interactive item reveals a visual element at one edge (a left-border
accent stripe on selection, a status marker on the current step), every
peer reserves the same edge via a transparent equivalent so square
padding stays reachable and the box does not shift on state change.

The lint flags ``border-(top|right|bottom|left)`` and
``border-(side)-color`` declarations with a non-transparent color when
the selector contains a persistent state modifier (``-selected``,
``-active``, ``-current``), unless the matching rest state -- the target
class itself, or any BEM parent of it -- declares the same
``border-(side)`` with ``transparent`` color.

Scope: ``components/*.css`` only. The conservative heuristic limits the
lint to persistent state modifier suffixes; compound state pseudos like
``:hover`` and attribute selectors like ``[open]`` are out of scope.
The principle still applies to those shapes, but the static signal is
too noisy to enforce automatically.

Allowlist marker: ``/* peer-edge: ok */`` for documented exceptions
(place either on the rule's selector line or on the offending
declaration's line).
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

ALLOWLIST_MARKER = "peer-edge: ok"

_MODIFIER_SUFFIXES = ("-selected", "-active", "-current")


class PeerEdgeLintOutcome(Enum):
    PASSED = "passed"
    FAILED = "failed"


@dataclass(frozen=True)
class PeerEdgeViolation:
    file: str
    line: int
    selector: str
    side: str
    declaration: str
    snippet: str


@dataclass(frozen=True)
class PeerEdgeLintResult:
    outcome: PeerEdgeLintOutcome
    violations: list[PeerEdgeViolation]

    @classmethod
    def passed(cls) -> PeerEdgeLintResult:
        return cls(outcome=PeerEdgeLintOutcome.PASSED, violations=[])

    @classmethod
    def failed(cls, violations: list[PeerEdgeViolation]) -> PeerEdgeLintResult:
        return cls(outcome=PeerEdgeLintOutcome.FAILED, violations=violations)


_COMMENT_RE = re.compile(r"/\*.*?\*/", re.DOTALL)


def _strip_css_comments(text: str) -> str:
    """Replace ``/* ... */`` with whitespace, preserving line counts."""

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
    """Yield ``_Rule`` for each leaf rule.

    A leaf rule is a ``{ ... }`` block whose body contains no further
    ``{``. At-rule wrappers (``@media``, ``@container``, ``@supports``,
    ``@layer``) are transparently descended into.
    """
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


def _split_top_level_commas(selector: str) -> list[str]:
    parts: list[str] = []
    depth = 0
    buf: list[str] = []
    for ch in selector:
        if ch in "([":
            depth += 1
            buf.append(ch)
        elif ch in ")]":
            depth = max(0, depth - 1)
            buf.append(ch)
        elif ch == "," and depth == 0:
            parts.append("".join(buf).strip())
            buf = []
        else:
            buf.append(ch)
    if buf:
        parts.append("".join(buf).strip())
    return [p for p in parts if p]


_NOT_RE = re.compile(r":not\([^)]*\)")
_CLASS_RE = re.compile(r"\.[a-zA-Z][a-zA-Z0-9_-]*")


def _classes_in_selector(selector: str) -> list[str]:
    """All class tokens in ``selector``, excluding those inside ``:not(...)``."""
    stripped = _NOT_RE.sub(" ", selector)
    return _CLASS_RE.findall(stripped)


def _rightmost_class(selector: str) -> str | None:
    classes = _classes_in_selector(selector)
    return classes[-1] if classes else None


def _has_modifier(selector: str) -> bool:
    """True iff any class in ``selector`` ends with a known state modifier."""
    for cls in _classes_in_selector(selector):
        for suffix in _MODIFIER_SUFFIXES:
            if cls.endswith(suffix):
                return True
    return False


def _bem_parents(base: str) -> Iterator[str]:
    """Yield successive parent classes by stripping ``-<segment>`` suffixes."""
    if not re.fullmatch(r"\.[a-zA-Z][a-zA-Z0-9_-]*", base):
        return
    current = base
    while True:
        m = re.match(r"^(\.[a-zA-Z][a-zA-Z0-9_-]*?)-[a-zA-Z0-9]+$", current)
        if not m:
            return
        current = m.group(1)
        yield current


_BORDER_SIDE_RE = re.compile(
    r"^[ \t]*border-(top|right|bottom|left)(-color)?[ \t]*:[ \t]*([^;}\n]+(?:\n[^;}]*)*?)[ \t]*;",
    re.MULTILINE,
)


@dataclass(frozen=True)
class _BorderSideDecl:
    side: str
    declaration: str
    value: str
    line: int
    is_transparent: bool


def _is_transparent_value(value: str) -> bool:
    """True iff the color portion of ``value`` is ``transparent``.

    For shorthand ``border-(side): <width> <style> <color>`` the color
    is the rightmost whitespace-separated token; for the longhand
    ``border-(side)-color: <color>`` the entire value is the color.
    Either way, checking the last token suffices.
    """
    tokens = value.split()
    if not tokens:
        return False
    return tokens[-1].strip().lower() == "transparent"


def _parse_border_side_declarations(rule: _Rule) -> list[_BorderSideDecl]:
    results: list[_BorderSideDecl] = []
    for m in _BORDER_SIDE_RE.finditer(rule.body):
        side = m.group(1)
        is_color_longhand = m.group(2) is not None
        value = m.group(3).strip().replace("\n", " ")
        leading = rule.body[: m.start()]
        decl_line = rule.body_line_offset + leading.count("\n")
        declaration = f"border-{side}" + ("-color" if is_color_longhand else "")
        results.append(
            _BorderSideDecl(
                side=side,
                declaration=declaration,
                value=value,
                line=decl_line,
                is_transparent=_is_transparent_value(value),
            )
        )
    return results


def _scan_file(path: Path) -> list[PeerEdgeViolation]:
    raw = path.read_text(encoding="utf-8")
    raw_lines = raw.splitlines()
    text = _strip_css_comments(raw)

    rules = list(_iter_leaf_rules(text))

    # Pass 1: collect transparent reservations keyed by (class, side).
    reservations: set[tuple[str, str]] = set()
    for rule in rules:
        decls = _parse_border_side_declarations(rule)
        if not any(d.is_transparent for d in decls):
            continue
        for sel in _split_top_level_commas(rule.selector):
            target = _rightmost_class(sel)
            if target is None:
                continue
            for decl in decls:
                if decl.is_transparent:
                    reservations.add((target, decl.side))

    # Pass 2: flag colored border-(side) declarations on modifier selectors
    # whose rest state lacks a transparent reservation.
    violations: list[PeerEdgeViolation] = []
    for rule in rules:
        decls = _parse_border_side_declarations(rule)
        if not decls:
            continue
        sel_snippet = (
            raw_lines[rule.line - 1] if 1 <= rule.line <= len(raw_lines) else ""
        )
        rule_allowlisted = ALLOWLIST_MARKER in sel_snippet
        for decl in decls:
            if decl.is_transparent:
                continue
            decl_snippet = (
                raw_lines[decl.line - 1] if 1 <= decl.line <= len(raw_lines) else ""
            )
            if rule_allowlisted or ALLOWLIST_MARKER in decl_snippet:
                continue
            for sel in _split_top_level_commas(rule.selector):
                if not _has_modifier(sel):
                    continue
                target = _rightmost_class(sel)
                if target is None:
                    continue
                rest_candidates = [target, *_bem_parents(target)]
                if any(
                    (candidate, decl.side) in reservations
                    for candidate in rest_candidates
                ):
                    continue
                violations.append(
                    PeerEdgeViolation(
                        file=str(path),
                        line=decl.line,
                        selector=sel,
                        side=decl.side,
                        declaration=decl.declaration,
                        snippet=decl_snippet.strip(),
                    )
                )
    return violations


def run_peer_edge_lint(components_dir: Path) -> PeerEdgeLintResult:
    """Scan every ``components/*.css`` for unreserved peer-edge accents."""
    if not components_dir.is_dir():
        logger.warning(
            f"Components directory not found: {components_dir}; skipping peer-edge lint"
        )
        return PeerEdgeLintResult.passed()
    all_violations: list[PeerEdgeViolation] = []
    for path in sorted(components_dir.glob("*.css")):
        all_violations.extend(_scan_file(path))
    if all_violations:
        return PeerEdgeLintResult.failed(all_violations)
    return PeerEdgeLintResult.passed()
