# design-kit

Design tokens, web components, and CSS generation.

## What's here

- `tokens/design-tokens.json` — primitive and semantic design tokens (color, spacing, typography, etc.)
- `components/*.js` — `sp-*` web components (app shell, sidebar, tabs, buttons, etc.)
- `src/design_kit/token_css.py` — generates layered CSS (`reset`, `tokens`, `defaults`, `utilities`) from the token JSON
- `src/design_kit/preview.py` — generates the self-showcasing preview page
- `src/design_kit/build.py` — build pipeline: tokens, CSS, preview, and components into `dist/`
- `docs/reference/visual-language.md` — visual language principles and token application guide
- `docs/explanations/` — design system architecture and rationale

## Setup

```bash
uv sync
```

## Build and preview

Generate `dist/` with CSS, HTML preview, and components:

```bash
uv run design-kit build
```

Serve locally and open in a browser:

```bash
python3 -m http.server 8787 -d dist
# open http://localhost:8787/preview.html
```

The preview page uses the kit's own tokens, CSS, and web components to showcase itself.

## Checks

```bash
uv run ruff format --check src
uv run ruff check src
uv run mypy src
uv run pytest
```
