# The Token Vocabulary

This page explains how design-kit's tokens are organized and why. For exact names, see the [glossary](../reference/glossary.md) and [visual language reference](../reference/visual-language.md); for distribution, the [CLI reference](../reference/cli.md).

## Tokens are the single source of design truth

Every design decision (a color, a spacing step, a font axis, a border width) is a CSS custom property, defined once and referenced everywhere. Components never hardcode a value. Change the token and the change propagates to every element that references it. The audit set enforces this: a raw color or dimension literal in component CSS is a lint failure.

## Two tiers: primitive and semantic

The vocabulary has two layers, and the distinction is load-bearing.

A **primitive token** is a raw, context-free value: `--color-gray-500`, `--spacing-xl`. Primitives are the palette (gray, purple, blue, and the rest, each in shades) plus the foundational scales. They describe *what a value is*, not *what it is for*. Components never reference primitives directly.

A **semantic token** maps a primitive to a role: `--color-bg`, `--color-text`, `--color-link`. Semantic tokens describe *purpose*. Component CSS references only these. The indirection is the point: because components speak in roles, the values behind those roles can change (for dark mode, for a different theme) without touching a single component.

## Theming resolves in the semantic layer

Three independent axes vary the semantic values, and each has its own vocabulary slot so they never collide:

- **Luminance mode**: light or dark. `:root` declares `color-scheme: light dark`, and semantic tokens resolve with `light-dark()`, so a token carries both its light and dark value in one declaration. A `[data-luminance]` attribute forces one mode regardless of OS preference.
- **Color theme**: a named aesthetic identity (the default gray-with-purple, a pure monochrome, a fixed Solarized palette). Selected with `[data-color-theme]` on `:root`.
- **Contrast mode**: default vs. high-contrast. Reserved as a slot; not yet shipped, but named so it does not later collide with the other two.

All three meet in the semantic tokens. Components, written against roles, are theme- and mode-agnostic by construction.

## Cascade layers keep order predictable

The generated `tokens.css` declares the full public cascade order: `reset`, `tokens`, `defaults`, `utilities`, `components`, `pages`, `overrides`. The token sheet itself owns the first four layers; `design-kit build` wraps copied component CSS into `components` and page-local `<style>` blocks into `pages`. Layer order, not selector specificity or source position, decides who wins. A reset cannot accidentally override a utility; component styles preserve the pre-build order by landing after utilities; and page-local CSS can customize a screen without escaping into the unlayered cascade. Consumers that need a deliberate final escape hatch can use the `overrides` layer, or ordinary unlayered CSS when they truly want to outrank the framework.

## Distribution: vendor, don't copy-paste

Tokens are published as an artifact. `design-kit export-tokens --to PATH` copies the built `tokens.css` and a `tokens.manifest.json` into a consumer's directory; the manifest stamps each artifact with a version and a `sha256`, so a consumer knows exactly which build it vendored and can detect when an update changes the bytes. A project re-runs the export to update. The token *names* are a stable contract; the *values* travel in the vendored file.

## Further reading

- [Glossary](../reference/glossary.md): primitive token, semantic token, palette, color theme, luminance mode, contrast mode.
- [Visual language reference](../reference/visual-language.md): the conventions tokens encode.
- [CLI reference](../reference/cli.md): `export-tokens`.
- `TOKEN_DRIVEN_DESIGN`, `TOKEN_PAIR_CONTRAST` in system-principles.
