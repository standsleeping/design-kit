# design-kit

Design tokens, web components, and CSS generation.

## What's here

- `tokens/design-tokens.json` — primitive and semantic design tokens (color, spacing, typography, etc.)
- `components/*.js` — `sp-*` web components (app shell, sidebar, tabs, buttons, etc.)
- `src/design_kit/token_css.py` — generates layered CSS (`reset`, `tokens`, `defaults`, `utilities`) from the token JSON
- `planning/` — design system planning docs

## Setup

```bash
uv sync
```

## Checks

```bash
uv run ruff format --check src
uv run ruff check src
uv run mypy src
uv run pytest
```
