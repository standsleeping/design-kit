"""Pairwise contrast audit for CSS tokens.

Enforces TOKEN_PAIR_CONTRAST: every pair of semantic tokens that will appear
adjacent in the rendered UI must remain visually distinguishable in every
theme. Failures are token-level bugs — two tokens collapsing to the same
primitive in one theme, or the wrong token chosen for an adjacency.

Consumers declare their own `Pair` list (the adjacencies they actually
compose) and call `audit()`. `format_report()` renders results as a table.
"""

from __future__ import annotations

import re
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Literal

Theme = Literal["light", "dark"]


_TOKEN_DEF = re.compile(r"--([\w-]+):\s*(.+?);")
_LIGHT_DARK = re.compile(r"light-dark\(\s*(.+?)\s*,\s*(.+?)\s*\)")
_VAR_REF = re.compile(r"var\(\s*--([\w-]+)\s*\)")
_HEX = re.compile(r"^#[0-9A-Fa-f]{3,8}$")


def parse_tokens(css: str) -> dict[str, str]:
    """Collect --name: value; definitions into a flat map.

    Later definitions win (matches CSS cascade for :root declarations in one
    file); good enough for a single-stylesheet check.
    """
    out: dict[str, str] = {}
    for name, raw_value in _TOKEN_DEF.findall(css):
        out[name] = raw_value.strip()
    return out


def resolve(token: str, theme: Theme, tokens: Mapping[str, str]) -> str:
    """Resolve a semantic token to a concrete #hex value in the given theme.

    Follows var() chains and picks the light or dark branch of light-dark().
    Raises ValueError if resolution lands outside the palette (non-hex value).
    """
    seen: set[str] = set()
    value = tokens.get(token)
    if value is None:
        raise ValueError(f"unknown token: --{token}")
    while True:
        if token in seen:
            raise ValueError(f"token cycle through --{token}")
        seen.add(token)

        ld = _LIGHT_DARK.fullmatch(value)
        if ld:
            value = ld.group(1 if theme == "light" else 2).strip()

        ref = _VAR_REF.fullmatch(value)
        if ref:
            token = ref.group(1)
            next_value = tokens.get(token)
            if next_value is None:
                raise ValueError(f"unknown ref: --{token}")
            value = next_value.strip()
            continue

        if _HEX.match(value):
            return value

        raise ValueError(f"--{token} resolved to non-hex value: {value!r}")


def _channel_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def _hex_to_rgb(hex_color: str) -> tuple[float, float, float]:
    h = hex_color.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return (
        int(h[0:2], 16) / 255,
        int(h[2:4], 16) / 255,
        int(h[4:6], 16) / 255,
    )


def relative_luminance(hex_color: str) -> float:
    r, g, b = _hex_to_rgb(hex_color)
    return (
        0.2126 * _channel_to_linear(r)
        + 0.7152 * _channel_to_linear(g)
        + 0.0722 * _channel_to_linear(b)
    )


def contrast_ratio(a: str, b: str) -> float:
    la = relative_luminance(a)
    lb = relative_luminance(b)
    lighter, darker = (la, lb) if la > lb else (lb, la)
    return (lighter + 0.05) / (darker + 0.05)


# Contract floors, chosen for role, not for what happens to pass today:
#
#   4.5   WCAG AA for normal text (14-17px). Readability requirement.
#   3.0   WCAG AA for large text and non-text UI boundaries (1.4.11).
#   2.0   Major structural divider (section border, heavy rule) — clearly visible.
#   1.5   Clear boundary between two surfaces — distinguishable at a glance.
#   1.3   Minor separator (table row divider) — subtle but readable.
#   1.05  Intentionally subtle tint (hover fill, code-bg). Catches the
#         collapse-to-identical case (ratio 1.0) without demanding prominence.
@dataclass(frozen=True, slots=True)
class Pair:
    a: str
    b: str
    min_ratio: float
    reason: str


@dataclass(frozen=True, slots=True)
class Result:
    pair: Pair
    theme: Theme
    value_a: str
    value_b: str
    ratio: float

    @property
    def passed(self) -> bool:
        return self.ratio >= self.pair.min_ratio


def audit(
    tokens: Mapping[str, str],
    pairs: Sequence[Pair],
    themes: Sequence[Theme] = ("light", "dark"),
) -> list[Result]:
    """Resolve each declared pair in each light/dark mode and compute WCAG contrast.

    `tokens` must be the *effective* token map for one palette: a flat mapping
    from token name to raw value (literal hex, `var(...)`, or `light-dark(...)`).
    Use `parse_tokens` on a single-palette stylesheet — or on a slice of a
    multi-palette stylesheet — to produce it. Audit does not parse CSS; that
    boundary belongs to the caller, who is responsible for choosing the right
    scope. Mixing definitions from multiple palettes into one map will
    silently audit a fictional palette.
    """
    results: list[Result] = []
    for pair in pairs:
        for theme in themes:
            va = resolve(pair.a, theme, tokens)
            vb = resolve(pair.b, theme, tokens)
            results.append(
                Result(
                    pair=pair,
                    theme=theme,
                    value_a=va,
                    value_b=vb,
                    ratio=contrast_ratio(va, vb),
                )
            )
    return results


def format_report(results: Sequence[Result]) -> str:
    lines: list[str] = []
    lines.append(
        f"{'PAIR':<50}  {'THEME':<5}  {'A':<8}  {'B':<8}  {'RATIO':>6}  {'MIN':>5}  STATUS"
    )
    lines.append("-" * 100)
    for r in results:
        pair_label = f"--{r.pair.a} x --{r.pair.b}"[:50]
        status = "ok" if r.passed else "FAIL"
        lines.append(
            f"{pair_label:<50}  {r.theme:<5}  {r.value_a:<8}  {r.value_b:<8}  "
            f"{r.ratio:>6.2f}  {r.pair.min_ratio:>5.2f}  {status}"
        )
    return "\n".join(lines)
