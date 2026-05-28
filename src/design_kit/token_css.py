"""Generate tokens.css from design-tokens.json."""

from __future__ import annotations

import json
from typing import TYPE_CHECKING

from design_kit.breakpoints import load_breakpoints, substitute_breakpoints

if TYPE_CHECKING:
    from pathlib import Path


def _validate_tokens_shape(data: dict[str, object]) -> None:
    """Raise ValueError at the JSON boundary if the shape is malformed.

    Expected shape (see `tokens/design-tokens.json` for a full example):
        {
          "primitive": { ... },
          "semantic": {
            "default-theme"?: str,
            "typography"?: {...}, "layout"?: {...},
            "themes": {
              "<name>": {
                "luminance": {
                  "light": {"color": {...}},
                  "dark"?: {"color": {...}}
                }
              }, ...
            }
          }
        }

    Checks presence and nesting only; does not validate token-value syntax.
    Errors point at the first missing key by path so misconfigurations
    surface here rather than deeper in the CSS emitter.
    """
    if not isinstance(data.get("primitive"), dict):
        raise ValueError("design-tokens.json: missing 'primitive' object")
    semantic = data.get("semantic")
    if not isinstance(semantic, dict):
        raise ValueError("design-tokens.json: missing 'semantic' object")
    themes = semantic.get("themes")
    if not isinstance(themes, dict) or not themes:
        raise ValueError(
            "design-tokens.json: 'semantic.themes' must be a non-empty object"
        )
    for name, theme in themes.items():
        if not isinstance(theme, dict):
            raise ValueError(f"design-tokens.json: theme '{name}' must be an object")
        luminance = theme.get("luminance")
        if not isinstance(luminance, dict):
            raise ValueError(
                f"design-tokens.json: theme '{name}' missing 'luminance' object"
            )
        light = luminance.get("light")
        if not isinstance(light, dict) or not isinstance(light.get("color"), dict):
            raise ValueError(
                f"design-tokens.json: theme '{name}' missing 'luminance.light.color'"
            )
        if "dark" in luminance:
            dark = luminance.get("dark")
            if not isinstance(dark, dict) or not isinstance(dark.get("color"), dict):
                raise ValueError(
                    f"design-tokens.json: theme '{name}' has malformed 'luminance.dark'"
                )
    default = semantic.get("default-theme")
    if default is not None and default not in themes:
        raise ValueError(
            f"design-tokens.json: default-theme '{default}' not in 'semantic.themes'"
        )


# Self-hosted Recursive variable font + two metric-matched fallback faces.
#
# Recursive is the brand font (5 axes: MONO, CASL, wght, slnt, CRSV), loaded once
# here so every page serves it from the same origin (no Google Fonts dependency).
# Axes other than weight are driven at use time via `font-variation-settings`
# (see RESET_LAYER and the `--mono`/`--casl`/`--slnt`/`--crsv` cascade); the face
# only declares the variable `font-weight` range, leaving `slnt` to the axis so a
# comment's `--slnt: -12` still slants the self-hosted face.
#
# The two fallback faces are metric-matched to Recursive so first paint (before the
# woff2 decodes) is shift-free (NO_FIRST_PAINT_FLASH): the fallback's line box and
# average advance width equal Recursive's, so the swap produces ~0 layout shift.
# Mono vs proportional is the MONO axis, not a family, and the system locals have no
# MONO axis, so the match needs two faces selected per family token:
#   --font-family-mono  -> Recursive-fallback-mono  ~ Recursive MONO 1 over "Courier New"
#   --font-family-prose -> Recursive-fallback-prose ~ Recursive MONO 0 over "Arial"
#
# Override values are reproducible (recompute if the woff2 is revendored):
#   1. Instantiate the VF at {wght:400, CASL:0, slnt:0, CRSV:0} with MONO 1 and MONO 0
#      via `fontTools.varLib.instancer` -> two static cuts.
#   2. xWidthAvg of each cut via `@capsizecss/unpack` fromBuffer; Arial / Courier New
#      metrics from `@capsizecss/metrics`; overrides via the Capsize formula
#        size-adjust       = (pref.xWidthAvg/pref.upm) / (fb.xWidthAvg/fb.upm)
#        {ascent,descent,line-gap}-override = pref.metric / (pref.upm * size-adjust)
#   Inputs: Recursive upm 1000, ascent 950, descent -250, lineGap 0;
#   xWidthAvg MONO 1 = 600, MONO 0 = 510. Arial upm 2048 xWidthAvg 913;
#   Courier New upm 2048 xWidthAvg 1229.
FONT_FACE = """\
@font-face {
  font-family: "Recursive";
  font-weight: 300 1000;
  font-style: normal;
  font-display: swap;
  src: url("fonts/Recursive_VF.woff2") format("woff2");
}
@font-face {
  font-family: "Recursive-fallback-mono";
  src: local("Courier New");
  size-adjust: 99.9837%;
  ascent-override: 95.0155%;
  descent-override: 25.0041%;
  line-gap-override: 0%;
}
@font-face {
  font-family: "Recursive-fallback-prose";
  src: local("Arial");
  size-adjust: 114.4009%;
  ascent-override: 83.0413%;
  descent-override: 21.8530%;
  line-gap-override: 0%;
}"""

