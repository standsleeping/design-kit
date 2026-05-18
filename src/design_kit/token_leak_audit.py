"""Static scan of CSS for raw color values that should be tokens.

This is the static-analysis corollary of TOKEN_DRIVEN_DESIGN: every surface
that ships CSS consumes design tokens via ``var(--color-*)`` rather than
hardcoding hex codes or color functions. Raw colors defeat theming
(multi-theme, light-dark()) and break the contrast audit's coverage.

The audit is a pure file scan — no browser, no Playwright. Three input kinds:

- ``components/*.css`` — every component's stylesheet
- ``pages/*.html`` — only the ``<style>`` block content is scanned; HTML
  body text is blanked so a hex code mentioned in prose doesn't false-positive
- ``src/design_kit/preview.py`` (and any other ``extra_files``) — scanned as
  plain text so CSS embedded in f-strings is covered

A trailing ``/* token-leak: ok */`` comment on the same line as the literal
escapes the audit for that line — use it for cases where tokenizing isn't yet
warranted (e.g., a debug outline, a single-use scrim awaiting a new token).
"""

from __future__ import annotations

import re
from collections.abc import Iterable
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
# HTML <style>...</style> blocks (case-insensitive, multiline).
STYLE_BLOCK_RE = re.compile(
    r"<style[^>]*>(.*?)</style>", flags=re.DOTALL | re.IGNORECASE
)
# Per-line allowlist marker.
ALLOWLIST_MARKER = "token-leak: ok"


class LeakAuditOutcome(Enum):
    PASSED = "passed"
    FAILED = "failed"


@dataclass(frozen=True)
class TokenLeak:
    """One raw-color literal found in a scanned file."""

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


def _html_to_css_text(html: str) -> str:
    """Return a string the same length as ``html`` with everything outside
    ``<style>...</style>`` blocks replaced by spaces (newlines preserved).

    Same length and same newline positions mean line numbers in the returned
    text map back 1:1 to source HTML lines.
    """
    out: list[str] = []
    pos = 0
    for m in STYLE_BLOCK_RE.finditer(html):
        prefix = html[pos : m.start(1)]
        out.append(re.sub(r"[^\n]", " ", prefix))
        out.append(m.group(1))
        pos = m.end(1)
    out.append(re.sub(r"[^\n]", " ", html[pos:]))
    return "".join(out)


def _scan_file(path: Path) -> list[TokenLeak]:
    text = path.read_text(encoding="utf-8")
    if path.suffix == ".html":
        text = _html_to_css_text(text)
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


def run_token_leak_audit(
    components_dir: Path,
    pages_dir: Path | None = None,
    extra_files: Iterable[Path] = (),
) -> LeakAuditResult:
    """Scan component CSS, page ``<style>`` blocks, and any extra files for
    raw color literals. Each input is optional; missing directories log a
    warning and are skipped (so token-only builds still complete)."""
    paths: list[Path] = []
    if components_dir.is_dir():
        paths.extend(sorted(components_dir.glob("*.css")))
    else:
        logger.warning(
            f"Components directory not found: {components_dir}; skipping that scope"
        )
    if pages_dir is not None:
        if pages_dir.is_dir():
            paths.extend(sorted(pages_dir.glob("*.html")))
        else:
            logger.warning(
                f"Pages directory not found: {pages_dir}; skipping that scope"
            )
    for extra in extra_files:
        if extra.is_file():
            paths.append(extra)
        else:
            logger.warning(
                f"Extra file not found: {extra}; skipping that scope"
            )
    all_leaks: list[TokenLeak] = []
    for path in paths:
        all_leaks.extend(_scan_file(path))
    if all_leaks:
        return LeakAuditResult.failed(all_leaks)
    return LeakAuditResult.passed()
