"""Generate tokens.css from design-tokens.json."""

import json
from pathlib import Path


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
    primitives: list[tuple[str, str]], semantics: list[tuple[str, str]]
) -> str:
    """Build the @layer tokens block with :root custom properties."""
    lines = ["@layer tokens {", "  :root {"]

    current_category = ""
    for name, value in primitives:
        category = name.split("-")[0]
        if category != current_category:
            if current_category:
                lines.append("")
            lines.append(f"    /* {category} primitives */")
            current_category = category
        lines.append(f"    --{name}: {value};")

    if semantics:
        lines.append("")
        lines.append("    /* semantic aliases */")
        for name, value in semantics:
            lines.append(f"    --{name}: {value};")

    lines.extend(["  }", "}"])
    return "\n".join(lines)


RESET_LAYER = """\
@layer reset {
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-text-size-adjust: 100%; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  ul, ol { list-style: none; padding-inline-start: 0; }
  h1, h2, h3, h4, h5, h6 { font-weight: var(--font-weight-semibold); text-wrap: balance; }
  p { text-wrap: pretty; }
  button, input, textarea, select { font-family: inherit; font-size: inherit; }
}"""

DEFAULTS_LAYER = """\
@layer defaults {
  body { font-family: var(--typography-body); color: var(--color-text); background: var(--color-bg); line-height: var(--font-line-height-relaxed); }
  h1, h2, h3, h4, h5, h6 { font-family: var(--typography-heading); line-height: var(--font-line-height-tight); letter-spacing: 0.02em; }
  h1 { font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); }
  h2 { font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); }
  h3 { font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); }
  a { color: var(--color-link); font-weight: var(--font-weight-semibold); text-decoration: none; }
  a:hover { text-decoration: underline; }
  a:focus { outline: 2px solid var(--color-focus-ring); outline-offset: 2px; }
  code { font-family: var(--typography-mono); font-size: 0.875em; background: var(--color-code-bg); padding: 0.15em 0.3em; border-radius: var(--radius-sm); }
  pre { background: var(--color-code-bg); padding: var(--spacing-xl); overflow-x: auto; border-radius: var(--radius-md); line-height: var(--font-line-height-base); }
  pre code { background: none; padding: 0; }
  blockquote { padding: var(--spacing-lg) var(--spacing-xl); border-left: 4px solid var(--color-stone-400); background: var(--color-code-bg); font-style: italic; }
  table { border-collapse: collapse; width: 100%; }
  th, td { padding: var(--spacing-sm) var(--spacing-lg); text-align: left; border-bottom: 1px solid var(--color-border); }
  th { font-family: var(--typography-heading); font-weight: var(--font-weight-semibold); font-size: var(--font-size-sm); }
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
  .text-muted { color: var(--color-text-muted); }
  .font-mono { font-family: var(--typography-mono); }
  .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
}"""


def generate_token_css(tokens_path: Path) -> str:
    """Read design-tokens.json and return a complete CSS string.

    The output uses @layer for specificity management:
    reset → tokens → defaults → utilities
    """
    data = json.loads(tokens_path.read_text(encoding="utf-8"))

    primitives = _flatten_primitives(data["primitive"])
    semantics = _flatten_semantics(data["semantic"])
    tokens_layer = _build_tokens_layer(primitives, semantics)

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
