# Glossary

Shared vocabulary for layout, padding, and structure across design-kit. When a principle or doc references one of these terms, link back to the entry here rather than redefining it in place.

Each entry: one-line definition, then clarifications or cross-references as needed. Entries are alphabetical.

## Action

A plain object describing an intent to change state (`{ type: 'increment' }`), passed to *dispatch* and interpreted by the *reducer*. Actions are the only input that changes application state. See the [runtime reference](runtime.md).

## Audit

A single check in design-kit's verification set, normalized to a uniform outcome (status + findings + remediation). *Audit* is the genus; its species are the **static audit** (no browser) and the **headless audit** (measures a rendered page). A **lint** is the text-scanning kind of static audit (regex/token checks over CSS and HTML); the token-pair contrast check is the one static audit that is not a lint. So every lint is a static audit, but not every static audit is a lint. All run from one registry via `design-kit build` and `design-kit audit`. See the [CLI reference](cli.md) and README "Build-time audits".

## Binding

A function that ties one DOM node to one *signal*, mutating the node in place when the signal changes: `bindText`, `bindAttr`, `bindClass`, `bindShow`, `bindValue`. A binding is an *effect* specialized to a single node and property. See the [runtime reference](runtime.md).

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

An element that holds other elements and owns both their inset (via its own square `padding`) and the rhythm between them (via its `gap`). Also one of the four padding roles. See `CONTAINER_OWNS_INSET`, `SQUARE_PADDING_DEFAULT`, and `PADDING_IS_INSET_ONLY`.

## Control min-width / min-height

Primitive sizing scales (`--control-min-width-sm` / `-md` / `-lg`, and matching `-min-height-*`) that set a *floor* on interactive controls so short labels still feel clickable without resorting to asymmetric padding. Companion property for the *inline* padding role under `PADDING_IS_INSET_ONLY`: a button gets square `padding` plus a `min-width` floor; the horizontal breathing comes from the floor, not from an asymmetric padding shape.

## Contrast mode

Default vs. high-contrast. The accessibility layer served by `prefers-contrast` and `forced-colors`. design-kit does not currently ship a high-contrast mode; the term is reserved so that when we do, it occupies its own vocabulary slot rather than colliding with *luminance mode* or *color theme*.

## Dispatch

The function that sends an *action* to the *reducer* and applies the result. `createApp` provides it, and calling `dispatch(action)` is the only way to change state. Updates are batched, so one dispatch notifies each *binding* at most once. See the [runtime reference](runtime.md).

## Divider

See *Rule*. Prefer *rule* in new work; *divider* is acceptable when discussing Material Design conventions directly.

## Effect

A reactive computation that runs immediately and re-runs whenever a *signal* it read changes; it may return a cleanup. The *binding* helpers and the effect helpers (`urlSyncEffect`, `localStorageEffect`, `dispatchOnEvent`) are built on it. Effects are owner-disposed (see the [runtime reference](runtime.md)).

## Flow child

