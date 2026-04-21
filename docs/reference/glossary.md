# Glossary

Shared vocabulary for layout, padding, and structure across design-kit. When a principle or doc references one of these terms, link back to the entry here rather than redefining it in place.

Each entry: one-line definition, then clarifications or cross-references as needed. Entries are alphabetical.

## Boundary

The visible edge of a component, whether drawn by a border, a rule, a shade change, or a gap. See `BOUNDARY_OWNERSHIP` in system-principles: each component should look visually complete in isolation; relying on a neighbor for your edge is implicit coupling.

## Card

A bounded content unit that groups related information (header, body, optional footer). Default vocabulary for rectangular content blocks. Prefer *card* over *panel* or *box*.

## Chrome

Non-content structural framing. Headers, toolbars, status bars, sidebars, tab bars, borders, and gutters are chrome. Content is the information the user came for; chrome is everything around it that frames, navigates, or labels the content. See `MINIMIZE_CHROME_ROWS` and `CONTROLS_ON_HEADING_BASELINE`.

Chrome is also one of the four padding roles (see *Padding roles*).

## Color theme

A named aesthetic identity expressed as *palette* values mapped to semantic roles (`--color-bg`, `--color-text`, `--color-link`). A theme is defined for each *luminance mode* × *contrast mode* combination. design-kit ships three: `mono-purple` (default; gray-dominant with purple accent), `monochrome` (pure greyscale, status collapses to text), and `solarized` (Ethan Schoonover's fixed palette). Active theme is set via `[data-color-theme]` on `:root`; the current name is readable as `--theme-name`. Prefer *color theme* over bare *theme*.

## Container

An element that holds other elements and owns their horizontal inset. Also one of the four padding roles. See `CONTAINER_OWNS_INSET` and `SQUARE_PADDING_DEFAULT`.

## Contrast mode

Default vs. high-contrast. The accessibility layer served by `prefers-contrast` and `forced-colors`. design-kit does not currently ship a high-contrast mode; the term is reserved so that when we do, it occupies its own vocabulary slot rather than colliding with *luminance mode* or *color theme*.

## Divider

See *Rule*. Prefer *rule* in new work; *divider* is acceptable when discussing Material Design conventions directly.

## Flow child

An element inside a flow container (a stack of siblings governed by gap or vertical padding). Flow children use vertical-only padding because the container owns horizontal inset. See `SQUARE_PADDING_DEFAULT`.

## Flush list

A layout mode where cards stack edge-to-edge, separated by a single full-bleed rule rather than floating in a gutter. Apple calls this *plain*; Material calls it a *divider list*. Contrast: *Inset card*.

In the flush mode, each card's own left/right borders collapse away; the outer container provides the horizontal boundary, and each card's top (or bottom) border serves as the divider above (or below) it.

## Full-bleed

Content extending to the full width of its container with no horizontal inset. A full-bleed rule touches the container's left and right edges. A full-bleed image or header fills the container edge to edge.

In print, *bleed* is the area where ink extends past the trim line; *full-bleed* content has no margin. Web usage is analogous: no padding, no gutter, no inset.

## Gutter

The negative space between sibling elements, produced by a container's padding plus the gap between its children. The distinguishing feature of *inset cards*: they float in a gutter rather than sitting flush.

## Inline (padding role)

A small control or label within chrome or a container. May use asymmetric padding (more horizontal than vertical) where the text content dominates and the padding itself is invisible. One of the four padding roles. See `SQUARE_PADDING_DEFAULT`.

## Inset

Two related meanings — disambiguate by context.

1. **Padding inset**: horizontal space from a container's edge to its content. "Container owns inset" means horizontal padding belongs to the container, not its children. See `CONTAINER_OWNS_INSET`.
2. **Inset card** (layout mode): a card with four borders, floating in a gutter. Apple's `insetGrouped`. Contrast: *Flush list*.

## Inset card

A card with four borders, floating inside a gutter. Each card is visually complete on its own; neighbors are separated by surrounding negative space rather than a shared divider. Apple's `UITableView.Style.insetGrouped`. Contrast: *Flush list*.

## Luminance mode

Light or dark. The layer the OS calls "appearance" and CSS calls `color-scheme`. design-kit declares `color-scheme: light dark` on `:root` and resolves each *semantic token* with `light-dark()`; a `[data-luminance]` attribute on `:root` forces one mode regardless of OS preference. Preferred over *color scheme* in docs to avoid collision with the conversational sense of "scheme" (aesthetic).

## Mode

Ambiguous alone; always qualify: *luminance mode* (light/dark) or *contrast mode* (default/high-contrast). Not a synonym for *color theme*.

## Padding roles

The four element roles used to pick padding tokens: *container*, *chrome*, *inline*, *flow child*. Identify the role first, then pick a token, then apply square padding unless the role is inline or flow child. See `SQUARE_PADDING_DEFAULT`.

## Pane

A named region in a multi-pane layout: sidebar pane, main pane, inspector pane. Distinct from *panel* (a framed surface). Use *pane* for the slot, *panel* for a discrete framed surface inside it.

## Panel

A framed surface, typically inside a larger layout. Rarely used in design-kit because flat hierarchy discourages nested framed surfaces; prefer *card* for bounded content and *pane* for layout regions.

## Palette

The set of primitive color values under `primitive.color` in `tokens/design-tokens.json` (gray, purple, blue, teal, green, yellow, orange, red, each in shades 100–700). Palette values are never consumed directly by components; they feed *semantic tokens*. Do not use *palette* to mean light/dark variants or an aesthetic identity; those are *luminance mode* and *color theme*.

## Primitive token

A token whose value is a raw, context-free literal: `--color-gray-500`, `--spacing-xl`. Primitives emit the *palette* and the other foundational scales into CSS. Components never reference primitives directly; they go through *semantic tokens*.

## Rule

A thin horizontal line used as a divider between sections or rows. Canonical term in design-kit (print-typography heritage, fits the Swiss grid lineage). The utility `border-b` produces a thin rule; `border-b-heavy` produces an emphasis rule. Prefer *rule* over *divider* or *separator* in new work.

## Semantic token

A token whose value maps a *primitive token* to a role: `--color-bg`, `--color-text`, `--color-link`. Semantic tokens are where the active *color theme* and *luminance mode* resolve (via `light-dark()` today). Component CSS always references semantic tokens, never primitives.

## Separator

See *Rule*.

## Square padding

Same token on all four sides of an element. The default for containers and chrome. See `SQUARE_PADDING_DEFAULT`. The anti-pattern is *asymmetric padding* (different tokens across sides), which is only legitimate for *inline* or *flow child* roles.

## Theme

Prefer *color theme* when the axis is color. Unqualified *theme* is acceptable only when context removes ambiguity.

---

## Adding entries

New terms enter the glossary when they appear in two or more principles, docs, or component APIs. Entries should:

- Stay under ~6 lines.
- Cross-reference principles by `PRINCIPLE_NAME` rather than paraphrasing them.
- Prefer one canonical word per concept; list synonyms as stub entries that redirect.
- Avoid industry context beyond one citation (Apple / Material / print) unless the origin disambiguates usage.
