"""Static scan of CSS for visual state declared on non-focusable selectors.

Static-analysis corollary of STATE_BELONGS_TO_INTERACTIVE: visual state
(``:hover``, ``:active``, selection markers) lives on the focusable element
itself, never on a structural wrapper. The signal that an element is
focusable is a paired ``:focus-visible`` (or ``:focus``, ``:focus-within``)
rule on the same base selector, or a base that targets a natively-focusable
element (``a``, ``button``, ``input``, ``select``, ``textarea``,
``summary``, ``label``).

When ``:hover`` or ``:active`` appears on a base whose focus state is not
proven, the visual treatment promises an interaction the keyboard cannot
reach. The audit flags every such case.

Scope: ``components/*.css`` only. The audit walks each file independently
(pages and ``preview.py`` don't currently declare interactive components).

Allowlist marker: ``/* state-audit: ok */`` for documented exceptions
(e.g. group-hover effects where the focusable target is a descendant).
"""

from __future__ import annotations

import re
from collections.abc import Iterator
from dataclasses import dataclass
from enum import Enum
from pathlib import Path

from design_kit.logging import get_logger

logger = get_logger(__name__)

ALLOWLIST_MARKER = "state-audit: ok"

# Elements that are natively focusable; if the base selector ends with one
# of these (as the rightmost simple selector), focusability is proved
# without a :focus-visible rule. Conservative list: skip [tabindex] and
# [role="..."] (need explicit tabindex to be focusable).
_NATIVELY_FOCUSABLE = frozenset(
    {"a", "button", "input", "select", "textarea", "summary", "label", "details"}
)
# Pseudo-classes that count as "this base is focusable."
_FOCUS_PSEUDOS = (":focus-visible", ":focus-within", ":focus")
# Pseudo-classes the audit flags when they appear on non-focusable bases.
_STATE_PSEUDOS = (":hover", ":active")


class InteractiveStateAuditOutcome(Enum):
    PASSED = "passed"
    FAILED = "failed"


@dataclass(frozen=True)
class InteractiveStateViolation:
    file: str
    line: int
    selector: str
    pseudo: str
    snippet: str


@dataclass(frozen=True)
class InteractiveStateAuditResult:
    outcome: InteractiveStateAuditOutcome
    violations: list[InteractiveStateViolation]

    @classmethod
    def passed(cls) -> "InteractiveStateAuditResult":
        return cls(outcome=InteractiveStateAuditOutcome.PASSED, violations=[])

    @classmethod
    def failed(
        cls, violations: list[InteractiveStateViolation]
    ) -> "InteractiveStateAuditResult":
        return cls(
            outcome=InteractiveStateAuditOutcome.FAILED, violations=violations
        )


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


def _iter_leaf_rules(text: str) -> Iterator[tuple[str, int]]:
    """Yield ``(selector_text, line)`` for each leaf rule.

    A leaf rule is a ``{ ... }`` block whose body contains no further ``{``.
    At-rule wrappers (``@media``, ``@container``, ``@supports``, ``@layer``)
    are transparently descended into, so the reported selector is the
    actual class/element/id rule. The reported line is the line of the
    first non-whitespace character of the selector (not the prior rule's
    closing brace, which would mis-attribute by one). Selector text is
    reported as-is (still contains commas; the caller splits).
    """
    line_starts = _line_starts(text)
    n = len(text)

    def first_nonspace(start: int, end: int) -> int:
        i = start
        while i < end and text[i].isspace():
            i += 1
        return i

    def walk(start: int, end: int) -> Iterator[tuple[str, int]]:
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
                    yield (selector, _offset_to_line(line_starts, sel_pos))
                i = j + 1
                selector_start = i
                continue
            elif ch == "}":
                selector_start = i + 1
            i += 1

    yield from walk(0, n)


