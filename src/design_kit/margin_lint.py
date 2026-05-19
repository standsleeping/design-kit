"""Static scan of CSS for margin declarations that carry layout intent.

Static-analysis corollary of NEVER_MARGIN: ``margin`` does not appear in
production CSS as a rhythm or layout device. Inter-element rhythm lives in
the parent's ``gap``; explicit gaps live in a structural sibling spacer;
centering lives in ``place-items`` or grid alignment.

The lint permits two narrow forms that do not express layout intent:

* **Zero resets** — ``margin: 0`` and ``margin-(side): 0`` neutralize UA
  defaults so the rest of the system can rely on no implicit gaps. This is
  the corollary that *enables* NEVER_MARGIN, not a use of margin for layout.
* **Auto alignment hooks** — ``margin: auto`` and ``margin-(side): auto``
  are the CSS-spec-defined flex/grid alignment mechanism for absorbing
  available space on one or more sides. They carry no spacing value; they
  delegate placement to the layout algorithm of the parent.

Every other margin declaration (positive length, percentage, calc, mixed
values, ``0 auto`` for centering, etc.) carries layout intent and is
flagged. Migration: lift rhythm into the parent's ``gap``, replace centering
with grid + ``justify-content`` / ``place-items``, replace negative-margin
bleed with structural restructuring so the bleeding element sits outside
the padded container.

Inputs mirror the token-leak lint: ``components/*.css`` always;
``pages/*.html`` ``<style>`` blocks when ``pages_dir`` is provided; any
``extra_files`` scanned as plain text. The trailing ``/* margin-lint: ok */``
comment allowlists a single line for documented exceptions.
"""

from __future__ import annotations

import re
from collections.abc import Iterable
from dataclasses import dataclass
from enum import Enum
from pathlib import Path

from design_kit.logging import get_logger

logger = get_logger(__name__)

# Match a margin declaration. Captures the property name in group 1 and the
# value (up to ; or end of rule) in group 2. The negative lookbehind keeps
# longer property names that end in -margin (``scroll-margin``,
# ``scroll-margin-top``) from being mistaken for margin declarations.
MARGIN_DECL_RE = re.compile(
    r"(?<![\w-])(margin(?:-(?:top|right|bottom|left))?)\s*:\s*([^;}]+?)\s*(?:;|$)",
    re.MULTILINE,
)
# Block comment stripper.
COMMENT_RE = re.compile(r"/\*.*?\*/", flags=re.DOTALL)
# HTML <style>...</style> block extractor (case-insensitive, multiline).
STYLE_BLOCK_RE = re.compile(
    r"<style[^>]*>(.*?)</style>", flags=re.DOTALL | re.IGNORECASE
)
ALLOWLIST_MARKER = "margin-lint: ok"
# A value token whose presence is benign — zero (any unit) or auto. Anything
# else (a positive length, a var() reference, a calc(), a percentage) means
# the declaration carries layout intent.
_ZERO_TOKEN_RE = re.compile(r"^0(?:px|em|rem|lh|rlh|ch|vw|vh|%)?$", re.IGNORECASE)
_AUTO_TOKEN_RE = re.compile(r"^auto$", re.IGNORECASE)


class MarginLintOutcome(Enum):
    PASSED = "passed"
    FAILED = "failed"


@dataclass(frozen=True)
class MarginViolation:
    file: str
    line: int
    snippet: str
    declaration: str
    value: str


@dataclass(frozen=True)
class MarginLintResult:
    outcome: MarginLintOutcome
    violations: list[MarginViolation]

    @classmethod
    def passed(cls) -> "MarginLintResult":
        return cls(outcome=MarginLintOutcome.PASSED, violations=[])

    @classmethod
    def failed(cls, violations: list[MarginViolation]) -> "MarginLintResult":
        return cls(outcome=MarginLintOutcome.FAILED, violations=violations)


def _html_to_css_text(html: str) -> str:
    """Blank everything outside <style>...</style> while preserving newlines."""
    out: list[str] = []
    pos = 0
    for m in STYLE_BLOCK_RE.finditer(html):
        prefix = html[pos : m.start(1)]
        out.append(re.sub(r"[^\n]", " ", prefix))
        out.append(m.group(1))
        pos = m.end(1)
    out.append(re.sub(r"[^\n]", " ", html[pos:]))
    return "".join(out)


def _split_value_tokens(value: str) -> list[str]:
    """Split a margin shorthand value into top-level whitespace tokens.

    Preserves parenthesized groups (``var(--x)``, ``calc(...)``) as single
    tokens so we never split inside a function call.
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


def _is_benign_value(value: str) -> bool:
    """Permit values whose every token is a zero or ``auto``.

    A mixed value like ``0 auto`` falls through: the ``auto`` carries
    centering intent and a horizontally-centered max-width column belongs in
    grid alignment, not margin.
    """
    tokens = _split_value_tokens(value)
    if not tokens:
        return False
    all_zero = all(_ZERO_TOKEN_RE.match(t) for t in tokens)
    all_auto = all(_AUTO_TOKEN_RE.match(t) for t in tokens)
    return all_zero or all_auto


def _scan_file(path: Path) -> list[MarginViolation]:
    text = path.read_text(encoding="utf-8")
    if path.suffix == ".html":
        text = _html_to_css_text(text)
    clean = COMMENT_RE.sub(
        lambda m: re.sub(r"[^\n]", " ", m.group(0)),
        text,
    )
    original_lines = text.splitlines()
    violations: list[MarginViolation] = []
    for line_num, raw_line in enumerate(clean.splitlines(), start=1):
        original_line = original_lines[line_num - 1]
        if ALLOWLIST_MARKER in original_line:
            continue
        for decl_match in MARGIN_DECL_RE.finditer(raw_line):
            value = decl_match.group(2)
            if _is_benign_value(value):
                continue
            violations.append(
                MarginViolation(
                    file=str(path),
                    line=line_num,
                    snippet=original_line.strip(),
                    declaration=decl_match.group(1),
                    value=value,
                )
            )
    return violations


def run_margin_lint(
    components_dir: Path,
    pages_dir: Path | None = None,
    extra_files: Iterable[Path] = (),
) -> MarginLintResult:
    """Scan component CSS, page ``<style>`` blocks, and any extra files for
    margin declarations that carry layout intent. Each input is optional;
    missing inputs log a warning and are skipped."""
    paths: list[Path] = []
    if components_dir.is_dir():
        paths.extend(sorted(components_dir.glob("*.css")))
    else:
        logger.warning(
            f"Components directory not found: {components_dir}; "
            "skipping that scope"
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
    all_violations: list[MarginViolation] = []
    for path in paths:
        all_violations.extend(_scan_file(path))
    if all_violations:
        return MarginLintResult.failed(all_violations)
    return MarginLintResult.passed()
