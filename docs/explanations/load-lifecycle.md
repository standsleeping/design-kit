# The Load Lifecycle

This page explains the order code runs as a design-kit page loads, how first-paint state is established and verified, and why the architecture is shaped that way. For the page structure itself, see the [page contract](../reference/page-contract.md); for the runtime that mounts content, see [the runtime](runtime.md).

## A page has a trajectory, not just two states

It is tempting to think of a page as two snapshots: the source HTML, and the settled DOM after JavaScript has run. Most tooling reasons about exactly those two (static lints read the source; most headless checks wait for the page to settle, then measure). But a page also has a **load trajectory**: the sequence of frames between the first paint and the settled state. Two whole classes of defect live only in that window:

- **FOUC** (flash of unstyled content): the page paints in one theme, then a script corrects it, so the user sees a flash on every load.
- **Layout shift** (the **CLS** metric): chrome or content mounts after first paint and resizes the layout, so the page jumps.

Neither is visible to a check that only reads the source or only measures the settled DOM. The architecture below treats the trajectory as a first-class artifact with a contract at each phase.

## What runs, in order

A built page executes in four phases. The first two happen before the user sees anything; the contract is that everything which must be correct at first paint is already correct by the end of phase 2.

### 1. Head parse (synchronous, before paint)

The browser parses `<head>` top to bottom. In order:

1. The `charset`, `viewport`, and `color-scheme` metas.
2. The **font preload**: a `<link rel="preload" as="font" crossorigin>` for the self-hosted Recursive variable font, so the browser starts fetching the brand font at the top of the load rather than only when the first glyph is laid out. Like the bootstrap it is a single build-injected source (`src/design_kit/font_preload.py`).
3. The **render-state bootstrap**: a small synchronous inline `<script>` that reads `dk-luminance` and `dk-color-theme` from `localStorage` and sets `data-luminance` / `data-color-theme` on `<html>`. It is the single source for this logic (`src/design_kit/head_bootstrap.py`), injected by the build into every page before the first stylesheet.
4. A page that persists layout geometry adds its own synchronous inline bootstrap here too. The storybook reads `dk-storybook-layout` and sets `--dk-rail-nav-w` / `--dk-rail-inspector-w` on `<html>`.
5. The stylesheets load. By the time `tokens.css` resolves, the theme attributes are already on `<html>`, so colors compute correctly the first time (luminance also rides `color-scheme: light dark` + `light-dark()`, which the browser resolves at paint with no script for the follow-the-OS case). `tokens.css` also carries the `@font-face` for Recursive and two metric-matched fallback faces, so text drawn before the woff2 decodes occupies the same space it will once Recursive arrives.

Nothing in this phase is deferred. Deferred and module scripts cannot participate: they run after first paint by definition, which is exactly why first-paint state cannot live in them.

### 2. First paint

The page renders once, already correct: the right color theme, the right luminance, and rails already at their reserved width. There is no second, corrected frame, because nothing was left for a later phase to fix.

### 3. Hydration (deferred and module scripts)

Now the deferred work runs: `system-sidebar.js` auto-mounts the navigation, page modules mount their components, `storybook.js` builds its variant area. The discipline here is that hydration fills content into boxes that are *already the right size*; it never resizes the boxes.

- The toggles (`luminance-toggle`, `color-theme-toggle`) **read** the state the head bootstrap already established; they only **write** it on user action. The control that mutates state is separate from the code that establishes it.
- The storybook mounts its Sidebars into rails that reserved their width in phase 1, then removes the `storybook-rail-reserving` class so the mounted Sidebar drives the width from there on (and the resizer works normally).

### 4. Settled

The page is interaction-ready. From here, state changes only through user action, dispatched into the runtime.

## How first-paint state is managed

**Establish, then render the control.** A persisted render preference has two responsibilities with two different lifetimes. Establishing the state must happen at frame 0, synchronously, at the document level. Rendering the control that changes it can happen whenever, asynchronously. Fusing them is the original bug: when the theme was applied as a side effect of mounting the toggle, a frame-0 obligation inherited the toggle's (deferred, sometimes network-gated) mount time, and the wrong theme painted first.

**Invariant is generated; variation is per-page.** Render state (theme, luminance) is the same on every page, so it is one block the build injects everywhere rather than a snippet each page hand-rolls. Geometry (panel widths, collapsed rails) genuinely differs per page, so each page reserves its own. This split is the reason the bootstrap is build-injected but the geometry bootstrap is page-local.

**Injection is verified, not assumed.** The build calls `bootstrap_violation` on every page it writes and fails loudly, naming the page, if the bootstrap is missing or sits after the first stylesheet. A silent skip (an idempotency-marker collision, a head with no stylesheet) is caught at the authoring phase rather than surfacing as a flash that only a browser would reveal.

