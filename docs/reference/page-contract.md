# Design-kit Page Contract

Every HTML page in `pages/` conforms to this contract. The contract is mechanically enforced by `src/design_kit/page_audit.py`, which runs as part of `design-kit build` and fails the build if any non-allowlisted page violates it.

The contract makes pages framework-native: every page has the same shell scaffold, the same chrome vocabulary, and the same system sidebar. Cross-page concerns (navigation, focus rings, themes, audits) compose by construction rather than being retrofitted page by page.

## Requirements

Every conformant page satisfies all of the following.

| # | Requirement | Audit rule |
|---|---|---|
| 1 | Root element is `<div class="dk-app-shell">` | `app-shell-root` |
| 2 | Contains `<main class="dk-app-shell-main">` for content | `main-slot` |
| 3 | Carries a sidebar slot: element with `[data-system-nav]` (optionally `data-current="<page-id>"` to highlight) | `system-nav-slot` |
| 4 | Includes `<script type="module" src="components/system/system-sidebar.js">` | `system-sidebar-script` |
| 5 | Viewport-locked: `html, body { height: 100%; overflow: hidden }` | `viewport-lock` |
| 6 | Includes `tokens.css` stylesheet link | `tokens-css` |
| 7 | Includes `app-shell.css` stylesheet link | `app-shell-css` |
| 8 | Includes `sidebar.css` and `nav-stack.css` stylesheet links | `sidebar-css` |

Page-local CSS targets `.dk-app-shell-main` descendants, never `body` descendants. Body-level rules collide with the shell's own viewport-lock styles.

## Skeleton

A minimal conformant page:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Page Title · design-kit</title>
<link rel="stylesheet" href="tokens.css?{{CACHE_BUST}}">
<link rel="stylesheet" href="components/app-shell.css?{{CACHE_BUST}}">
<link rel="stylesheet" href="components/sidebar.css?{{CACHE_BUST}}">
<link rel="stylesheet" href="components/nav-stack.css?{{CACHE_BUST}}">
<link rel="stylesheet" href="components/topbar.css?{{CACHE_BUST}}">
<style>
  html, body { height: 100%; margin: 0; overflow: hidden; }
  body {
    font-family: var(--typography-body);
    color: var(--color-text);
    background: var(--color-bg);
  }
  /* Page-local CSS targets .dk-app-shell-main descendants. */
</style>
</head>
<body>
<div class="dk-app-shell">

  <header class="dk-app-shell-header dk-topbar">
    <span class="dk-topbar-title">Page Title</span>
    <span class="dk-topbar-spacer"></span>
  </header>

  <div class="dk-app-shell-body">
    <aside class="dk-app-shell-left dk-sidebar dk-sidebar-left dk-sidebar-mode-inline"
           data-state="expanded"
           style="--dk-sidebar-width: 220px;"
           aria-label="Design Kit navigation">
      <div class="dk-sidebar-main" data-slot="main" data-system-nav data-current="page-id"></div>
    </aside>
    <main class="dk-app-shell-main">
      <!-- Page content -->
    </main>
  </div>

</div>

