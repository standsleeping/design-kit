"""Design-kit's palette-level contrast contract.

Declares adjacency pairs that must hold across every theme design-kit ships.
Run from build.py after dist/tokens.css is generated; failures block the build.

Consumers using design-kit's tokens can import `STANDARD_PAIRS` (universal
adjacencies: text, borders, focus, hover, selected) and `CODE_PAIRS` (only
needed if they render syntax-highlighted code blocks) and compose them with
their own local pair lists.
"""

from __future__ import annotations

import re
from pathlib import Path

from design_kit.contrast import Pair, Result, audit, format_report

# Universal adjacencies. Any consumer using design-kit's semantic tokens
# inherits these surfaces, so the audit is meaningful without further
# declaration. Floors follow the vocabulary documented in contrast.py.
STANDARD_PAIRS: tuple[Pair, ...] = (
    # Text readability on page background
    Pair("color-bg", "color-text", 4.5, "body text readable"),
    Pair("color-bg", "color-text-muted", 4.5, "muted text readable"),
    Pair("color-bg", "color-link", 4.5, "link readable"),
    # Structural separators against page background
    Pair("color-bg", "color-border", 1.3, "minor separator visible"),
    Pair("color-bg", "color-hover-bg", 1.05, "hover fill distinct from page"),
    Pair("color-bg", "color-selected-bg", 1.05, "selected fill distinct from page"),
    Pair("color-bg", "color-accent-bg", 1.05, "accent tint distinct from page"),
    Pair("color-bg", "color-focus-ring", 3.0, "focus ring WCAG 1.4.11"),
    Pair(
        "color-bg", "color-focus-ring-light", 1.05, "selection tint distinct from page"
    ),
    # Hover state composition — the regression vector TOKEN_PAIR_CONTRAST names
    Pair(
        "color-hover-bg",
        "color-hover-outline",
        1.5,
        "hover outline visible on hover fill",
    ),
    Pair("color-hover-bg", "color-text", 4.5, "text readable on hover"),
    Pair("color-hover-bg", "color-link", 4.5, "link readable on hover"),
    # Selected state composition — same contract, different surface
    Pair(
        "color-selected-bg",
        "color-hover-outline",
        1.5,
        "selected outline visible on selected fill",
    ),
    Pair("color-selected-bg", "color-text", 4.5, "text readable on selected"),
)


# Code-block adjacencies. Split from STANDARD_PAIRS because consumers that
# don't render code shouldn't need to define --color-code-bg or
# --color-syntax-* — `audit()` errors on unknown tokens, so the split lets
# them opt in.
CODE_PAIRS: tuple[Pair, ...] = (
    Pair("color-code-bg", "color-text", 4.5, "code text readable"),
    Pair("color-code-bg", "color-syntax-keyword", 4.5, "keyword readable"),
    Pair("color-code-bg", "color-syntax-string", 4.5, "string literal readable"),
    Pair("color-code-bg", "color-syntax-function", 4.5, "function name readable"),
    Pair("color-code-bg", "color-syntax-comment", 3.0, "comment readable (softer)"),
    Pair("color-code-bg", "color-syntax-punctuation", 3.0, "punctuation readable"),
)


# Design-kit ships every token in its bundled themes, so the self-audit
# composes both sets.
_SELF_PAIRS: tuple[Pair, ...] = STANDARD_PAIRS + CODE_PAIRS


# Per-theme floor overrides. A theme may declare that specific pairs hold at
# a lower ratio than SELF_PAIRS' default, when the relaxation reflects the
# theme's design intent rather than a palette bug.
#
# solarized: the Ethan Schoonover palette is spec'd with a low-contrast,
# sepia-toned design language. Primary text sits at ~4:1 (just under WCAG AA)
# and tertiary/muted content at ~2:1 by design. Auditing it against strict
# AA thresholds produces noise, not signal. These overrides encode solarized's
# actual contract.
_THEME_FLOOR_OVERRIDES: dict[str, dict[tuple[str, str], float]] = {
    "solarized": {
        ("color-bg", "color-text"): 3.5,
        ("color-bg", "color-text-muted"): 2.0,
        ("color-bg", "color-link"): 3.0,
        ("color-bg", "color-border"): 1.1,
        ("color-hover-bg", "color-text"): 3.5,
        ("color-hover-bg", "color-link"): 2.9,
        ("color-selected-bg", "color-text"): 3.5,
        ("color-code-bg", "color-text"): 3.5,
        ("color-code-bg", "color-syntax-keyword"): 2.5,
        ("color-code-bg", "color-syntax-string"): 2.5,
        ("color-code-bg", "color-syntax-function"): 2.9,
        ("color-code-bg", "color-syntax-comment"): 2.0,
    },
}


