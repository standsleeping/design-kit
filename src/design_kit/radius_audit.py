"""Static scan of component CSS for non-zero border-radius declarations.

Static-analysis corollary of the visual language's "all corners square"
convention: ``border-radius`` defaults to ``0``, and any explicit non-zero
value is a smell. A few genuine circles (status dots, presence indicators)
need ``border-radius: 50%`` — those are allowed via the
``/* radius-audit: ok */`` marker.

The audit walks ``components/*.css`` and flags any ``border-radius``
declaration whose value is not literally ``0`` (after token-var lookup —
even ``var(--radius-md)`` is flagged, because the var resolves to 0 today
and the source should be explicit about that fact rather than implying a
rounded corner is intended).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from pathlib import Path

from design_kit.logging import get_logger

logger = get_logger(__name__)


ALLOWLIST_MARKER = "radius-audit: ok"
RADIUS_RE = re.compile(r"\bborder-radius\s*:\s*([^;}]+?)\s*(?:;|$)")


class RadiusAuditOutcome(Enum):
    PASSED = "passed"
    FAILED = "failed"


@dataclass(frozen=True)
class RadiusViolation:
    file: str
    line: int
    snippet: str
    value: str


@dataclass(frozen=True)
class RadiusAuditResult:
    outcome: RadiusAuditOutcome
    violations: list[RadiusViolation]

    @classmethod
    def passed(cls) -> "RadiusAuditResult":
        return cls(outcome=RadiusAuditOutcome.PASSED, violations=[])

    @classmethod
    def failed(cls, violations: list[RadiusViolation]) -> "RadiusAuditResult":
        return cls(outcome=RadiusAuditOutcome.FAILED, violations=violations)


def _is_zero(value: str) -> bool:
    """True if every token in the multi-value border-radius resolves to zero.

    Accepts ``0``, ``0px``, ``0rem``, ``0%`` (and case variants). A value
    like ``0 0 0 0`` is also zero. Any reference to a ``var(--*)`` or a
    non-zero numeric is non-zero.
    """
    tokens = value.replace("/", " ").split()
    if not tokens:
        return False
    for tok in tokens:
        t = tok.strip().lower()
        if t in {"0", "0px", "0rem", "0em", "0%"}:
            continue
        return False
    return True


def _scan_file(path: Path) -> list[RadiusViolation]:
    """Walk the file line-by-line, flagging non-zero border-radius lines."""
    violations: list[RadiusViolation] = []
    for line_num, raw_line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        # Strip line-level block comments so we don't match border-radius
        # mentions inside a comment.
        no_comments = re.sub(r"/\*.*?\*/", "", raw_line)
        match = RADIUS_RE.search(no_comments)
        if not match:
            continue
        value = match.group(1).strip()
        if _is_zero(value):
            continue
        if ALLOWLIST_MARKER in raw_line:
            continue
        violations.append(
            RadiusViolation(
                file=str(path),
                line=line_num,
                snippet=raw_line.strip(),
                value=value,
            )
        )
    return violations


def run_radius_audit(components_dir: Path) -> RadiusAuditResult:
    """Scan every ``components/*.css`` for non-zero border-radius declarations."""
    if not components_dir.is_dir():
        logger.warning(
            f"Components directory not found: {components_dir}; "
            "skipping radius audit"
        )
        return RadiusAuditResult.passed()
    all_violations: list[RadiusViolation] = []
    for path in sorted(components_dir.glob("*.css")):
        all_violations.extend(_scan_file(path))
    if all_violations:
        return RadiusAuditResult.failed(all_violations)
    return RadiusAuditResult.passed()
