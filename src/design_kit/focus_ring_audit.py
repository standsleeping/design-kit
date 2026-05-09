"""Static scan of component CSS for outwardly offset focus rings.

Static-analysis corollary of FOCUS_RING_INSIDE_CLIPPED_CONTAINER: focus rings
should be inset (negative ``outline-offset``) by default. An outwardly offset
ring (``outline-offset: 2px``) is clipped by overflow-hidden ancestors and
collides with adjacent siblings in tightly packed lists, tabs, breadcrumbs,
and chrome strips.

Components are allowed an explicit escape via a ``/* focus-ring: standalone */``
trailing comment for genuinely standalone controls (form fields, isolated
buttons) where the outset ring has room to breathe.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from pathlib import Path

from design_kit.logging import get_logger

logger = get_logger(__name__)

# Match `outline-offset: <value>` and capture the value text (without unit).
OFFSET_RE = re.compile(r"outline-offset:\s*(-?[0-9]*\.?[0-9]+)")
ALLOWLIST_MARKER = "focus-ring: standalone"


class FocusRingAuditOutcome(Enum):
    PASSED = "passed"
    FAILED = "failed"


@dataclass(frozen=True)
class FocusRingViolation:
    """One outwardly offset focus ring inside a component CSS file."""

    file: str
    line: int
    selector: str
    snippet: str


@dataclass(frozen=True)
class FocusRingAuditResult:
    outcome: FocusRingAuditOutcome
    violations: list[FocusRingViolation]

    @classmethod
    def passed(cls) -> "FocusRingAuditResult":
        return cls(outcome=FocusRingAuditOutcome.PASSED, violations=[])

    @classmethod
    def failed(
        cls, violations: list[FocusRingViolation]
    ) -> "FocusRingAuditResult":
        return cls(outcome=FocusRingAuditOutcome.FAILED, violations=violations)


def _scan_file(path: Path) -> list[FocusRingViolation]:
    """Walk the file, tracking which rule block we are in.

    Flags every ``outline-offset`` with a positive value that sits inside a
    ``:focus-visible`` rule block, unless the source line carries the
    allowlist marker.
    """
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    violations: list[FocusRingViolation] = []

    # Stack of selectors for currently open rule blocks. Pushed when we see
    # `{`, popped when we see `}`. The selector is the text accumulated
    # since the previous block boundary.
    selector_stack: list[str] = []
    pending_selector = ""

    for line_num, raw_line in enumerate(lines, start=1):
        # Strip line-level block comments so brace-counting is not confused
        # by braces inside comments.
        line_no_comments = re.sub(r"/\*.*?\*/", "", raw_line)
        stripped = line_no_comments.strip()

        # Process each `{` and `}` on the line in order, splitting around
        # them so segments before/between/after braces can extend either the
        # pending selector or be checked for declarations.
        i = 0
        while i < len(stripped):
            j = i
            while j < len(stripped) and stripped[j] not in "{}":
                j += 1
            segment = stripped[i:j].strip()
            if j == len(stripped):
                # Trailing segment — no brace closes it.
                if selector_stack:
                    # Inside a block: this is a declaration line.
                    _check_declaration(
                        raw_line,
                        selector_stack[-1],
                        line_num,
                        path,
                        violations,
                    )
                else:
                    # Outside any block: extend the pending selector.
                    if segment:
                        pending_selector = (
                            pending_selector + " " + segment
                        ).strip()
                break
            brace = stripped[j]
            if brace == "{":
                selector = (pending_selector + " " + segment).strip()
                pending_selector = ""
                selector_stack.append(selector)
            else:  # brace == "}"
                # Segment before `}` is the tail of a declaration; check it.
                if selector_stack and segment:
                    _check_declaration(
                        raw_line,
                        selector_stack[-1],
                        line_num,
                        path,
                        violations,
                    )
                if selector_stack:
                    selector_stack.pop()
                pending_selector = ""
            i = j + 1

    return violations


def _check_declaration(
    raw_line: str,
    selector: str,
    line_num: int,
    path: Path,
    violations: list[FocusRingViolation],
) -> None:
    """Flag positive outline-offset inside a :focus-visible block."""
    if ":focus-visible" not in selector:
        return
    match = OFFSET_RE.search(raw_line)
    if not match:
        return
    try:
        value = float(match.group(1))
    except ValueError:
        return
    if value <= 0:
        return
    if ALLOWLIST_MARKER in raw_line:
        return
    violations.append(
        FocusRingViolation(
            file=str(path),
            line=line_num,
            selector=selector,
            snippet=raw_line.strip(),
        )
    )


def run_focus_ring_audit(components_dir: Path) -> FocusRingAuditResult:
    """Scan every ``components/*.css`` for outwardly offset focus rings."""
    if not components_dir.is_dir():
        logger.warning(
            f"Components directory not found: {components_dir}; "
            "skipping focus-ring audit"
        )
        return FocusRingAuditResult.passed()
    all_violations: list[FocusRingViolation] = []
    for path in sorted(components_dir.glob("*.css")):
        all_violations.extend(_scan_file(path))
    if all_violations:
        return FocusRingAuditResult.failed(all_violations)
    return FocusRingAuditResult.passed()