def _bem_parents(base: str) -> Iterator[str]:
    """Yield successive parent classes by stripping ``-<segment>`` suffixes.

    The audit treats ``.dk-button-primary`` as inheriting focusability from
    ``.dk-button`` (the root component class), the BEM modifier convention
    used across the system. Only single-class bases are walked; compound
    selectors (descendants, combinators) skip BEM matching.

    Examples:
        ``.dk-button-primary`` → yields ``.dk-button``
        ``.dk-segmented-toggle-button-active`` → ``.dk-segmented-toggle-button``,
        ``.dk-segmented-toggle``, ``.dk-segmented``, ``.dk``.
    """
    if not re.fullmatch(r"\.[a-zA-Z][a-zA-Z0-9_-]*", base):
        return
    current = base
    while True:
        m = re.match(r"^(\.[a-zA-Z][a-zA-Z0-9_-]*?)-[a-zA-Z0-9]+$", current)
        if not m:
            return
        current = m.group(1)
        yield current


def _split_top_level_commas(selector: str) -> list[str]:
    """Split a comma-separated selector list at top level (outside ()/[])."""
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


def _strip_trailing_pseudo(selector: str, pseudo: str) -> str | None:
    """If ``selector`` ends with ``pseudo``, return the base (without it).

    Handles only the *trailing* occurrence; ``:hover`` in the middle of a
    descendant chain is a contextual selector and the audit skips it.
    """
    if not selector.endswith(pseudo):
        return None
    return selector[: -len(pseudo)]


def _rightmost_element(base: str) -> str:
    """Extract the rightmost simple-selector's element name, if any.

    Examples:
        ``a.dk-link`` → ``a``
        ``.dk-foo .dk-bar button`` → ``button``
        ``.dk-foo`` → ``""``
    """
    last_token = base.split()[-1] if base.split() else ""
    # Strip class/id/attr/pseudo trailing parts.
    m = re.match(r"^([a-zA-Z]+)", last_token)
    return (m.group(1) if m else "").lower()


def _scan_file(path: Path) -> list[InteractiveStateViolation]:
    raw = path.read_text(encoding="utf-8")
    raw_lines = raw.splitlines()
    text = _strip_css_comments(raw)

    rules = list(_iter_leaf_rules(text))
    # Pass 1: collect base selectors proven focusable by an explicit focus
    # pseudo somewhere in the file.
    focusable_bases: set[str] = set()
    for selector_text, _ in rules:
        for selector in _split_top_level_commas(selector_text):
            for pseudo in _FOCUS_PSEUDOS:
                base = _strip_trailing_pseudo(selector, pseudo)
                if base is not None:
                    focusable_bases.add(base.strip())

    # Pass 2: flag :hover / :active on bases that are neither proven
    # focusable nor natively focusable.
    violations: list[InteractiveStateViolation] = []
    for selector_text, sel_line in rules:
        original_line = (
            raw_lines[sel_line - 1] if 1 <= sel_line <= len(raw_lines) else ""
        )
        if ALLOWLIST_MARKER in original_line:
            continue
        for selector in _split_top_level_commas(selector_text):
            for pseudo in _STATE_PSEUDOS:
                base = _strip_trailing_pseudo(selector, pseudo)
                if base is None:
                    continue
                base = base.strip()
                if base in focusable_bases:
                    continue
                if _rightmost_element(base) in _NATIVELY_FOCUSABLE:
                    continue
                if any(parent in focusable_bases for parent in _bem_parents(base)):
                    continue
                violations.append(
                    InteractiveStateViolation(
                        file=str(path),
                        line=sel_line,
                        selector=selector,
                        pseudo=pseudo,
                        snippet=original_line.strip(),
                    )
                )
    return violations


def run_interactive_state_audit(
    components_dir: Path,
) -> InteractiveStateAuditResult:
    """Scan every ``components/*.css`` for visual state on non-focusable bases."""
    if not components_dir.is_dir():
        logger.warning(
            f"Components directory not found: {components_dir}; "
            "skipping interactive-state audit"
        )
        return InteractiveStateAuditResult.passed()
    all_violations: list[InteractiveStateViolation] = []
    for path in sorted(components_dir.glob("*.css")):
        all_violations.extend(_scan_file(path))
    if all_violations:
        return InteractiveStateAuditResult.failed(all_violations)
    return InteractiveStateAuditResult.passed()