<script type="module" src="components/system/system-sidebar.js?{{CACHE_BUST}}"></script>
<!-- Page-specific scripts go below -->
</body>
</html>
```

The `data-current="page-id"` highlights the current page in the system sidebar. Use the matching `id` from `components/system/nav-data.js` (e.g., `taxonomy`, `inset-vs-flush`, `storybook`). Omit `data-current` when the page is the index itself.

## First-paint bootstrap and font (build-managed)

The authored skeleton above deliberately omits two things every *built* page carries, both injected by `design-kit build` from a single source and verified to have landed in every page (a missing or misplaced injection fails the build):

- A synchronous inline `<script>` in the head that establishes persisted render state (luminance, color theme) before first paint (`src/design_kit/head_bootstrap.py`), inserted immediately before the first stylesheet. This is why theme and luminance never flash on load, and why no page hand-rolls its own theme script.
- A `<link rel="preload" as="font" crossorigin>` for the self-hosted Recursive variable font (`src/design_kit/font_preload.py`). The font itself is self-hosted (`fonts/`, served from `dist/fonts/`) and declared via `@font-face` in `tokens.css`, so a page **must not** add a Google Fonts (or any other) font link; doing so reintroduces a third-party connection and is redundant with the build-managed preload.

A page that persists layout geometry (panel widths, collapsed rails) additionally authors its own synchronous geometry bootstrap in the head, because geometry is per-page rather than universal. See [the load lifecycle](../explanations/load-lifecycle.md) for the full order of execution and the trajectory audit that enforces it.

## Manual mount (augmented levels)

The default flow auto-mounts the canonical `LEVELS` from `components/system/nav-data.js` into the `[data-system-nav]` slot. A page that needs to extend the structure (for example, splicing in a sub-level whose items come from runtime data) opts out of auto-mount and calls `mountSystemSidebar` itself.

To opt out, tag the slot with `data-system-nav-manual`. The page still satisfies the contract (the slot is present, the script is loaded), but the auto-mount selector skips it:

```html
<div class="dk-app-shell-left"
     data-system-nav
     data-system-nav-manual
     data-current="storybook"></div>
```

The page-local script then imports the canonical `LEVELS` + `TARGETS`, composes its augmented level structure, and calls `mountSystemSidebar` with a custom `onSelect`:

```js
import { mountSystemSidebar } from './system/system-sidebar.js';
import { LEVELS, TARGETS } from './system/nav-data.js';

const systemRoot = {
  ...LEVELS[0],
  items: LEVELS[0].items.map((item) =>
    item.id === 'storybook'
      ? { ...item, kind: 'branch', branchTo: 'storybook' }
      : item,
  ),
};
const subLevel = { id: 'storybook', title: 'Components', items: dynamicItems };

await mountSystemSidebar({
  host: document.querySelector('[data-system-nav]'),
  levels: [systemRoot, subLevel],
  current: 'storybook',
  initialPath: ['root', 'storybook'],
  onSelect: handleNavSelect,
});
```

Rewriting an existing root item to `kind: 'branch'` with a matching `branchTo` makes it drill into the sub-level instead of navigating away. The `onSelect` handler is responsible for dispatching between cross-page navigation (the canonical `TARGETS` map) and the page's own in-DOM selection (the sub-level items). `components/storybook.js` is the canonical example.

## How the audit works

`run_page_audit(pages_dir)` walks `pages/*.html` and runs each check against every page. Pages in `KNOWN_NON_CONFORMANT` are deferred (their violations don't fail the build but are logged as a backlog). Any failure outside the allowlist raises a `RuntimeError` in `design-kit build`. As of 2026-05-17 the allowlist is empty (every page in `pages/*.html` conforms), and the mechanism stands by for the next migration arc.

If a page is in the allowlist but actually passes every check, the build logs a "stale allowlist" warning so the entry can be removed.

## Relationship to principles

- `EDGE_ALWAYS_CHROME`: every page has chrome on every edge via the shell scaffold
- `NO_PAGE_SCROLL` / `VIEWPORT_LOCKED`: the viewport-lock rule (Requirement 5)
- `FLAT_CLASSED_FLEX_TREE`: the shell's flat, named-slot structure
- `INSET_VS_FLUSH_LAYOUT`: every page picks a mode by composing content inside `dk-app-shell-main`
- `LAYERED_UI_REVEAL`: the base / chrome / surface / item layer split is the shell's slot structure
- `NO_FIRST_PAINT_FLASH` / `HYDRATION_RESERVES_GEOMETRY`: the build-injected first-paint bootstrap and reserved rail geometry (see [the load lifecycle](../explanations/load-lifecycle.md))

## References

- `~/Developer/design-kit/src/design_kit/page_audit.py`: the audit
- `~/Developer/design-kit/components/system/system-sidebar.js`: the shared mounting module
- `~/Developer/design-kit/components/system/nav-data.js`: canonical nav data
