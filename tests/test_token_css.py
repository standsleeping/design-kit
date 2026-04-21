"""Tests for token CSS generation."""

from __future__ import annotations

import json
from collections.abc import Mapping
from pathlib import Path

import pytest

from design_kit.token_css import generate_token_css


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


def test_validation_rejects_theme_missing_luminance(tmp_path: Path) -> None:
    """A theme without luminance.light.color raises a pointed ValueError."""
    tokens = {
        "primitive": {"color": {"gray": {"50": "#fafafa"}}},
        "semantic": {
            "default-theme": "alpha",
            "themes": {"alpha": {}},
        },
    }
    with pytest.raises(ValueError, match="theme 'alpha'.*luminance"):
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
