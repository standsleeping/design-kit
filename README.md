# design-kit

Design tokens, web components, and CSS generation for my web pages.

See the [design taxonomy](docs/reference/taxonomy.md) for the full lineage with visual examples, references, and prompt language. The [visual language reference](docs/reference/visual-language.md) documents the specific tokens and conventions.

## What's here

| Path | Description |
|---|---|
| `tokens/design-tokens.json` | Primitive and semantic design tokens (color, spacing, typography) |
| `components/*.js` | `sp-*` web components (shell, sidebar, tabs, buttons, inputs, modals, forms, navigation) |
| `pages/` | Static HTML pages (taxonomy) copied to `dist/` by the build pipeline |
| `src/design_kit/token_css.py` | Generates layered CSS (reset, tokens, defaults, utilities) from the token JSON |
| `src/design_kit/preview.py` | Generates the preview page |
| `src/design_kit/components_preview.py` | Generates the component explorer page (live preview, props, variants, size controls) |
| `src/design_kit/build.py` | Build pipeline: tokens, CSS, preview pages, static pages, and components into `dist/` |
| `docs/reference/visual-language.md` | Visual language principles and token application guide |
| `docs/explanations/` | Design system architecture and rationale |

## Setup

```bash
uv sync
```

## Build and preview

Generate `dist/` with CSS, HTML previews, and components:

```bash
uv run design-kit build
```

Serve locally and open in a browser:

```bash
python3 -m http.server 8787 -d dist
# open http://localhost:8787/preview.html
# open http://localhost:8787/components.html
```

The preview pages use the kit's own tokens, CSS, and web components to showcase itself:
- `preview.html` for the full design language + patterns overview
- `components.html` for component-focused exploration and stress testing

## Checks

```bash
uv run ruff format --check src
uv run ruff check src
uv run mypy src
uv run pytest
```