# Path (relative to the generated tokens.css) of the woff2 that FONT_FACE points at.
# Shared with the build's font-preload injection so the preload href and the
# @font-face src cannot drift (GENERATE_INVARIANTS_LINT_VARIATION).
FONT_WOFF2_HREF = "fonts/Recursive_VF.woff2"


def _flatten_primitives(
    obj: dict[str, object], prefix: str = ""
) -> list[tuple[str, str]]:
    """Flatten nested token dict into (css-name, value) pairs.

    Example: {"color": {"stone": {"50": "#fafaf9"}}}
    becomes: [("color-stone-50", "#fafaf9")]
    """
    pairs: list[tuple[str, str]] = []
    for key, value in obj.items():
        name = f"{prefix}-{key}" if prefix else key
        if isinstance(value, dict):
            pairs.extend(_flatten_primitives(value, name))
        else:
            pairs.append((name, str(value)))
    return pairs


def _resolve_ref(ref: str) -> str:
    """Convert a token reference like {color.stone.50} to var(--color-stone-50)."""
    inner = ref.strip("{}")
    css_name = inner.replace(".", "-")
    return f"var(--{css_name})"


def _flatten_semantics(
    obj: dict[str, object], prefix: str = ""
) -> list[tuple[str, str]]:
    """Flatten semantic tokens into (css-name, resolved-value) pairs.

    Semantic names include their category prefix:
    {"color": {"bg": "{color.stone.50}"}} → ("color-bg", "var(--color-stone-50)")
    """
    pairs: list[tuple[str, str]] = []
    for key, value in obj.items():
        name = f"{prefix}-{key}" if prefix else key
        if isinstance(value, dict):
            pairs.extend(_flatten_semantics(value, name))
        elif isinstance(value, str) and value.startswith("{") and value.endswith("}"):
            pairs.append((name, _resolve_ref(value)))
        else:
            pairs.append((name, str(value)))
    return pairs


def _emit_color_tokens(
    light: list[tuple[str, str]],
    dark: list[tuple[str, str]] | None,
    indent: str,
) -> list[str]:
    """Emit color semantic tokens as light-dark() declarations.

    Tokens present in both light and dark are paired via light-dark();
    light-only tokens are emitted as-is.
    """
    dark_map = dict(dark) if dark else {}
    lines: list[str] = []
    for name, value in light:
        if name in dark_map:
            lines.append(f"{indent}--{name}: light-dark({value}, {dark_map[name]});")
        else:
            lines.append(f"{indent}--{name}: {value};")
    return lines


