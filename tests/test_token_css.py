"""Tests for token CSS generation."""

from __future__ import annotations

import json
from pathlib import Path
from typing import TYPE_CHECKING

import pytest

from design_kit.token_css import generate_token_css

if TYPE_CHECKING:
    from collections.abc import Mapping

TOKENS_PATH = Path(__file__).parent.parent / "tokens" / "design-tokens.json"


def _write_tokens(tmp_path: Path, data: Mapping[str, object]) -> Path:
    path = tmp_path / "tokens.json"
    path.write_text(json.dumps(data), encoding="utf-8")
    return path


def test_multi_theme_emits_root_and_override_blocks(tmp_path: Path) -> None:
    """Default theme lands on :root; non-default themes emit as [data-color-theme] overrides."""
    tokens = {
        "primitive": {
            "color": {
                "gray": {"50": "#fafafa", "900": "#111111"},
                "blue": {"500": "#0000ff"},
            },
            "font": {"family": "monospace"},
            "breakpoint": {"tablet": "600px"},
        },
        "semantic": {
            "default-theme": "alpha",
            "typography": {"body": "{font.family}"},
            "themes": {
                "alpha": {
                    "luminance": {
                        "light": {
                            "color": {
                                "bg": "{color.gray.50}",
                                "link": "{color.blue.500}",
                            }
                        },
                        "dark": {
                            "color": {
                                "bg": "{color.gray.900}",
                                "link": "{color.blue.500}",
                            }
                        },
                    }
                },
                "beta": {
                    "luminance": {
                        "light": {
                            "color": {
                                "bg": "{color.gray.900}",
                                "link": "{color.gray.50}",
                            }
                        },
                    }
                },
            },
        },
    }
    css = generate_token_css(_write_tokens(tmp_path, tokens))

    assert "color-scheme: light dark;" in css
    assert '--theme-name: "alpha";' in css
    assert "--color-bg: light-dark(var(--color-gray-50), var(--color-gray-900));" in css

    assert '[data-color-theme="beta"]' in css
    assert '--theme-name: "beta";' in css
    assert "--color-bg: var(--color-gray-900);" in css

    assert '[data-luminance="dark"] { color-scheme: dark; }' in css
    assert '[data-luminance="light"] { color-scheme: light; }' in css

    # beta is not a default block on :root; alpha should not leak into beta's selector
    beta_block_start = css.index('[data-color-theme="beta"]')
    beta_block_end = css.index("}", beta_block_start)
    beta_block = css[beta_block_start:beta_block_end]
    assert "color-scheme" not in beta_block


def test_declares_full_cascade_contract() -> None:
    """tokens.css declares every public layer slot, including build-wrapped CSS."""
    css = generate_token_css(TOKENS_PATH)

    assert (
        "@layer reset, tokens, defaults, utilities, components, pages, overrides;"
        in css
    )


def test_emits_font_faces_and_split_family_tokens() -> None:
    """tokens.css declares the self-hosted Recursive face plus two metric-matched fallback
    faces, and splits the family token into mono (UI/headings) and prose (body) so the
    pre-swap fallback matches the axis each role renders at."""
    css = generate_token_css(TOKENS_PATH)

    # Real face: variable weight range, same-origin vendored woff2.
    assert "font-weight: 300 1000;" in css
    assert 'url("fonts/Recursive_VF.woff2") format("woff2")' in css

    # Two metric-matched fallbacks, each over a web-safe local with overrides.
    assert 'font-family: "Recursive-fallback-mono";' in css
    assert 'src: local("Courier New");' in css
    assert 'font-family: "Recursive-fallback-prose";' in css
    assert 'src: local("Arial");' in css
    assert "size-adjust:" in css
    assert "ascent-override:" in css
    assert "descent-override:" in css

    # Split family tokens, mapped: prose drives body, mono drives UI and headings.
    assert '--font-family-mono: "Recursive", "Recursive-fallback-mono"' in css
    assert '--font-family-prose: "Recursive", "Recursive-fallback-prose"' in css
    assert "--typography-body: var(--font-family-prose);" in css
    assert "--typography-heading: var(--font-family-mono);" in css
    assert "--typography-mono: var(--font-family-mono);" in css


def test_visually_hidden_uses_modern_clipping() -> None:
    """The accessibility utility should avoid the deprecated clip: rect() recipe."""
    css = generate_token_css(TOKENS_PATH)

    assert "clip: rect(" not in css
    assert ".visually-hidden { position: absolute; inline-size: 1px;" in css
    assert "overflow: clip; clip-path: inset(50%);" in css
    assert ".visually-hidden:focus-visible" in css
    assert "clip-path: none;" in css


def test_form_control_reset_uses_standard_appearance() -> None:
    """Use the standardized appearance property, not legacy prefixed duplicates."""
    css = generate_token_css(TOKENS_PATH)

    assert "-webkit-appearance" not in css
    assert "-moz-appearance" not in css
    assert 'input[type="number"] { appearance: textfield;' in css
    assert (
        'input[type="search"]::-webkit-search-cancel-button { appearance: none; }'
        in css
    )


def test_reset_uses_standard_text_size_adjust_without_font_smoothing() -> None:
    """Avoid non-standard browser-specific text rendering knobs in the reset."""
    css = generate_token_css(TOKENS_PATH)

    assert "-webkit-text-size-adjust" not in css
    assert "font-smoothing" not in css
    assert "html { text-size-adjust: 100%;" in css


def test_validation_rejects_theme_missing_luminance(tmp_path: Path) -> None:
    """A theme without luminance.light.color raises a pointed ValueError."""
    tokens = {
        "primitive": {"color": {"gray": {"50": "#fafafa"}}},
        "semantic": {
            "default-theme": "alpha",
            "themes": {"alpha": {}},
        },
    }
    with pytest.raises(ValueError, match=r"theme 'alpha'.*luminance"):
        generate_token_css(_write_tokens(tmp_path, tokens))


def test_validation_rejects_unknown_default_theme(tmp_path: Path) -> None:
    """Naming a default-theme that isn't in themes raises a pointed ValueError."""
    tokens = {
        "primitive": {"color": {"gray": {"50": "#fafafa"}}},
        "semantic": {
            "default-theme": "missing",
            "themes": {
                "alpha": {
                    "luminance": {
                        "light": {"color": {"bg": "{color.gray.50}"}},
                    }
                },
            },
        },
    }
    with pytest.raises(ValueError, match="default-theme 'missing'"):
        generate_token_css(_write_tokens(tmp_path, tokens))
