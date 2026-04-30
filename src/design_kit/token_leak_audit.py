"""Static scan of component CSS for raw color values that should be tokens.

This is the static-analysis corollary of TOKEN_DRIVEN_DESIGN: components
consume design tokens via ``var(--color-*)`` rather than hardcoding hex codes
or color functions. Raw colors in components defeat theming (multi-theme,
light-dark()) and break the contrast audit's coverage.

The audit is a pure file scan — no browser, no Playwright. Components are
allowed an explicit escape via a ``/* token-leak: ok */`` trailing comment
on the same line as the literal, for cases where tokenizing isn't yet
warranted (e.g., a debug outline, a single-use scrim awaiting a new token).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from pathlib import Path

from design_kit.logging import get_logger

logger = get_logger(__name__)

# Hex color: # followed by 3, 4, 6, or 8 hex chars at a word boundary.
HEX_RE = re.compile(r"#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b")
# Color functions that produce raw colors. light-dark() is allowed because
# its arguments are themselves tokens.
COLOR_FN_RE = re.compile(r"\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\s*\(")
# Block comment stripper.
COMMENT_RE = re.compile(r"/\*.*?\*/", flags=re.DOTALL)
# Per-line allowlist marker.
ALLOWLIST_MARKER = "token-leak: ok"


class LeakAuditOutcome(Enum):
    PASSED = "passed"
    FAILED = "failed"


@dataclass(frozen=True)
class TokenLeak:
    """One raw-color literal found in a component CSS file."""

    file: str
    line: int
    value: str
    snippet: str


@dataclass(frozen=True)
class LeakAuditResult:
    outcome: LeakAuditOutcome
    leaks: list[TokenLeak]

    @classmethod
    def passed(cls) -> "LeakAuditResult":
        return cls(outcome=LeakAuditOutcome.PASSED, leaks=[])

    @classmethod
    def failed(cls, leaks: list[TokenLeak]) -> "LeakAuditResult":
        return cls(outcome=LeakAuditOutcome.FAILED, leaks=leaks)


def _scan_file(path: Path) -> list[TokenLeak]:
    text = path.read_text(encoding="utf-8")
    # Replace block-comment characters with spaces but preserve newlines so
    # ``splitlines()`` line counts stay aligned with the source.
    clean = COMMENT_RE.sub(
        lambda m: re.sub(r"[^\n]", " ", m.group(0)),
        text,
    )
    original_lines = text.splitlines()
    leaks: list[TokenLeak] = []
    for line_num, raw_line in enumerate(clean.splitlines(), start=1):
        original_line = original_lines[line_num - 1]
        if ALLOWLIST_MARKER in original_line:
            continue
        for m in HEX_RE.finditer(raw_line):
            leaks.append(
                TokenLeak(
                    file=str(path),
                    line=line_num,
                    value=m.group(0),
                    snippet=original_line.strip(),
                )
            )
        for m in COLOR_FN_RE.finditer(raw_line):
            leaks.append(
                TokenLeak(
                    file=str(path),
                    line=line_num,
                    value=m.group(0).rstrip("("),
                    snippet=original_line.strip(),
                )
            )
    return leaks


def run_token_leak_audit(components_dir: Path) -> LeakAuditResult:
    """Scan every ``components/*.css`` for raw color literals."""
    if not components_dir.is_dir():
        logger.warning(
            f"Components directory not found: {components_dir}; skipping token-leak audit"
        )
        return LeakAuditResult.passed()
    all_leaks: list[TokenLeak] = []
    for path in sorted(components_dir.glob("*.css")):
        all_leaks.extend(_scan_file(path))
    if all_leaks:
        return LeakAuditResult.failed(all_leaks)
    return LeakAuditResult.passed()
