"""Generate tokens.css from design-tokens.json."""

from __future__ import annotations

import json
from pathlib import Path

GOOGLE_FONTS_LINK = (
    '  <link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    '  <link href="https://fonts.googleapis.com/css2'
    "?family=Recursive:slnt,wght,CASL,CRSV,MONO"
    "@-15..0,300..1000,0..1,0..1,0..1"
    '&display=swap" rel="stylesheet">'
)


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


def _build_tokens_layer(
    primitives: list[tuple[str, str]],
    semantics: list[tuple[str, str]],
    dark_overrides: list[tuple[str, str]] | None = None,
) -> str:
    """Build the @layer tokens block with :root custom properties.

    When dark_overrides exist, semantics are emitted as light-dark() so a
    single declaration carries both modes. color-scheme (set via OS
    preference on :root, or forced by [data-theme]) picks which branch
    resolves at use time.
    """
    lines = ["@layer tokens {", "  :root {", "    color-scheme: light dark;"]

    current_category = ""
    for name, value in primitives:
        category = name.split("-")[0]
        if category != current_category:
            if current_category:
                lines.append("")
            lines.append(f"    /* {category} primitives */")
            current_category = category
        lines.append(f"    --{name}: {value};")

    dark_map = dict(dark_overrides) if dark_overrides else {}

    if semantics:
        lines.append("")
        lines.append("    /* semantic aliases */")
        for name, value in semantics:
            if name in dark_map:
                lines.append(f"    --{name}: light-dark({value}, {dark_map[name]});")
            else:
                lines.append(f"    --{name}: {value};")

    lines.append("")
    lines.append("    /* variable-font axis defaults (cascadable) */")
    lines.append("    --mono: var(--font-axis-mono);")
    lines.append("    --casl: var(--font-axis-casl);")
    lines.append("    --slnt: var(--font-axis-slnt);")
    lines.append("    --crsv: var(--font-axis-crsv);")
    lines.append("    font-family: var(--font-family);")
    lines.append(
        "    font-variation-settings:"
        " 'MONO' var(--mono), 'CASL' var(--casl),"
        " 'CRSV' var(--crsv), 'slnt' var(--slnt);"
    )

    lines.extend(["  }"])

    if dark_overrides:
        lines.append("")
        lines.append('  [data-theme="dark"] { color-scheme: dark; }')
        lines.append('  [data-theme="light"] { color-scheme: light; }')

    lines.append("}")
    return "\n".join(lines)


RESET_LAYER = """\
@layer reset {
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; font-variation-settings: inherit; }
  html { -webkit-text-size-adjust: 100%; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; line-height: var(--font-line-height-base); }
  ul, ol { list-style: none; padding-inline-start: 0; }
  h1, h2, h3, h4, h5, h6 { font-weight: var(--font-weight-semibold); text-wrap: balance; }
  p { text-wrap: pretty; }
  button, input, textarea, select { font-family: inherit; font-size: inherit; }
}"""

DEFAULTS_LAYER = """\
@layer defaults {
  /* UA-default chrome: every browser-colored surface routed through tokens. */
  html { accent-color: var(--color-link); caret-color: var(--color-link); -webkit-tap-highlight-color: transparent; scrollbar-color: var(--color-border) transparent; scrollbar-width: thin; }
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
  .content-table th { position: sticky; top: 0; background: var(--color-bg); z-index: var(--z-sticky); }
  .data-table { overflow-x: auto; }
  @media (max-width: 600px) { th, td { padding: var(--spacing-xs); font-size: var(--font-size-xs); } }
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
  .uppercase { text-transform: uppercase; letter-spacing: var(--font-letter-spacing-wide); }
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
}"""


def generate_token_css(tokens_path: Path) -> str:
    """Read design-tokens.json and return a complete CSS string.

    The output uses @layer for specificity management:
    reset → tokens → defaults → utilities
    """
    data = json.loads(tokens_path.read_text(encoding="utf-8"))

    primitives = _flatten_primitives(data["primitive"])

    semantic_data = dict(data["semantic"])
    dark_data = semantic_data.pop("dark", None)

    semantics = _flatten_semantics(semantic_data)
    dark_overrides = _flatten_semantics(dark_data) if dark_data else None
    tokens_layer = _build_tokens_layer(primitives, semantics, dark_overrides)

    sections = [
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
    return "\n".join(sections)