def _build_tokens_layer(
    primitives: list[tuple[str, str]],
    base_semantics: list[tuple[str, str]],
    themes: list[tuple[str, list[tuple[str, str]], list[tuple[str, str]] | None]],
    default_theme: str | None = None,
) -> str:
    """Build the @layer tokens block with :root and per-theme custom properties.

    The default theme's color tokens live on :root alongside primitives and
    typography/layout aliases. Non-default themes emit as
    [data-color-theme="<name>"] blocks that override :root. Within each
    theme block, color tokens are emitted as light-dark() so a single
    declaration carries both luminance modes. color-scheme (set via OS
    preference on :root, or forced by [data-luminance]) picks which branch
    resolves at use time.
    """
    default_block = next(
        (t for t in themes if t[0] == default_theme), themes[0] if themes else None
    )
    has_any_dark = any(t[2] for t in themes)

    lines = ["@layer tokens {", "  :root {", "    color-scheme: light dark;"]
    if default_block:
        lines.append(f'    --theme-name: "{default_block[0]}";')

    current_category = ""
    for name, value in primitives:
        category = name.split("-")[0]
        if category != current_category:
            if current_category:
                lines.append("")
            lines.append(f"    /* {category} primitives */")
            current_category = category
        lines.append(f"    --{name}: {value};")

    if base_semantics:
        lines.append("")
        lines.append("    /* semantic aliases: base */")
        for name, value in base_semantics:
            lines.append(f"    --{name}: {value};")

    if default_block:
        lines.append("")
        lines.append(f"    /* semantic aliases: color theme = {default_block[0]} */")
        lines.extend(_emit_color_tokens(default_block[1], default_block[2], "    "))

    lines.append("")
    lines.append("    /* variable-font axis defaults (cascadable) */")
    lines.append("    --mono: var(--font-axis-mono);")
    lines.append("    --casl: var(--font-axis-casl);")
    lines.append("    --slnt: var(--font-axis-slnt);")
    lines.append("    --crsv: var(--font-axis-crsv);")
    lines.append("    font-family: var(--font-family-mono);")
    lines.append(
        "    font-variation-settings:"
        " 'MONO' var(--mono), 'CASL' var(--casl),"
        " 'CRSV' var(--crsv), 'slnt' var(--slnt);"
    )
    lines.append("  }")

    for name, light, dark in themes:
        if default_block is not None and name == default_block[0]:
            continue
        lines.append("")
        lines.append(f'  [data-color-theme="{name}"] {{')
        lines.append(f'    --theme-name: "{name}";')
        lines.extend(_emit_color_tokens(light, dark, "    "))
        lines.append("  }")

    if has_any_dark:
        lines.append("")
        lines.append('  [data-luminance="dark"] { color-scheme: dark; }')
        lines.append('  [data-luminance="light"] { color-scheme: light; }')

    lines.append("}")
    return "\n".join(lines)


RESET_LAYER = """\
@layer reset {
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; font-variation-settings: 'MONO' var(--mono), 'CASL' var(--casl), 'CRSV' var(--crsv), 'slnt' var(--slnt); }
  html { -webkit-text-size-adjust: 100%; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; line-height: var(--font-line-height-base); }
  ul, ol { list-style: none; padding-inline-start: 0; }
  h1, h2, h3, h4, h5, h6 { font-weight: var(--font-weight-semibold); text-wrap: balance; }
  p { text-wrap: pretty; }
  button, input, textarea, select { font-family: inherit; font-size: inherit; }
}"""

