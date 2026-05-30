"""Static scan of CSS for layout-dimension literals that should be tokens.

Static-analysis corollary of TOKEN_DRIVEN_DESIGN / JUSTIFY_EVERY_DIMENSION
applied to layout dimensions: heights, widths, gaps, font sizes, flex bases,
and position offsets must reference ``var(--*)`` tokens rather than raw
``px``/``em``/``rem``/``ch`` literals. Hardcoded dimensions are silent drift
surface. Change the token, the literal sites stay frozen.

Properties scanned: physical and logical sizes (``width`` / ``inline-size``,
``height`` / ``block-size``, min/max variants), ``gap`` / ``row-gap`` /
``column-gap``, ``font-size``, ``flex-basis``, physical and logical offsets
(``top`` / ``inset-block-start`` and peers), and scroll margin/padding offsets.
Properties already owned by another lint (``padding``, ``margin``,
``border``/``border-width``, ``border-radius``, color) are out of scope and
handled by their respective lints.

Permitted literal values (do not flag):

* ``0`` with or without a unit: zero is zero.
* ``auto``: layout-algorithm hook.
* Percentages: layout fractions, not magic numbers.
* Container-query units (``cqw``/``cqi``/``cqh``/``cqb``/``cqmin``/``cqmax``)
  and viewport units (``vw``/``vh``/``vi``/``vb``/``vmin``/``vmax`` and the
  small/large/dynamic variants): relative to the viewport or container,
  by definition not a token-design decision.
* ``lh`` / ``rlh``: line-height-relative, the natural unit for
  typographic rhythm inside a known type scale.
* ``fr``: grid fractional unit.
* ``var(--*)``, ``env(*)``, ``calc(...)``, ``min(...)``, ``max(...)``,
  ``clamp(...)`` as wrappers; the lint looks at the literal numbers
  *inside* those expressions independently.

Inputs mirror the other lints: ``components/*.css`` always;
``pages/*.html`` ``<style>`` blocks when ``pages_dir`` is provided; any
``extra_files`` (typically ``preview.py``) scanned as plain text. A
trailing ``/* dimension-lint: ok */`` comment allowlists a single line.

Scope notes:

* CSS custom property assignments (``--dk-sidebar-width: 220px``) are not
  flagged: the leading hyphen fails the property regex's negative
  lookbehind. Token consumers parameterizing a component are out of scope;
  the lint targets value-side magic numbers.
* ``@media (width <= 600px)`` and ``@container (inline-size <= 200px)``
  preludes are stripped before scanning so the breakpoint literal does
  not false-positive as a width declaration. Breakpoints belong
  at a separate token layer (CSS variables don't resolve inside media
  queries) and are tracked elsewhere.
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

# Properties whose dimension values this lint owns. Padding/margin/border/
# border-radius and color are handled by their dedicated lints.
_PROPERTIES = (
    "width",
    "min-width",
    "max-width",
    "inline-size",
    "min-inline-size",
    "max-inline-size",
    "height",
    "min-height",
    "max-height",
    "block-size",
    "min-block-size",
    "max-block-size",
    "gap",
    "row-gap",
    "column-gap",
    "font-size",
    "flex-basis",
    "top",
    "right",
    "bottom",
    "left",
    "inset",
    "inset-block",
    "inset-block-start",
    "inset-block-end",
    "inset-inline",
    "inset-inline-start",
    "inset-inline-end",
    "scroll-margin-top",
    "scroll-margin-right",
    "scroll-margin-bottom",
    "scroll-margin-left",
    "scroll-margin-block",
    "scroll-margin-block-start",
    "scroll-margin-block-end",
    "scroll-margin-inline",
    "scroll-margin-inline-start",
    "scroll-margin-inline-end",
    "scroll-padding-top",
    "scroll-padding-right",
    "scroll-padding-bottom",
    "scroll-padding-left",
    "scroll-padding-block",
    "scroll-padding-block-start",
    "scroll-padding-block-end",
    "scroll-padding-inline",
    "scroll-padding-inline-start",
    "scroll-padding-inline-end",
)
# Match a dimension declaration. Captures the property name in group 1 and
# the value (up to ; or end-of-rule) in group 2. The negative lookbehind
# keeps ``--dk-sidebar-width:`` (a custom-property assignment) and
# longer property names ending in one of the scanned roots from matching.
DIMENSION_DECL_RE = re.compile(
    r"(?<![\w-])(" + "|".join(_PROPERTIES) + r")\s*:\s*([^;}]+?)\s*(?:;|$)",
    re.MULTILINE,
)
# A numeric literal with a length unit that is *not* viewport- or
# container-relative and *not* a grid/line-height/percentage. ``\b`` at the
# end keeps ``rem`` from matching inside ``rems`` etc.
LENGTH_LITERAL_RE = re.compile(r"\b(\d+(?:\.\d+)?)(px|em|rem|ch|ex|pt|pc|cm|mm|in)\b")
# Block comment stripper.
COMMENT_RE = re.compile(r"/\*.*?\*/", flags=re.DOTALL)
# HTML <style>...</style> block extractor (case-insensitive, multiline).
STYLE_BLOCK_RE = re.compile(
    r"<style[^>]*>(.*?)</style>", flags=re.DOTALL | re.IGNORECASE
)
# At-rule prelude (``@media``, ``@container``, ``@supports``) up to but not
# including the opening ``{``. Blanked before scanning so breakpoint
# literals inside the parens don't look like property declarations.
AT_RULE_PRELUDE_RE = re.compile(
    r"@(?:media|container|supports)\b[^{]*", flags=re.IGNORECASE
)
ALLOWLIST_MARKER = "dimension-lint: ok"


class DimensionLintOutcome(Enum):
    PASSED = "passed"
    FAILED = "failed"


@dataclass(frozen=True)
class DimensionViolation:
    file: str
    line: int
    snippet: str
    declaration: str
    literal: str


@dataclass(frozen=True)
class DimensionLintResult:
    outcome: DimensionLintOutcome
    violations: list[DimensionViolation]

    @classmethod
    def passed(cls) -> DimensionLintResult:
        return cls(outcome=DimensionLintOutcome.PASSED, violations=[])

    @classmethod
    def failed(cls, violations: list[DimensionViolation]) -> DimensionLintResult:
        return cls(outcome=DimensionLintOutcome.FAILED, violations=violations)


def _blank_preserving_newlines(text: str) -> str:
    return re.sub(r"[^\n]", " ", text)


def _html_to_css_text(html: str) -> str:
    """Blank everything outside <style>...</style> while preserving newlines."""
    out: list[str] = []
    pos = 0
    for m in STYLE_BLOCK_RE.finditer(html):
        out.append(_blank_preserving_newlines(html[pos : m.start(1)]))
        out.append(m.group(1))
        pos = m.end(1)
    out.append(_blank_preserving_newlines(html[pos:]))
    return "".join(out)


def _strip_at_rule_preludes(text: str) -> str:
    """Blank the ``@media (...)``/``@container (...)`` prelude up to ``{``.

    The opening brace is preserved so block structure is intact; only the
    prelude contents (which can contain property-looking width checks) are
    blanked.
    """
    return AT_RULE_PRELUDE_RE.sub(
        lambda m: _blank_preserving_newlines(m.group(0)),
        text,
    )


def _scan_file(path: Path) -> list[DimensionViolation]:
    text = path.read_text(encoding="utf-8")
    if path.suffix == ".html":
        text = _html_to_css_text(text)
    scanned = COMMENT_RE.sub(
        lambda m: _blank_preserving_newlines(m.group(0)),
        text,
    )
    scanned = _strip_at_rule_preludes(scanned)
    original_lines = text.splitlines()
    violations: list[DimensionViolation] = []
    for line_num, raw_line in enumerate(scanned.splitlines(), start=1):
        original_line = (
            original_lines[line_num - 1] if line_num - 1 < len(original_lines) else ""
        )
        if ALLOWLIST_MARKER in original_line:
            continue
        for decl_match in DIMENSION_DECL_RE.finditer(raw_line):
            value = decl_match.group(2)
            for lit_match in LENGTH_LITERAL_RE.finditer(value):
                number = lit_match.group(1)
                if float(number) == 0.0:
                    continue
                violations.append(
                    DimensionViolation(
                        file=str(path),
                        line=line_num,
                        snippet=original_line.strip(),
                        declaration=decl_match.group(1),
                        literal=lit_match.group(0),
                    )
                )
    return violations


def run_dimension_lint(
    components_dir: Path,
    pages_dir: Path | None = None,
    extra_files: Iterable[Path] = (),
) -> DimensionLintResult:
    """Scan component CSS, page ``<style>`` blocks, and any extra files for
    raw layout-dimension literals. Each input is optional; missing inputs
    log a warning and are skipped."""
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
    all_violations: list[DimensionViolation] = []
    for path in paths:
        all_violations.extend(_scan_file(path))
    if all_violations:
        return DimensionLintResult.failed(all_violations)
    return DimensionLintResult.passed()