def _pairs_for_theme(theme: str) -> tuple[Pair, ...]:
    """Return _SELF_PAIRS with any theme-specific floor relaxations applied."""
    overrides = _THEME_FLOOR_OVERRIDES.get(theme)
    if not overrides:
        return _SELF_PAIRS
    return tuple(
        Pair(p.a, p.b, overrides.get((p.a, p.b), p.min_ratio), p.reason)
        for p in _SELF_PAIRS
    )


_ROOT_BLOCK = re.compile(r":root\s*\{([^}]*)\}", re.DOTALL)
_THEME_BLOCK_TEMPLATE = r'\[data-color-theme="{name}"\]\s*\{{([^}}]*)\}}'
_THEME_SELECTOR = re.compile(r'\[data-color-theme="([^"]+)"\]')
_THEME_NAME_DECL = re.compile(r'--theme-name:\s*"([^"]+)"')


def _extract_block(css: str, pattern: re.Pattern[str]) -> str:
    match = pattern.search(css)
    if match is None:
        raise ValueError(f"block not found matching {pattern.pattern!r}")
    return match.group(1)


def _discover_themes(css: str) -> tuple[str, tuple[str, ...]]:
    """Derive (default_theme, override_themes) from the CSS itself.

    The default theme's name is declared as `--theme-name: "<name>";` inside
    :root by token_css; override themes appear as `[data-color-theme="<name>"]`
    selectors. Reading both from the CSS means adding, renaming, or removing a
    theme in design-tokens.json is reflected automatically.
    """
    root_block = _extract_block(css, _ROOT_BLOCK)
    default_match = _THEME_NAME_DECL.search(root_block)
    if default_match is None:
        raise ValueError("contrast self-test: :root is missing --theme-name")
    default = default_match.group(1)
    overrides = tuple(dict.fromkeys(_THEME_SELECTOR.findall(css)))
    return default, overrides


def _theme_css(css: str, theme: str, default_theme: str) -> str:
    """Build a self-contained CSS string for one theme: primitives + overrides.

    `parse_tokens` is selector-blind (later definitions win), so we concatenate
    :root (which carries all primitives and the default theme's semantics) with
    the theme's override block when auditing a non-default theme.
    """
    root = _extract_block(css, _ROOT_BLOCK)
    if theme == default_theme:
        return root
    override_pattern = re.compile(_THEME_BLOCK_TEMPLATE.format(name=theme), re.DOTALL)
    override = _extract_block(css, override_pattern)
    return root + "\n" + override


def run(css_path: Path) -> tuple[list[Result], str]:
    """Audit the built tokens.css across every bundled theme.

    Returns (all_results, report_text). The caller decides how to present
    failures; this function is side-effect-free so it can be tested.
    """
    css = css_path.read_text(encoding="utf-8")
    default_theme, override_themes = _discover_themes(css)
    themes = (default_theme, *override_themes)
    all_results: list[Result] = []
    report_sections: list[str] = []
    for theme in themes:
        theme_css = _theme_css(css, theme, default_theme)
        results = audit(theme_css, _pairs_for_theme(theme))
        all_results.extend(results)
        report_sections.append(f"=== theme: {theme} ===\n{format_report(results)}")
    return all_results, "\n\n".join(report_sections)


def main(css_path: Path) -> int:
    results, report = run(css_path)
    failures = [r for r in results if not r.passed]
    if failures:
        print(report)
        print()
        print(f"{len(failures)} pair(s) below their declared minimum:")
        for f in failures:
            print(
                f"  --{f.pair.a} x --{f.pair.b} ({f.theme}): "
                f"{f.ratio:.2f} < {f.pair.min_ratio} - {f.pair.reason}"
            )
        return 1
    return 0