DEFAULTS_LAYER = """\
@layer defaults {
  /* UA-default chrome: every browser-colored surface routed through tokens. */
  html { accent-color: var(--color-link); caret-color: var(--color-link); -webkit-tap-highlight-color: transparent; }
  ::selection { background: var(--color-focus-ring-light); color: var(--color-text); }
  ::placeholder { color: var(--color-text-muted); opacity: 1; }
  :focus-visible { outline: 2px solid var(--color-focus-ring); outline-offset: 2px; }
  :focus:not(:focus-visible) { outline: none; }
  ::marker { color: var(--color-text-muted); }
  dialog::backdrop { background: rgb(0 0 0 / 0.5); }
  :-webkit-autofill { -webkit-box-shadow: 0 0 0 1000px var(--color-bg) inset; -webkit-text-fill-color: var(--color-text); caret-color: var(--color-link); }
  input[type="number"] { appearance: textfield; -moz-appearance: textfield; }
  input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { appearance: none; -webkit-appearance: none; margin: 0; }
  input[type="search"]::-webkit-search-cancel-button { appearance: none; -webkit-appearance: none; }
  summary { list-style: none; cursor: pointer; }
  summary::-webkit-details-marker { display: none; }

  body { font-family: var(--typography-body); --mono: 0; color: var(--color-text); background: var(--color-bg); line-height: var(--font-line-height-relaxed); }
  h1, h2, h3, h4, h5, h6 { font-family: var(--typography-heading); --mono: 1; line-height: var(--font-line-height-tight); text-transform: uppercase; letter-spacing: var(--font-letter-spacing-wide); }
  h1 { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); }
  h2 { font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); }
  h3 { font-size: var(--font-size-base); font-weight: var(--font-weight-semibold); }
  a { color: var(--color-link); font-weight: var(--font-weight-semibold); text-decoration: none; }
  a:hover { text-decoration: underline; }
  a:focus { outline: 2px solid var(--color-focus-ring); outline-offset: 2px; }
  code { font-family: var(--typography-mono); --mono: 1; --casl: 0; font-size: 0.875em; background: var(--color-code-bg); padding: 0.15em 0.3em; }
  pre { background: var(--color-code-bg); padding: var(--spacing-xl); overflow-x: auto; line-height: var(--font-line-height-base); }
  pre code { background: none; padding: 0; }
  blockquote { padding: var(--spacing-xl); border-left: 4px solid var(--color-gray-400); background: var(--color-code-bg); font-style: italic; }
  table { border-collapse: collapse; width: 100%; font-size: var(--font-size-xs); }
  th, td { padding: var(--spacing-sm) var(--spacing-lg); text-align: left; border-bottom: 1px solid var(--color-border); }
  th { font-family: var(--typography-mono); --mono: 1; font-weight: var(--font-weight-semibold); font-size: var(--font-size-xs); border-bottom-width: var(--border-width-medium); border-bottom-color: var(--color-gray-400); }
  caption { font-family: var(--typography-mono); --mono: 1; font-size: var(--font-size-xs); color: var(--color-text-muted); text-align: left; padding-bottom: var(--spacing-md); text-transform: uppercase; letter-spacing: var(--font-letter-spacing-wide); }
  .content-table { border-collapse: separate; border-spacing: 0; }
  .content-table th { position: sticky; top: 0; background: var(--color-bg); z-index: var(--z-sticky); }
  .data-table { overflow-x: auto; }
  @media (max-width: $bp-tablet) { th, td { padding: var(--spacing-xs); font-size: var(--font-size-xs); } }
  .heading-anchor { color: inherit; text-decoration: none; font-weight: inherit; }
  .heading-anchor:hover { text-decoration: none; }
  .heading-anchor::after { content: " #"; color: transparent; font-weight: var(--font-weight-regular); transition: color 0.15s ease; }
  .heading-anchor:hover::after { color: var(--color-text-muted); }
  .heading-anchor:focus-visible { outline: 2px solid var(--color-focus-ring); outline-offset: 2px; }
  .syn-keyword { color: var(--color-syntax-keyword); }
  .syn-string { color: var(--color-syntax-string); }
  .syn-comment { color: var(--color-syntax-comment); --slnt: -12; }
  .syn-function { color: var(--color-syntax-function); }
  .syn-punctuation { color: var(--color-syntax-punctuation); }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; } }
}"""