## How geometry is reserved

The goal is that the rails occupy their final width at first paint, so mounting chrome into them changes content, not size.

- **Conformant pages** embed the rail statically: `<aside class="dk-app-shell-left dk-sidebar" style="--dk-sidebar-width: 220px">`. The rail is sized before any script runs; the auto-mounted nav fills it.
- **The storybook** is the exception that proves the rule. It mounts its two Sidebars into empty rails, so without help the rails would collapse (`:empty { display: none }`) and then pop to width on mount. Instead each rail carries `storybook-rail-reserving`, which reserves the width from the geometry bootstrap's custom props (overriding the empty-collapse), and `storybook.js` removes that class once the real Sidebar is mounted.

## What changed

The prior architecture applied theme in deferred or module JavaScript (in the storybook, behind a config fetch), and mounted chrome into empty rails. The result was a theme flash and a layout jump on every load. The quality gates could not see either, because they measured the source text or the settled DOM, never the trajectory between them.

The current architecture moves first-paint state into the synchronous head, reserves geometry before paint, and makes the trajectory itself a measured, gated artifact:

| Concern | Before | Now |
|---|---|---|
| Theme / luminance | applied by deferred/module JS after paint | established by a synchronous head bootstrap before paint |
| Bootstrap source | hand-copied into some pages, absent from others | one source, build-injected into every page, build-verified |
| Rail geometry | reserved on static pages; storybook mounted into empty rails | reserved at first paint on every shell page |
| Brand font | fetched from Google Fonts with `display=swap`; a monospace fallback reflowed prose on swap | self-hosted, preloaded, with metric-matched fallback faces so the swap is shift-free |
| The trajectory | unmeasured (gates saw only source or settled DOM) | measured and gated by the first-paint audit |

## How it is enforced

- **At build time:** `bootstrap_violation` fails the build if any page lacks the bootstrap before its first stylesheet.
- **In the headless audit** (the `first-paint` spec, run with `design-kit audit --headless`):
  - *No-FOUC:* each page is loaded twice, once normally and once with every `.js` request aborted. The inline head bootstrap is not a request, so it still runs; the deferred scripts do not. If the no-JS render already matches the settled render (same theme attributes, same body colors), the synchronous bootstrap alone establishes first-paint state and there is no flash.
  - *No layout shift:* a layout-shift observer sums CLS over the load. Every page is held to one tight bound (font swap no longer reflows text, so there is no reason for a looser general threshold). A page whose load-time shift is by design (a self-reporting test harness that injects results, not a user surface) opts out with `data-cls-exempt="<reason>"`, where the reason documents why; font swap is not a valid reason.

## The brand font

The brand font is **Recursive**, a single variable font with five axes (`MONO`, `CASL`, `wght`, `slnt`, `CRSV`); typographic roles are axis positions, not separate families. It is **self-hosted** (vendored under `fonts/`, copied to `dist/fonts/` by the build) rather than fetched from Google Fonts, which removes a third-party connection and lets the font be preloaded same-origin.

Font swap used to be the last trajectory defect: the fallback stack was monospace, but body prose renders proportional (`MONO 0`), so prose drawn in the fallback reflowed hard when Recursive arrived. The fix is **metric-matched fallback faces**. `tokens.css` declares two of them — `Recursive-fallback-mono` (over `Courier New`, matched to Recursive at `MONO 1`) and `Recursive-fallback-prose` (over `Arial`, matched to Recursive at `MONO 0`) — each with `size-adjust` and ascent/descent/line-gap overrides so its line box and average advance width equal Recursive's. The mono-vs-proportional choice is made per family token (`--font-family-mono` / `--font-family-prose`) because the system fallbacks have no `MONO` axis. With the preload (warm cache: Recursive present at first paint) and the metric match (cold load: the swap is shift-free), the font swap contributes ~0 CLS, so no page exempts itself for it.

## See also

- Principles (system-principles): `NO_FIRST_PAINT_FLASH`, `HYDRATION_RESERVES_GEOMETRY`, `GENERATE_INVARIANTS_LINT_VARIATION`, `SHIFT_VALIDATION_LEFT`.
- Code: `src/design_kit/head_bootstrap.py` (the bootstrap + verifier), `src/design_kit/font_preload.py` (the preload + verifier), the `@font-face` block in `src/design_kit/token_css.py`, the `first-paint` spec in `src/design_kit/audit/headless.py`.
- [The audit set](audits.md) and the [page contract](../reference/page-contract.md).
