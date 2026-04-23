"""Tests for the pairwise contrast audit."""

import pytest

from design_kit.contrast import (
    Pair,
    audit,
    contrast_ratio,
    parse_tokens,
    relative_luminance,
    resolve,
)


def test_parse_tokens_extracts_basic_definitions() -> None:
    """Collects --name: value; pairs into a flat map."""
    css = ":root { --color-a: #ffffff; --color-b: #000000; }"
    assert parse_tokens(css) == {"color-a": "#ffffff", "color-b": "#000000"}


def test_parse_tokens_keeps_light_dark_expression_intact() -> None:
    """Stores the raw value so resolve() can interpret light-dark() branches."""
    css = "--color-bg: light-dark(var(--gray-50), var(--gray-700));"
    tokens = parse_tokens(css)
    assert tokens["color-bg"] == "light-dark(var(--gray-50), var(--gray-700))"


def test_resolve_picks_light_branch() -> None:
    """In light theme, the first arg of light-dark() is returned."""
    tokens = {
        "color-bg": "light-dark(var(--gray-50), var(--gray-700))",
        "gray-50": "#F5F5F5",
        "gray-700": "#181619",
    }
    assert resolve("color-bg", "light", tokens) == "#F5F5F5"


def test_resolve_picks_dark_branch() -> None:
    """In dark theme, the second arg of light-dark() is returned."""
    tokens = {
        "color-bg": "light-dark(var(--gray-50), var(--gray-700))",
        "gray-50": "#F5F5F5",
        "gray-700": "#181619",
    }
    assert resolve("color-bg", "dark", tokens) == "#181619"


def test_resolve_follows_direct_hex() -> None:
    """A token defined as a literal hex value resolves to itself in any theme."""
    tokens = {"color-fixed": "#C0FFEE"}
    assert resolve("color-fixed", "light", tokens) == "#C0FFEE"
    assert resolve("color-fixed", "dark", tokens) == "#C0FFEE"


def test_resolve_raises_on_unknown_token() -> None:
    """Unknown tokens raise ValueError rather than silently returning a default."""
    with pytest.raises(ValueError, match="unknown token"):
        resolve("color-missing", "light", {})


def test_resolve_raises_on_non_hex_leaf() -> None:
    """A token that resolves to a non-hex value (rgb(), named color) is an error."""
    tokens = {"color-weird": "rgb(0, 0, 0)"}
    with pytest.raises(ValueError, match="non-hex"):
        resolve("color-weird", "light", tokens)


def test_contrast_white_on_black_is_21_to_1() -> None:
    """The theoretical maximum: pure white on pure black."""
    assert contrast_ratio("#ffffff", "#000000") == pytest.approx(21.0, abs=0.01)


def test_contrast_identical_colors_is_1_to_1() -> None:
    """Two identical colors have the minimum possible ratio (no contrast)."""
    assert contrast_ratio("#808080", "#808080") == pytest.approx(1.0, abs=0.001)


def test_contrast_is_symmetric() -> None:
    """Order of arguments does not change the ratio."""
    a, b = "#F5F5F5", "#181619"
    assert contrast_ratio(a, b) == pytest.approx(contrast_ratio(b, a), rel=1e-6)


def test_relative_luminance_white_is_1() -> None:
    """Pure white has luminance 1.0 by definition."""
    assert relative_luminance("#ffffff") == pytest.approx(1.0, abs=1e-6)


def test_relative_luminance_black_is_0() -> None:
    """Pure black has luminance 0.0."""
    assert relative_luminance("#000000") == pytest.approx(0.0, abs=1e-6)


def test_audit_runs_declared_pairs_across_themes() -> None:
    """End-to-end: parse → resolve per theme → compute contrast → Result list."""
    css = """
    :root {
      --color-bg: light-dark(var(--gray-50), var(--gray-700));
      --color-text: light-dark(var(--gray-700), var(--gray-50));
      --gray-50: #F5F5F5;
      --gray-700: #181619;
    }
    """
    pairs = [Pair("color-bg", "color-text", 4.5, "body text")]
    results = audit(css, pairs)
    assert len(results) == 2  # one pair × 2 themes
    assert {r.theme for r in results} == {"light", "dark"}
    assert all(r.passed for r in results)


def test_audit_flags_collision_as_failure() -> None:
    """When two tokens resolve to the same primitive in one theme, ratio is 1.0."""
    css = """
    :root {
      --color-a: light-dark(#ffffff, #181619);
      --color-b: light-dark(#f0f0f0, #181619);
    }
    """
    pairs = [Pair("color-a", "color-b", 1.05, "distinct surfaces")]
    results = audit(css, pairs)
    dark = next(r for r in results if r.theme == "dark")
    assert dark.ratio == pytest.approx(1.0, abs=0.001)
    assert not dark.passed