UTILITIES_LAYER = """\
@layer utilities {
  .flex-col { display: flex; flex-direction: column; }
  .flex-row { display: flex; flex-direction: row; }
  .gap-xs { gap: var(--spacing-xs); }
  .gap-sm { gap: var(--spacing-sm); }
  .gap-md { gap: var(--spacing-md); }
  .gap-lg { gap: var(--spacing-lg); }
  .gap-xl { gap: var(--spacing-xl); }
  .gap-2xl { gap: var(--spacing-2xl); }
  .gap-lh { gap: 1lh; }
  .gap-half-lh { gap: 0.5lh; }
  .text-muted { color: var(--color-text-muted); }
  .font-mono { --mono: 1; }
  .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
  .visually-hidden:focus-visible { position: fixed; top: var(--spacing-md); left: var(--spacing-md); width: auto; height: auto; padding: var(--spacing-md) var(--spacing-xl); margin: 0; overflow: visible; clip: auto; white-space: normal; background: var(--color-bg); color: var(--color-link); --mono: 1; font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); border: 2px solid var(--color-focus-ring); z-index: var(--z-overlay); text-decoration: none; }
  .font-sans { --mono: 0; }
  .font-casual { --casl: 0.5; }
  .font-display { font-weight: var(--font-weight-extrabold); }
  .uppercase { text-transform: uppercase; letter-spacing: var(--font-letter-spacing-wide); text-box: trim-both cap alphabetic; }
  .text-2xs { font-size: var(--font-size-2xs); }
  .text-xs { font-size: var(--font-size-xs); }
  .text-sm { font-size: var(--font-size-sm); }
  .text-lg { font-size: var(--font-size-lg); }
  .text-4xl { font-size: var(--font-size-4xl); }
  .text-5xl { font-size: var(--font-size-5xl); }
  .text-display { font-size: var(--font-size-display); }
  .font-medium { font-weight: var(--font-weight-medium); }
  .font-semibold { font-weight: var(--font-weight-semibold); }
  .grid { display: grid; }
  .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .w-full { width: 100%; }
  .sticky { position: sticky; top: 0; z-index: var(--z-sticky); }
  .border-b { border-bottom: var(--border-width-thin) solid var(--color-border); }
  .border-b-heavy { border-bottom: var(--border-width-medium) solid var(--color-gray-400); }
  .hover-bg:hover { background: var(--color-hover-bg); }
  .dk-icon { width: 1em; height: 1em; display: inline-block; vertical-align: -0.125em; flex-shrink: 0; fill: currentColor; }
}"""


def generate_token_css(
    tokens_path: Path,
    breakpoints: dict[str, str] | None = None,
) -> str:
    """Read design-tokens.json and return a complete CSS string.

    The output uses @layer for specificity management:
    reset → tokens → defaults → utilities

    ``breakpoints`` is used to substitute ``$bp-<name>`` references inside
    static CSS strings (notably ``DEFAULTS_LAYER``). If ``None`` (default),
    they are loaded from ``tokens_path``; pass an explicit dict to avoid
    re-reading the file when the caller has already loaded them (e.g., in
    ``build.py``) or to control them in tests.
    """
    data = json.loads(tokens_path.read_text(encoding="utf-8"))
    _validate_tokens_shape(data)

    primitives = _flatten_primitives(data["primitive"])

    semantic_data = dict(data["semantic"])
    default_theme = semantic_data.pop("default-theme", None)
    themes_data = semantic_data.pop("themes", {}) or {}
    base_semantics = _flatten_semantics(semantic_data)

    themes: list[tuple[str, list[tuple[str, str]], list[tuple[str, str]] | None]] = []
    for name, theme in themes_data.items():
        luminance = theme.get("luminance", {}) or {}
        light = _flatten_semantics(luminance.get("light", {}))
        dark_raw = luminance.get("dark")
        dark = _flatten_semantics(dark_raw) if dark_raw else None
        themes.append((name, light, dark))

    tokens_layer = _build_tokens_layer(
        primitives, base_semantics, themes, default_theme
    )

    sections = [
        FONT_FACE,
        "",
        "@layer reset, tokens, defaults, utilities;",
        "",
        RESET_LAYER,
        "",
        tokens_layer,
        "",
        DEFAULTS_LAYER,
        "",
        UTILITIES_LAYER,
        "",
    ]
    if breakpoints is None:
        breakpoints = load_breakpoints(tokens_path)
    return substitute_breakpoints("\n".join(sections), breakpoints)