An element inside a flow container (a stack of siblings governed by the container's `gap`). Flow children carry square (or zero) padding; the rhythm between them lives in the parent's `gap`, not in the child's vertical padding. See `SQUARE_PADDING_DEFAULT`, `CONTAINER_OWNS_INSET`, and `PADDING_IS_INSET_ONLY`.

## Flush layout

A layout mode where the chrome (header, footer, sidebars) is flush against the viewport edge and the content region inside the chrome is also edge-to-edge with the chrome. Surfaces inside stack flush, separated by full-bleed rules. The shell-scale companion of *Flush list*. Contrast: *Inset layout*. See `INSET_VS_FLUSH_LAYOUT` in system-principles.

## Flush list

A layout mode where cards stack edge-to-edge, separated by a single full-bleed rule rather than floating in a gutter. Apple calls this *plain*; Material calls it a *divider list*. The component-scale instance of *Flush layout*. Contrast: *Inset card*.

In the flush mode, each card's own left/right borders collapse away; the outer container provides the horizontal boundary, and each card's top (or bottom) border serves as the divider above (or below) it.

## Full-bleed

Content extending to the full width of its container with no horizontal inset. A full-bleed rule touches the container's left and right edges. A full-bleed image or header fills the container edge to edge.

In print, *bleed* is the area where ink extends past the trim line; *full-bleed* content has no margin. Web usage is analogous: no padding, no gutter, no inset.

## Gutter

The negative space between sibling elements, produced by a container's padding plus the gap between its children. The distinguishing feature of *inset cards*: they float in a gutter rather than sitting flush.

## Inline (padding role)

A small control or label within chrome or a container: button, badge, pill, table cell. Inline controls carry square padding (small-scale token) plus a `min-width` floor so short labels still feel clickable. The horizontal floor lives in `min-width`, not in asymmetric padding. One of the four padding roles. See `SQUARE_PADDING_DEFAULT` and `PADDING_IS_INSET_ONLY`.

## Inset

Two related meanings; disambiguate by context.

1. **Padding inset**: the uniform space from a container's edge to its content, expressed as square `padding` on the container. "Container owns inset" means the container's `padding` provides this space once, on all four sides, so children don't carry horizontal padding of their own. See `CONTAINER_OWNS_INSET` and `PADDING_IS_INSET_ONLY`.
2. **Inset card** (layout mode): a card with four borders, floating in a gutter. Apple's `insetGrouped`. Contrast: *Flush list*.

## Inset card

A card with four borders, floating inside a gutter. Each card is visually complete on its own; neighbors are separated by surrounding negative space rather than a shared divider. Apple's `UITableView.Style.insetGrouped`. The component-scale instance of *Inset layout*. Contrast: *Flush list*.

## Inset layout

A layout mode where the chrome (header, footer, sidebars) is flush against the viewport edge and the content region inside the chrome is a recessed field with a gutter on all sides. Surfaces inside float in the gutter; each owns its four borders. The shell-scale companion of *Inset card*. Contrast: *Flush layout*. See `INSET_VS_FLUSH_LAYOUT` in system-principles.

## Luminance mode

Light or dark. The layer the OS calls "appearance" and CSS calls `color-scheme`. design-kit declares `color-scheme: light dark` on `:root` and resolves each *semantic token* with `light-dark()`; a `[data-luminance]` attribute on `:root` forces one mode regardless of OS preference. Preferred over *color scheme* in docs to avoid collision with the conversational sense of "scheme" (aesthetic).

## Mode

Ambiguous alone; always qualify: *luminance mode* (light/dark) or *contrast mode* (default/high-contrast). Not a synonym for *color theme*.

## Padding roles

The four element roles used to pick padding tokens: *container*, *chrome*, *inline*, *flow child*. Identify the role first, then pick a token; padding is always square on every role. The role also determines which companion property carries the asymmetric concern that used to live in padding: `min-width` for inline controls, parent `gap` for flow children. See `SQUARE_PADDING_DEFAULT` and `PADDING_IS_INSET_ONLY`.

## Pane

A named region in a multi-pane layout: sidebar pane, main pane, inspector pane. Distinct from *panel* (a framed surface). Use *pane* for the slot, *panel* for a discrete framed surface inside it.

## Panel

A framed surface, typically inside a larger layout. Rarely used in design-kit because flat hierarchy discourages nested framed surfaces; prefer *card* for bounded content and *pane* for layout regions.

## Palette

The set of primitive color values under `primitive.color` in `tokens/design-tokens.json` (gray, purple, blue, teal, green, yellow, orange, red, each in shades 100–700). Palette values are never consumed directly by components; they feed *semantic tokens*. Do not use *palette* to mean light/dark variants or an aesthetic identity; those are *luminance mode* and *color theme*.

## Primitive token

A token whose value is a raw, context-free literal: `--color-gray-500`, `--spacing-xl`. Primitives emit the *palette* and the other foundational scales into CSS. Components never reference primitives directly; they go through *semantic tokens*.

## Reducer

A pure function `(state, action) => nextState` that is the single source of truth for application state. Returning the same state reference signals no change. The framework's state model follows the Hyperapp lineage (reducer plus effects).

## Rule

A thin horizontal line used as a divider between sections or rows. Canonical term in design-kit (print-typography heritage, fits the Swiss grid lineage). The utility `border-b` produces a thin rule; `border-b-heavy` produces an emphasis rule. Prefer *rule* over *divider* or *separator* in new work.

## Semantic token

A token whose value maps a *primitive token* to a role: `--color-bg`, `--color-text`, `--color-link`. Semantic tokens are where the active *color theme* and *luminance mode* resolve (via `light-dark()` today). Component CSS always references semantic tokens, never primitives.

## Separator

See *Rule*.

## Signal

A reactive value: a getter you call (`count()`) with `.set()` and `.peek()`. Reading a signal inside an *effect* subscribes that effect to it; setting it notifies subscribers. Signals are the transmission medium from *reducer* state to the DOM, not an independent state store. See the [runtime reference](runtime.md).

## Slice

One top-level key of the application state, exposed as its own *signal* by `createApp` (`state.count`). A *dispatch* updates only the slices whose values actually changed, so only the bindings reading those slices re-run.

## Slot

A composition point: an ordinary prop typed `Node | () => Node` that a component places in its output ("slots as props"). `children` is the single-slot case. The storybook fills slots from variant specs; at runtime you pass the prop or append imperatively. See [component-contract.md](component-contract.md).

## Square padding

Same token on all four sides of an element. The shape of padding on every element, regardless of role. Asymmetric padding (different values across sides) is the anti-pattern. The asymmetric concerns it tries to express (horizontal breathing for inline text, vertical rhythm between flow children, top-heavy emphasis) live in `min-width`, `gap`, and `margin` respectively. See `SQUARE_PADDING_DEFAULT` and `PADDING_IS_INSET_ONLY`.

## Theme

Prefer *color theme* when the axis is color. Unqualified *theme* is acceptable only when context removes ambiguity.

---

## Adding entries

New terms enter the glossary when they appear in two or more principles, docs, or component APIs. Entries should:

- Stay under ~6 lines.
- Cross-reference principles by `PRINCIPLE_NAME` rather than paraphrasing them.
- Prefer one canonical word per concept; list synonyms as stub entries that redirect.
- Avoid industry context beyond one citation (Apple / Material / print) unless the origin disambiguates usage.
