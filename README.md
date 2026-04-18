# design-kit

Design tokens, reusable components, and CSS generation for my web pages.

See the [design taxonomy](docs/reference/taxonomy.md) for the full lineage with visual examples, references, and prompt language. The [visual language reference](docs/reference/visual-language.md) documents the specific tokens and conventions. The [component contract](docs/reference/component-contract.md) is the canonical spec for the four-export module shape that the storybook consumes.

## What's here

| Path | Description |
|---|---|
| `tokens/design-tokens.json` | Primitive and semantic design tokens (color, spacing, typography) |
| `components/*.{js,css}` | ES-module components, sibling CSS per component, `dk-*` class prefix |
| `components/storybook.js` | Storybook runtime: pool scan, variant cards, width/height controls, event log, props inspector |
| `components/storybook.config.json` | Pool registry — committed; declares design-kit's own pool only |
| `pages/storybook.html` | Component preview shell (loads `storybook.js`) |
| `pages/preview.html` | Tokens/foundations page (color, typography, spacing, borders, tables) |
| `pages/contract-tests.html` | Browser-runnable contract conformance tests |
| `src/design_kit/token_css.py` | Generates layered CSS (reset, tokens, defaults, utilities) from the token JSON |
| `src/design_kit/build.py` | Build pipeline: tokens, CSS, static pages, components into `dist/` |
| `docs/reference/component-contract.md` | The module contract and pool-naming conventions |
| `docs/reference/visual-language.md` | Visual language principles and token application guide |
| `dev.sh` | Build + serve design-kit on `$DESIGN_KIT_PORT` (default 8787) |

## Setup

```bash
uv sync
```

## Build and preview

```bash
./dev.sh
# open http://localhost:8787/storybook.html
# open http://localhost:8787/preview.html
# open http://localhost:8787/contract-tests.html
```

## Previewing components from another project

design-kit knows nothing about which projects consume it. Any other project can surface its components in the storybook by:

1. Conforming each component module to the [contract](docs/reference/component-contract.md) (four exports: `metadata`, `propTypes`, `variants`, `render`).
2. Serving those modules from a dev server that emits `Access-Control-Allow-Origin: *` (or same-origin with design-kit's dev server).
3. Declaring a pool entry in a **local override** file at `components/storybook.config.local.json` (gitignored). Example:

```json
{
  "pools": [
    {
      "name": "my-project",
      "path": "http://localhost:9000/static/components",
      "stylesheet": "http://localhost:9000/static/tokens.css",
      "components": [
        "button.js",
        "card.js"
      ]
    }
  ]
}
```

At boot, `storybook.js` and `contract-tests.html` fetch `storybook.config.local.json` alongside the committed config; pool entries are merged by `name` (local overrides committed). Missing file → silent fallback to the committed config. Unreachable pool → flagged as such in the UI; design-kit's own pool still works.

design-kit reads exactly one local-config file. Tying together multiple consuming projects — populating that file, starting each project's CORS server alongside `dev.sh`, cleaning up on exit — is the responsibility of an external orchestrator that knows the user's project layout. design-kit itself stays unaware of which projects exist.

## Checks

```bash
uv run ruff format --check src
uv run ruff check src
uv run mypy src
uv run pytest
```

The contract-tests page also runs in the browser at `/contract-tests.html` and asserts every registered component conforms to the four-export module shape. Unreachable pools are reported as warnings, not contract failures.
