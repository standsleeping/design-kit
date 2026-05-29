# Starting a New Project with design-kit

[Getting started](getting-started.md) builds a single-file hello world. This recipe sets up a real project: a project layout, vendored runtime and tokens, the component contract, and running design-kit's audit set against your own code. The target is a new project running in under thirty minutes from this page alone, with no recourse to existing project source.

Caret stays inside the design-kit repository (it is private and unpackaged). A consumer **vendors** the pieces it needs and runs the design-kit CLI against its tree. Nothing is installed from a registry.

---

## 1. Project layout

A flat layout that matches what the audits expect:

```
my-app/
  index.html            # entry page
  app.js                # createApp wiring (or inline in index.html)
  app-runtime.js        # vendored from design-kit
  tokens.css            # vendored from design-kit
  tokens.manifest.json  # vendored alongside tokens.css
  components/           # your components: <name>.js + sibling <name>.css
  pages/                # additional HTML pages (optional)
```

The `components/` + `pages/` directories mirror design-kit's own layout, so `design-kit audit --scope .` finds them without override flags (step 5). If your CSS lives elsewhere, the override flags in step 5 retarget it.

---

## 2. Vendor the runtime and tokens

Copy the runtime, and export the tokens from a built design-kit checkout:

```bash
# the runtime
cp /path/to/design-kit/components/system/app-runtime.js my-app/

# the tokens (run from the design-kit checkout)
cd /path/to/design-kit
design-kit build
design-kit export-tokens --to /path/to/my-app
```

`export-tokens` copies `tokens.css` and `tokens.manifest.json`. The manifest records the `version` and a `sha256` per artifact, so you can tell at a glance which build of the tokens you vendored. To update later, re-run `design-kit build && design-kit export-tokens --to /path/to/my-app`.

---

## 3. Wire the application

Link `tokens.css` and write the four pieces (`initialState`, `reducer`, `render`, `root`) exactly as in [Getting started](getting-started.md). The reducer is the single source of truth; the only way to change what the user sees is to dispatch an action.

As the app grows:

- Compose effects in the `effects` array: `urlSyncEffect` for shareable view state, `localStorageEffect` for persistence, `dispatchOnEvent` for global listeners. See the [SPA tutorial](../tutorials/spa.md) and [settings panel](../tutorials/settings-panel.md).
- Render lists with `each` and a stable key, never by rebuilding a container's `innerHTML`.
- Full API: the [runtime reference](../reference/runtime.md).

---

## 4. Add components

Each reusable component is a `.js` module with four named exports (`metadata`, `propTypes`, `variants`, `render`) plus a sibling `.css` file of the same basename. This is the [component contract](../reference/component-contract.md); conform to it and the storybook can render your component and the audits can lint its CSS.

Conventions that keep the audits green:

- Namespace every class with a project prefix (`.myapp-button`), one prefix per pool.
- Reference semantic tokens only (`var(--color-text)`, `var(--spacing-md)`); never raw color or dimension literals, and keep public token references resolvable in your vendored `tokens.css`.
- Square corners, square padding, no `margin` for layout, thin borders via `var(--border-width-*)`. The [visual language reference](../reference/visual-language.md) is the full ruleset; the audits enforce its checkable subset.

---

## 5. Run the audit set on your own code

design-kit's audits retarget at any tree, so your project runs the identical visual-language checks. Run the CLI from a design-kit checkout (or with `design-kit` on `PATH`), pointed at your project:

```bash
# project mirrors components/ + pages/; point contrast at your vendored tokens
design-kit audit --scope /path/to/my-app --tokens-css /path/to/my-app/tokens.css

# CSS lives somewhere else? retarget each input independently:
design-kit audit \
  --components-dir /path/to/my-app/src/styles \
  --tokens-css /path/to/my-app/tokens.css

design-kit audit --scope /path/to/my-app --headless   # add rendered-page checks
```

Two things to know about coverage. First, the static lints scan `components/*.css` and `pages/*.html`, one level deep. Inline `<style>` in your entry `index.html` is **not** linted, so keep substantive CSS in component sibling files (or point `--components-dir` at wherever it lives). Second, a *missing* input reports `SKIP`, but an *empty* `components/` passes vacuously: "14 passed" over an empty tree means nothing was checked, not that everything was validated.

Wire `design-kit audit` into your project's pre-commit or CI exactly as design-kit wires it into its own build. Full flag reference: the [CLI reference](../reference/cli.md).

---

## 6. Optional: static type-checking

The component sources stay vanilla JS, type-checked with `tsc --noEmit` via JSDoc annotations: no transpile, no emit. Copy design-kit's `tsconfig.json` (point its `include` at your `components/`), add TypeScript as a dev dependency, and run `tsc --noEmit`. The runtime ships JSDoc types, so your `createApp` wiring and bindings are checked too. See the README "Checks" section for the exact setup.

---

## What you have

| Concern | Mechanism |
|---|---|
| State | One reducer; slices exposed as signals by `createApp` |
| View | `render` builds DOM once; bindings mutate in place |
| Side effects | Entries in the `effects` array |
| Reusable UI | Four-export components + sibling CSS |
| Tokens | Vendored `tokens.css`; refreshed via `export-tokens` |
| Quality gate | `design-kit audit` over your tree |
| Types (optional) | JSDoc + `tsc --noEmit` |

Everything design-kit provides is now in your project, and the audit set enforces the same conventions on your code that it does on design-kit's.
