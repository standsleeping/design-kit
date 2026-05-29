"""Static scan of CSS for references to missing public design tokens.

Raw-value lints make authors use custom properties; this lint makes sure the
public custom properties they use actually exist in the built token artifact.
An undefined ``var(--color-*)`` with a fallback is still drift: browsers can
recover at computed-value time, but the design system has lost the named
decision that theming, audits, and consumers are supposed to share.

Public token namespaces are the design-token namespaces emitted by
``tokens.css`` (``--color-*``, ``--spacing-*``, ``--font-*``, and friends).
Component-private knobs should stay under a component or project namespace
such as ``--dk-*`` and are intentionally ignored here.
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

PUBLIC_TOKEN_PREFIXES = (
    "border-",
    "breakpoint-",
    "color-",
    "control-",
    "font-",
    "layout-",
    "motion-",
    "radius-",
    "resizer-handle-",
    "spacing-",
    "typography-",
    "z-",
)

# A complete CSS custom-property definition in a declaration.
TOKEN_DEF_RE = re.compile(r"--([_a-zA-Z0-9-]+)\s*:")
# A complete var() reference, including fallback forms.
TOKEN_REF_RE = re.compile(r"var\(\s*--([_a-zA-Z0-9-]+)\s*(?=[,)])")
# Block comment stripper.
COMMENT_RE = re.compile(r"/\*.*?\*/", flags=re.DOTALL)
# HTML <style>...</style> block extractor (case-insensitive, multiline).
STYLE_BLOCK_RE = re.compile(
    r"<style[^>]*>(.*?)</style>", flags=re.DOTALL | re.IGNORECASE
)
ALLOWLIST_MARKER = "token-reference: ok"


class TokenReferenceLintOutcome(Enum):
    PASSED = "passed"
    FAILED = "failed"


@dataclass(frozen=True)
class TokenReferenceViolation:
    file: str
    line: int
    token: str
    snippet: str


@dataclass(frozen=True)
class TokenReferenceLintResult:
    outcome: TokenReferenceLintOutcome
    violations: list[TokenReferenceViolation]

    @classmethod
    def passed(cls) -> TokenReferenceLintResult:
        return cls(outcome=TokenReferenceLintOutcome.PASSED, violations=[])

    @classmethod
    def failed(
        cls, violations: list[TokenReferenceViolation]
    ) -> TokenReferenceLintResult:
        return cls(outcome=TokenReferenceLintOutcome.FAILED, violations=violations)


def _blank_preserving_newlines(text: str) -> str:
    return re.sub(r"[^\n]", " ", text)


def _html_to_css_text(html: str) -> str:
    """Blank everything outside <style>...</style> while preserving newlines."""
    out: list[str] = []
    pos = 0
    for match in STYLE_BLOCK_RE.finditer(html):
        out.append(_blank_preserving_newlines(html[pos : match.start(1)]))
        out.append(match.group(1))
        pos = match.end(1)
    out.append(_blank_preserving_newlines(html[pos:]))
    return "".join(out)


def _public_token(name: str) -> bool:
    return name.startswith(PUBLIC_TOKEN_PREFIXES)


def _parse_definitions(tokens_css: Path) -> set[str]:
    return set(TOKEN_DEF_RE.findall(tokens_css.read_text(encoding="utf-8")))


def _scan_file(path: Path, defined_tokens: set[str]) -> list[TokenReferenceViolation]:
    text = path.read_text(encoding="utf-8")
    if path.suffix == ".html":
        text = _html_to_css_text(text)
    scanned = COMMENT_RE.sub(
        lambda match: _blank_preserving_newlines(match.group(0)),
        text,
    )
    original_lines = text.splitlines()
    violations: list[TokenReferenceViolation] = []
    for line_num, raw_line in enumerate(scanned.splitlines(), start=1):
        original_line = (
            original_lines[line_num - 1] if line_num - 1 < len(original_lines) else ""
        )
        if ALLOWLIST_MARKER in original_line:
            continue
        for match in TOKEN_REF_RE.finditer(raw_line):
            name = match.group(1)
            if not _public_token(name) or name in defined_tokens:
                continue
            violations.append(
                TokenReferenceViolation(
                    file=str(path),
                    line=line_num,
                    token=f"--{name}",
                    snippet=original_line.strip(),
                )
            )
    return violations


def run_token_reference_lint(
    tokens_css: Path,
    components_dir: Path,
    pages_dir: Path | None = None,
    extra_files: Iterable[Path] = (),
) -> TokenReferenceLintResult:
    """Scan generated tokens plus source CSS for undefined public token refs.

    ``tokens_css`` is required because it is the definition source. Other inputs
    mirror the source-scanning lints: missing directories log a warning and are
    skipped so a consumer can audit exactly the files it has.
    """
    defined_tokens = _parse_definitions(tokens_css)
    paths = [tokens_css]
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

    violations: list[TokenReferenceViolation] = []
    for path in paths:
        violations.extend(_scan_file(path, defined_tokens))
    if violations:
        return TokenReferenceLintResult.failed(violations)
    return TokenReferenceLintResult.passed()
