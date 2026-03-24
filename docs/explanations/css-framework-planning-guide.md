# Building a Minimal, Portable CSS Framework

## A Planning Guide for Design Token Architecture & CSS Library Development

---

## The Core Insight: Tokens First, Framework Second

The most future-proof approach is to treat your "CSS framework" as two layers: a **design token system** (the source of truth) and **consumption layers** (vanilla CSS, Tailwind config, MUI theme, etc.). This is exactly what companies like Salesforce (Lightning), Adobe (Spectrum), and GitHub (Primer) do.

---

## Full Inventory of Considerations

### 1. Design Tokens (Your Portable Config)

These are the atomic values everything else derives from:

- **Color** — primitives (palette), semantic aliases (e.g. `color-danger`, `color-surface`), light/dark/high-contrast modes
- **Typography** — font families, size scale, line heights, letter spacing, font weights
- **Spacing** — a consistent scale (4px base is common: 4, 8, 12, 16, 24, 32, 48, 64…)
- **Sizing** — widths, heights, max-widths for containers/content
- **Border radius** — scale from none → pill
- **Shadows / Elevation** — layered depth system
- **Z-index** — a managed scale (avoid magic numbers)
- **Motion / Animation** — duration scale, easing curves
- **Breakpoints** — responsive thresholds
- **Opacity** — a small scale for disabled states, overlays, etc.

### 2. CSS Architecture Decisions

- **Custom properties (CSS variables)** as the delivery mechanism — this is non-negotiable in 2025+; they cascade, they're runtime-themeable, and every framework can consume them
- **Reset / Normalize** — you need a baseline. Modern options: Andy Bell's CSS reset, or Josh Comeau's custom reset. Don't skip this.
- **Box model** — `box-sizing: border-box` everywhere
- **Naming convention** — BEM, CUBE CSS, or just flat utility-style classes? For a minimal library, CUBE CSS (Composition, Utility, Block, Exception) is worth studying since it bridges utility-first and semantic approaches.
- **Specificity management** — CSS layers (`@layer`) are now well-supported and let you guarantee that your reset < tokens < components < utilities < overrides
- **Container queries** — decide if you're building responsive components (container queries) or responsive layouts (media queries) or both
- **Logical properties** — use `inline`/`block` instead of `left`/`right` for internationalization readiness

### 3. Utility Layer

Even if you're not going full Tailwind, a small set of utility classes is extremely useful for vanilla HTML work: spacing, flex/grid shortcuts, text alignment, visibility, color application. Keep this thin and intentional.

### 4. Component Patterns (Not Components)

For a minimal library, don't ship full components — ship *patterns* via CSS: how a card surfaces, how a button is structured, how form elements are styled. Think of these as sensible defaults you can override, not locked-in widgets.

### 5. Accessibility Baked In

- Focus-visible styles (don't remove outlines without replacing them)
- Reduced-motion media query support
- Sufficient color contrast as a token-level guarantee
- Semantic HTML encouraged by your class structure

### 6. What to Skip (At First)

- JavaScript — keep it CSS-only to start
- Complex grid systems — CSS Grid is native now
- Icon systems — separate concern
- Full component libraries — that's the framework consumers' job

---

## The Portability Strategy

Your **single source of truth** is a format like JSON, YAML, or even just a well-structured CSS file with custom properties. From that, you generate outputs for each target:

| Target | How |
|---|---|
| **Vanilla CSS** | Direct `--token-name` custom properties on `:root` |
| **Tailwind** | `tailwind.config.js` that maps tokens to `theme.extend` |
| **MUI** | `createTheme()` object consuming the same values |
| **Shadcn/ui** | CSS variables (it already uses them natively) |
| **Chakra UI** | Theme object with your token values |
| **Bootstrap** | Sass variable overrides or CSS variable layer |
| **Radix / Headless UI** | These are unstyled — your tokens apply directly via CSS |
| **React Native** | A JS theme object derived from the same source |

**Tooling for token transformation:** [Style Dictionary](https://amzn.github.io/style-dictionary/) (by Amazon) and [Cobalt UI](https://cobalt-ui.pages.dev/) exist specifically to do this — one token file in, multiple platform outputs out.

---

## Recommended Build Order

### Phase 1 — Define Tokens
Define your tokens in a structured format. Start with a JSON or CSS custom properties file covering color, type, spacing, radii, and shadows. Even ~50 tokens covers a surprising amount.

### Phase 2 — Write a Minimal CSS Foundation
Build a reset, custom properties on `:root`, a dark mode variant, a handful of utilities, and sensible element-level defaults (what your `<button>`, `<input>`, `<h1>`–`<h6>` look like with zero classes applied).

### Phase 3 — Test Portability
Take those same tokens and wire them into a Tailwind config and one component framework (MUI or Shadcn) to prove the model works before investing further.

### Phase 4 — Expand From Real Usage
Only add tokens, utilities, or patterns when you actually need them in a project. Resist the urge to pre-build.

---

## Next Steps

With the inventory and strategy above established, the next concrete deliverable is:

1. A **token definition file** (JSON) covering all categories
2. A **vanilla CSS library** consuming those tokens (reset + defaults + utilities)
3. A **sample Tailwind config** export to validate portability
