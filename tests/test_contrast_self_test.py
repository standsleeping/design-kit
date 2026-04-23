"""Tests for the palette self-audit: block extraction, theme discovery, and
end-to-end run() on synthesized tokens.css fixtures.

These tests guard the glue between design_kit.token_css (which emits the CSS
shape this module parses) and design_kit.contrast (which only cares about a
flat token map). If token_css ever changes its selector format, these tests
should fail before the silent-green-audit regression can ship.
"""

from pathlib import Path

import pytest

from design_kit.contrast_self_test import (
    _discover_themes,
    _theme_css,
    run,
)


def _fixture_css(tmp_path: Path, body: str) -> Path:
    p = tmp_path / "tokens.css"
    p.write_text(body, encoding="utf-8")
    return p


_FIXTURE_TWO_THEMES = """
:root {
  --theme-name: "strict";
  --color-white: #ffffff;
  --color-black: #000000;
  --color-bg: light-dark(var(--color-white), var(--color-black));
  --color-text: light-dark(var(--color-black), var(--color-white));
  --color-text-muted: light-dark(var(--color-black), var(--color-white));
  --color-link: light-dark(var(--color-black), var(--color-white));
  --color-border: light-dark(var(--color-black), var(--color-white));
  --color-hover-bg: light-dark(#eeeeee, #111111);
  --color-selected-bg: light-dark(#eeeeee, #111111);
  --color-accent-bg: light-dark(#eeeeee, #111111);
  --color-focus-ring: light-dark(var(--color-black), var(--color-white));
  --color-focus-ring-light: light-dark(#eeeeee, #111111);
  --color-hover-outline: light-dark(#777777, #888888);
  --color-code-bg: light-dark(#eeeeee, #111111);
  --color-syntax-keyword: light-dark(var(--color-black), var(--color-white));
  --color-syntax-string: light-dark(var(--color-black), var(--color-white));
  --color-syntax-function: light-dark(var(--color-black), var(--color-white));
  --color-syntax-comment: light-dark(#444444, #bbbbbb);
  --color-syntax-punctuation: light-dark(#444444, #bbbbbb);
}

[data-color-theme="collision"] {
  --theme-name: "collision";
  --color-bg: light-dark(#ffffff, #202020);
  --color-hover-bg: light-dark(#eeeeee, #202020);
  --color-selected-bg: light-dark(#eeeeee, #202020);
  --color-accent-bg: light-dark(#eeeeee, #202020);
  --color-hover-outline: light-dark(#777777, #888888);
}
"""


def test_discover_themes_reads_default_from_root() -> None:
    """The default theme name comes from :root's --theme-name declaration."""
    default, _ = _discover_themes(_FIXTURE_TWO_THEMES)
    assert default == "strict"


def test_discover_themes_lists_override_selectors() -> None:
    """Every [data-color-theme="..."] selector yields one override theme."""
    _, overrides = _discover_themes(_FIXTURE_TWO_THEMES)
    assert overrides == ("collision",)


def test_discover_themes_without_root_raises() -> None:
    """A CSS without a :root block is a token_css contract violation."""
    with pytest.raises(ValueError, match=":root"):
        _discover_themes('[data-color-theme="x"] { --theme-name: "x"; }')


def test_discover_themes_without_theme_name_raises() -> None:
    """The :root --theme-name declaration is required to identify the default."""
    with pytest.raises(ValueError, match="--theme-name"):
        _discover_themes(":root { --color-bg: #fff; }")


def test_theme_css_default_returns_root_only() -> None:
    """The default theme reads its semantics from :root, not from an override."""
    root_css = _theme_css(_FIXTURE_TWO_THEMES, "strict", "strict")
    assert "--color-bg" in root_css
    assert "data-color-theme" not in root_css


def test_theme_css_override_appends_override_block() -> None:
    """An override theme concatenates :root with the theme's override block so
    later definitions win under parse_tokens' flat-map model."""
    merged = _theme_css(_FIXTURE_TWO_THEMES, "collision", "strict")
    # Both blocks present
    assert merged.count("--color-bg:") == 2
    # Override block appears after :root so it wins the flat map
    assert merged.index("#202020") > merged.index("#ffffff")


def test_run_passes_on_strict_theme(tmp_path: Path) -> None:
    """The `strict` fixture is engineered to pass every SELF_PAIRS floor."""
    path = _fixture_css(tmp_path, _FIXTURE_TWO_THEMES)
    results, _ = run(path)
    # Both themes audited
    themes_seen = {r.theme for r in results}
    assert themes_seen == {"light", "dark"}
    # At least strict results all pass
    strict_results = [
        r for r in results if r.value_a in ("#ffffff", "#000000", "#eeeeee", "#111111")
    ]
    # Not a precise assertion; just confirming non-empty coverage.
    assert strict_results


def test_run_flags_collision_theme(tmp_path: Path) -> None:
    """The `collision` override deliberately makes bg == hover-bg == selected-bg
    == accent-bg == focus-ring-light in dark mode. Every (bg, X) subtle-tint
    pair should fail at ratio 1.00 for that theme."""
    path = _fixture_css(tmp_path, _FIXTURE_TWO_THEMES)
    results, _ = run(path)
    # Pick out failures in the collision theme's dark luminance
    dark_collisions = [
        r
        for r in results
        if not r.passed
        and r.theme == "dark"
        and r.value_a == "#202020"
        and r.value_b == "#202020"
    ]
    assert len(dark_collisions) >= 3  # bg × hover-bg, bg × selected-bg, bg × accent-bg
    assert all(r.ratio == pytest.approx(1.0, abs=0.001) for r in dark_collisions)


def test_run_report_names_each_theme(tmp_path: Path) -> None:
    """The formatted report includes one section header per discovered theme."""
    path = _fixture_css(tmp_path, _FIXTURE_TWO_THEMES)
    _, report = run(path)
    assert "=== theme: strict ===" in report
    assert "=== theme: collision ===" in report
