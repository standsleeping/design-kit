"""Static scan of CSS for raw border-width literals that should be tokens.

Static-analysis corollary of TOKEN_DRIVEN_DESIGN applied to border widths:
``border``, ``border-(top|right|bottom|left)``, ``border-width``, and the
side-width longhands must reference ``var(--border-width-*)`` (thin = 1px,
medium = 2px, thick = 3px) rather than hardcoding the pixel value. Hardcoded
border widths are silent drift surface — change the token, the literal sites
stay frozen.

Inputs mirror token-leak-lint: ``components/*.css`` always; ``pages/*.html``
``<style>`` blocks when ``pages_dir`` is provided; any ``extra_files``
(typically ``preview.py``) scanned as plain text. The same trailing
``/* token-leak: ok */`` comment allowlists a line.

Scope note: this lint does NOT flag ``border-radius`` declarations — those
are covered by ``radius_lint.py``. The pattern matcher excludes the
``border-radius`` longhand and any ``border-*-radius`` variants.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from typing import TYPE_CHECKING

from design_kit.logging import get_logger

if TYPE_CHECKING:
    from collections.abc import Iterable
    from pathlib import Path

logger = get_logger(__name__)

# Match a border-style declaration name (NOT border-radius).
# Captures the declaration name in group 1 and the value (up to ; or end of
# rule) in group 2.
BORDER_DECL_RE = re.compile(
    r"\b(border(?:-(?:top|right|bottom|left))?(?:-width)?|"
    r"border-(?:top|right|bottom|left)-width)\s*:\s*([^;}]+?)\s*(?:;|$)",
    re.MULTILINE,
)
# A numeric px/em/rem token; we'll filter zero values separately.
WIDTH_LITERAL_RE = re.compile(r"\b(\d+(?:\.\d+)?)(px|em|rem)\b")
# Block comment stripper.
COMMENT_RE = re.compile(r"/\*.*?\*/", flags=re.DOTALL)
# HTML <style>...</style> block extractor (case-insensitive, multiline).
STYLE_BLOCK_RE = re.compile(
    r"<style[^>]*>(.*?)</style>", flags=re.DOTALL | re.IGNORECASE
)
ALLOWLIST_MARKER = "token-leak: ok"


class BorderWidthLintOutcome(Enum):
    PASSED = "passed"
    FAILED = "failed"


@dataclass(frozen=True)
class BorderWidthViolation:
    file: str
    line: int
    snippet: str
    declaration: str
    literal: str


@dataclass(frozen=True)
class BorderWidthLintResult:
    outcome: BorderWidthLintOutcome
    violations: list[BorderWidthViolation]

    @classmethod
    def passed(cls) -> BorderWidthLintResult:
        return cls(outcome=BorderWidthLintOutcome.PASSED, violations=[])

    @classmethod
    def failed(cls, violations: list[BorderWidthViolation]) -> BorderWidthLintResult:
        return cls(outcome=BorderWidthLintOutcome.FAILED, violations=violations)


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


def _scan_file(path: Path) -> list[BorderWidthViolation]:
    text = path.read_text(encoding="utf-8")
    if path.suffix == ".html":
        text = _html_to_css_text(text)
    clean = COMMENT_RE.sub(
        lambda m: re.sub(r"[^\n]", " ", m.group(0)),
        text,
    )
    original_lines = text.splitlines()
    violations: list[BorderWidthViolation] = []
    for line_num, raw_line in enumerate(clean.splitlines(), start=1):
        original_line = original_lines[line_num - 1]
        if ALLOWLIST_MARKER in original_line:
            continue
        for decl_match in BORDER_DECL_RE.finditer(raw_line):
            value = decl_match.group(2)
            for lit_match in WIDTH_LITERAL_RE.finditer(value):
                number = lit_match.group(1)
                if float(number) == 0.0:
                    continue
                violations.append(
                    BorderWidthViolation(
                        file=str(path),
                        line=line_num,
                        snippet=original_line.strip(),
                        declaration=decl_match.group(1),
                        literal=lit_match.group(0),
                    )
                )
    return violations


def run_border_width_lint(
    components_dir: Path,
    pages_dir: Path | None = None,
    extra_files: Iterable[Path] = (),
) -> BorderWidthLintResult:
    """Scan component CSS, page ``<style>`` blocks, and any extra files for
    raw border-width literals. Each input is optional; missing inputs log a
    warning and are skipped."""
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
            logger.warning(f"Extra file not found: {extra}; skipping that scope")
    all_violations: list[BorderWidthViolation] = []
    for path in paths:
        all_violations.extend(_scan_file(path))
    if all_violations:
        return BorderWidthLintResult.failed(all_violations)
    return BorderWidthLintResult.passed()
