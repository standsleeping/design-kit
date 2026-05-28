# Visual Language

This document describes the aesthetic principles and specific choices that define design-kit's visual identity. The principles below govern all projects that use this design system.

For shared vocabulary (inset, flush, rule, chrome, gutter, full-bleed, padding roles), see `glossary.md`. For component consumption (CSS classes are canonical; the JS factory layer is internal storybook/test scaffolding), see `component-contract.md` § "Public surface: CSS classes".

## Identity

Data-forward interfaces that feel like well-designed developer tools: an IDE, a Bloomberg terminal, a thoughtfully formatted CLI output. Monospace typography carries structure. Greyscale carries hierarchy. Color is scarce and therefore meaningful. The aesthetic is modern and minimal, not nostalgically retro.

The design system draws from a specific historical chain: Swiss systems modernism (grids, hierarchy, institutional authority), aerospace standards-manual modernism (NASA/IBM procedural identity), machine-legibility typography (OCR, fixed-width rhythm, tabular document logic), and display-constrained experimental modernism (CRT/seven-segment letterform constraints). The illustrated taxonomy in `pages/taxonomy.html` documents these lineages with visual examples, prompt language, and typeface references.

## Principles

### 1. Monospace is the default

The system typeface is Recursive, a single variable font with five axes (MONO, CASL, wght, slnt, CRSV). The MONO axis at 1 (monospace) is the default; proportional (MONO 0) is used only where monospace actively hinders readability (long prose paragraphs). Headings, labels, data, navigation, and UI chrome are all monospace. This creates natural grid alignment without effort.

Because both monospace and proportional roles come from the same font, vertical metrics (line height, cap height, x-height) are shared across the axis. Mixing mono and proportional text in the same line or table does not break alignment. Typographic roles are expressed as axis positions, not font-family swaps: `--mono: 1` for structure, `--mono: 0` for prose.

Monospace is also a branding device. When headings, navigation, identity blocks, and data all share the same typographic voice, the typeface itself becomes the brand signature. A stacked monospace identity block (product name, organization, version or year) reads as a mark without requiring a logo. The monospace grid unifies every surface of the product into a single visual identity.

### 2. Greyscale carries hierarchy

The full gray palette is the primary tool for establishing visual hierarchy. Dark text for primary content; medium grey for secondary; light grey for tertiary and chrome. Different font sizes and weights at different grey levels create clear information layers without needing color or decoration. Where two surfaces of different shade meet, a border provides clean separation.

### 3. Color is semantic, not decorative

Color appears only to encode meaning: status (fresh/stale/error), interactive affordance (links, focus), or data categories in charts. Outside of these roles, the interface is greyscale. When color does appear, its scarcity makes it immediately noticeable.

For the vocabulary that separates *palette* (primitives), *luminance mode* (light/dark), *contrast mode* (default/high-contrast), and *color theme* (named aesthetic: `mono-purple` default, `monochrome`, `solarized`), see `glossary.md`. Components reference *semantic tokens* (`--color-bg`, `--color-link`), never primitives.

### 4. Strip decoration, not structure

Semantic structure serves comprehension: tables for tabular data, column headers for labeling, grouped sections for categories. These are not decoration; removing them loses information. What is decorative: card borders drawn around content, rounded-corner panels, drop shadow depth, boxes for visual grouping. Grouping is achieved through proximity, shared indentation, shared background shade, or a single structural border (one side only: left for hierarchy, bottom for sequence). Prefer single-side borders over full boxes. All corners are square; the token system enforces zero border-radius. No shadows exist in the token palette. The monospace grid demands sharp geometry; every lineage this system draws from (Swiss grids, NASA spec pages, OCR documents, seven-segment displays) uses right angles exclusively. If removing a border changes nothing about comprehension, remove it. If removing a table header or a section grouping makes data harder to scan, it was structural.

**ASCII structural ornament.** Plaintext characters can serve as structural devices within the monospace grid. Dot leaders align a label to a value across a wide column. Bracket-delimited labels (`[ ACTION ]`) mark interactive elements or section roles. Pipe-delimited lists (`Manual | Status | Pricing`) present inline navigation. Horizontal rules from repeated characters (`------`, `~~~`) separate sections at a visible but lightweight level. These are not decoration because they carry meaning: containment, separation, alignment. They belong to the monospace grid and reinforce the terminal aesthetic. The test remains the same: if removing the character sequence loses structural information, it is justified.

### 5. Density over whitespace

Favor compact presentation. Padding is tight. Line height is close. More information visible at once is better than fewer items with generous breathing room. The interface rewards scanning, not scrolling. This does not mean cramped; spacing is consistent and deliberate, just minimal. Spacing carries hierarchy: the gap between sections should be visibly larger than the gap between rows within a section. Tight inside, clear separation between.

**Transparent by default.** Badges, labels, and inline text elements have transparent backgrounds with no padding or border-radius. Reserve background color for major container surfaces (see Background shading below). Small elements should not compete for attention; let the content hierarchy do the work.

### 6. Typography is structure

Weight, size, and shade create hierarchy without color or decoration. Recursive's weight axis spans 300 (Light) to 900 (Black), enabling dramatic scale contrast: Light for muted chrome, Regular for body, Semibold for table headers, ExtraBold/Black for display and hero typography. Section labels are small and muted. Data values are regular weight. Emphasis uses weight (medium/semibold), never underline (except links). The slant axis (`--slnt: -12`) serves one specific role: distinguishing code comments. It is not general-purpose emphasis.

**Case treatment.** Normal title or sentence casing is the default for body text and most labels. Uppercase with letter-spacing is acceptable for headings and section labels when it reinforces the monospace/terminal identity; it signals structural landmarks in a page of otherwise quiet text. Do not use forced lowercase as an affectation.

**Optical scaling for inline code.** Monospace glyphs consume 20–30% more horizontal space than proportional glyphs at the same font-size and read visually heavier in mixed prose. When inline `<code>` appears inside proportional body text, scale it down (`0.9em`) so it blends rather than dominates. Block `<pre>` code is exempt; it lives in its own typographic context. This mirrors GitHub Primer (85%), Bootstrap, and the Tailwind Typography plugin.

**Rendered heading markers.** The `#` and `##` characters from markdown can be rendered literally as structural prefixes alongside heading text. This treats them as visible typographic elements (not hidden semantic markup), reinforcing the plaintext aesthetic. Use this treatment selectively; it works best in editorial or changelog contexts where the raw-document feel is intentional.

### 7. Rules reflect hierarchy

Borders and rules carry hierarchy just like text. A section boundary is a heavier division than a row boundary; they should not look the same. Differentiate through color (darker for major, lighter for minor), width, or absence. Row-level rules within a tight monospace table can often be very faint or removed entirely; the grid alignment provides implicit structure. If two rules at different levels look identical, one of them needs to change.

### 8. Let the data lead

Tables, numbers, and values are first-class. Column headers exist when needed but are understated (muted, lightweight). Data rows have no row-level decoration; the grid alignment of monospace text provides implicit structure. Right-align numbers. Use fixed-width formatting so values scan vertically. Order columns by importance: primary data (values, dates, counts) before metadata (frequency, classification, source). Drop columns whose information is already communicated by context; if rows are grouped by category, a category column within the table is noise. Inline visualizations (sparklines, mini charts) sit alongside data in the table; they supplement the numbers, not replace them. Charts are subordinate to the table structure, not standalone elements.

**Demote metadata.** Technical identifiers, internal codes, and timestamps are for the system, not the reader. Make them small, light, and peripheral. If metadata appears at the same visual weight as content, it competes for attention it hasn't earned.

**Table density and progressive disclosure.** Large tables (10+ rows) need uniform row heights to preserve the scanning grid. When cell content varies in length, constrain it with `line-clamp` (2-3 lines) and provide an expand affordance. Secondary content within a cell (file references, metadata links, context notes) collapses behind a count indicator ("3 refs") that expands on click. When a column contains few distinct values that group rows (priority, status, category), replace it with section header rows and reclaim the horizontal space. Within a group, deduplicate consecutive identical values in other columns; show the value on the first row only. Add a subtle hover state (`gray-50`) so the eye can track across wide rows.

### 9. Dual visual register

A design system can operate with two coherent visual languages applied to different contexts. One register is raw and editorial: full monospace typography, the Casual axis engaged (`--casl: 0.3` to `0.5`), minimal chrome, plaintext structural ornament, content as interface. This register suits marketing pages, changelogs, landing pages, and anywhere the product voice should feel direct and unmediated. The other register is structured and conventional: multi-column layouts, proportional body text (`--mono: 0`), Linear axis (`--casl: 0`), navigational sidebars, and standard documentation patterns. This register suits reference documentation, API guides, and long-form technical content.

The two registers share foundational tokens (the Recursive typeface, color palette, spacing scale, border treatments) and key identity markers (monospace headings, uppercase section labels, restrained color, terminal-inflected ornament). The Casual axis is the primary dial between registers: Linear (CASL 0) for institutional precision; Casual (CASL 0.3-0.5) for editorial warmth. They diverge in density, layout, and the ratio of monospace to proportional text. Both must feel like the same product. If a user moves from a changelog page to a reference page, the transition should feel like changing rooms in the same building, not visiting a different site.

### 10. Interactive elements are understated

Interactive affordances (search bars, theme toggles, collapsible sections, copy buttons, code block toolbars) must respect the monospace/greyscale discipline. They should never compete with content for attention.

Prefer icon-only controls where the action is universally understood (clipboard icon for copy, magnifying glass for search, chevron for expand/collapse). Show secondary actions on hover or focus rather than permanently. Search inputs use a simple text field with a keyboard-shortcut hint (`Cmd+K`) rather than a prominent styled bar. Theme toggles (light/dark/system) are small, peripheral controls placed in headers or footers. Code block toolbars (copy, additional actions) sit in the top corner of the block and use muted icons that become visible on hover.

All interactive elements use the same gray palette as surrounding chrome. The only color exception is focus rings and active-state indicators, which use the standard interactive color (purple-500) for accessibility.

### 11. Inset and flush at every level

The structural mode of a region is its choice between **inset** and **flush**. Inset surfaces own their boundary and float in a gutter; flush surfaces share their boundary with siblings and stack edge-to-edge. The dichotomy operates at every nesting level: the layout shell, the regions inside the chrome, the surfaces inside those regions, the items inside those surfaces.

**Layout level: chrome is always flush; the content region carries the layout's identity.**

The viewport-locked shell forces chrome (header, footer, sidebars) to occupy every edge of the window. Chrome is flush by structural necessity. It owns the boundary against the viewport. What varies is the mode of the *content region* the chrome surrounds.

| Layout mode | Content region | Surfaces inside |
|---|---|---|
| **Inset layout** | Recessed field with a gutter on all sides; background distinct from chrome | Surfaces float in the gutter; each owns four borders |
| **Flush layout** | Edge-to-edge with chrome; shares the chrome's background or is marked by a rule | Surfaces stack flush; separated by full-bleed rules |

In an inset layout, the field's recessed background is what makes the gutter visible against the chrome. In a flush layout, the chrome and the content region share a surface; the rule between items carries the structure. A single application can compose both (an inset layout in one pane, a flush layout in another), but the boundary between them must be the chrome itself; two modes meeting inside the same content region is the drift signal. See `INSET_VS_FLUSH_LAYOUT` in system-principles.

**Surface / item level: the same dichotomy, one nesting down.**

Within either layout mode, individual elements still divide into inset *surfaces* and flush *items*. The asymmetry is ownership: a surface owns its own boundary (four borders, square corners) and floats in its parent's gutter; an item doesn't own a boundary. The column it lives in does, via a sibling rule or the parent's border. Get the ownership right and every downstream choice (active indicator, padding role, background) follows. Scrollbars are not part of the boundary contract — they are never painted; see SCROLLBAR_HIDDEN_BY_DEFAULT.

| Property | Surface (inset) | Item (flush) |
|---|---|---|
| Boundary | Self-owned: four borders, square corners | Column-owned: shared rule with siblings |
| Background | May recess (e.g., `--color-code-bg`) so the card reads as a distinct surface against the page | Page bg by default; active state uses full-bleed `--color-selected-bg` |
| Padding | Square (xl–3xl), owned by the surface | Square or zero on the item; horizontal inset and vertical rhythm both owned by the container (`padding` + `gap`) |
| Sibling separation | Gutter (parent's flex/grid gap) | None: siblings touch; the rule between them does the separating |
| Active indicator | Border-color shift on the four-side border + `--color-selected-bg` fill | Single-side border (left for vertical lists, bottom for horizontal) at `--border-width-medium`, `--color-link` + full-bleed `--color-selected-bg` |
| Examples | Modals, code blocks, expandable cards, preview cards | Menu items, nav rows, scroll-list rows, sticky-toc entries, collapsible-section headers, table rows |

The most common drift is treating an item as a surface: a row with four borders and a radius. Even when the radius token resolves to 0, the four drawn lines still leak card vocabulary into a row context. Ask whether the element's neighbors are siblings of the same kind (item) or distinct content blocks (surface). Mixing layout modes inside a single content region is the same drift one nesting up: a flush-mode list that draws four borders around each row leaks card vocabulary; an inset-mode card whose left edge touches the field's interior breaks the gutter that defines the mode.

See `pages/inset-vs-flush.html` for the canonical side-by-side rendering.

### 12. Chrome strip heights are quantized

A chrome strip (a topbar in main, a NavStack header in a sidebar, a sticky-TOC summary at the top of a scroll body) is a peer-rail member: its top or bottom edge aligns horizontally with sibling strips across the columns at the same y. The shared height comes from a single base token plus a cascading multiplier.

- **Base:** `--layout-chrome-bar-h` (defaults to `2.5rem`), the height of one chrome row.
- **Multiplier:** `--chrome-bar-rows` (defaults to `1`), set on `.dk-app-shell-body`; cascades to every chrome strip inside the shell. A page that needs a two-row top rail (e.g., a filter strip above a results strip) declares it once:

  ```html
  <div class="dk-app-shell-body" data-chrome-rows="2">
  ```

  Every chrome strip inside reads `height: calc(var(--layout-chrome-bar-h) * var(--chrome-bar-rows, 1))` and grows together. No per-component opt-in; coordination is automatic.

- **Local override:** a single strip with a genuinely different role can shadow the multiplier inline (`style="--chrome-bar-rows: 1"`), visible in markup, not buried in CSS.

Half-row offsets are structurally impossible: legal chrome heights are integer multiples of the base. The border audit's near-rail check (`pages/border-audit.html`) is the enforcement backstop for strips that escape the cascade. See `PEER_RAIL` in system-principles for the full principle text including the quantization sharpening.

## Content Patterns for Developer Documentation

These are structural patterns for presenting technical content. They describe information architecture, not visual styling; the principles above govern how they look.

### Tabbed code blocks

When the same operation can be expressed in multiple languages or tools, present them in a tabbed container. Tabs sit directly above the code block. The active tab is visually connected to the block below it (no border between them); inactive tabs are muted. Each tab switches the code content without changing the surrounding prose. Common tab sets: language variants (TypeScript / Python / Go / cURL), environment variants (development / production), or tool variants (SDK / HTTP).

### API parameter documentation

Document each parameter as a distinct entry with a consistent structure: parameter name in monospace (bold or semibold), followed by a type badge (`string`, `object`, `boolean`), followed by a `required` tag where applicable, followed by a description. The name, type, and tag sit on one line or visual row; the description follows immediately below or inline. Group parameters by context (path parameters, query parameters, request body fields). Nested object fields are indented under their parent.

### Progressive configuration build-up

Introduce a concept, then show its configuration, then demonstrate usage. This three-beat pattern (concept, config, action) prevents the reader from encountering configuration without context or examples without setup. Each beat can be a short paragraph followed by a code block. The sequence builds confidence: the reader understands why before encountering how.

### Numbered step sequences

Multi-step procedures use numbered lists where order matters. Each step is a single action; compound steps are broken apart. Steps can contain code blocks, and each code block shows only what that step adds or changes. Avoid presenting a complete configuration at step one; build it up across steps so the reader can follow the accumulation.

## Navigation Patterns

### Drill-down navigation (navigation stack)

Hierarchical menus follow the iOS-style navigation stack pattern: a stack of menu levels, push by tapping a row marked with a chevron (`›`), pop via a `Back` row at the top. Levels are independent. Each renders a flat list of items with its own section structure. State is the path through levels, not a tree expansion. This is the model used by `nav-stack`.

The stack and the visible chrome are orthogonal. A user can drill into a sublevel and then collapse the sidebar; the stack is preserved so re-expanding restores the same level. Conversely, a viewport-driven auto-collapse doesn't pop the stack.

**All rows share a horizontal channel.** Every row in a level (the back row, section headers, and items) shares the same left inset (same padding-left + same `border-left-medium-transparent` indicator slot). The back row is the *first item* of the level, not a separate header element with different padding rules. When the chrome strip wrapping a row needs a height (to feel like a chrome bar at root level when there's only a title), use `min-height`, not `height`; a fixed pixel height creates dead vertical space when the contained content is shorter.

### Sidebar tri-state

A collapsible sidebar has three display states, not two: `expanded` (full width with labels), `icon` (narrow strip with a single uppercase letter or glyph per row), and `hidden` (off-screen via transform in overlay mode, or zero width in inline mode). Inline mode supports `expanded` and `icon`; overlay mode supports `expanded` and `hidden`. The tri-state encoding (rather than a boolean `collapsed`) makes nonsensical combinations explicit and lets the same prop drive both inline and overlay behaviors.

The state propagates to children via `[data-state]` attribute selectors. A sidebar with `data-state="icon"` causes nav-stack and similar children to render their icon-only treatment automatically. The consumer doesn't wire two props in lockstep.

### Selected-item indicators

Selected-item indicators are flush with the container's edge regardless of the row's inner padding. The bordered axis is a single side; never two or four. The active treatment is reserved for *items* (Principle 11), never *surfaces*.

| Container axis | Indicator | Examples |
|---|---|---|
| Vertical (sidebar, list, drill-down nav) | Left border (`border-width-medium`, `color-link`) plus optional `color-selected-bg` fill (full-bleed) | `dk-nav-stack`, `dk-sticky-toc`, `dk-scroll-list`, sidebar component links |
| Horizontal (tab bar, segmented control, code-block tabs) | Bottom border (`border-width-medium`, `color-link`) plus color shift on the label | `dk-tab-bar`, `dk-code-block` tabs |
| Tabular row (table body) | Row-level outline (`border-width-thin`, `color-hover-outline`) plus `color-selected-bg` fill | `dk-table` clickable rows |

Hover and focus reuse the same border channel with muted fills; purple is reserved for the active item. Background fill is optional, but if present it must extend to the row's edges (full-bleed); a fill that leaves negative space on the side leaks the inset-card treatment into an item context.

In a sidebar's icon state the row centers around its icon, but the left-border indicator stays at the container's edge regardless.

The active border, the focus ring, hover, and disabled all live on the same element: the focusable child (`<a>`, `<button>`), not on a structural wrapper (`<li>`). Putting the active indicator on the wrapper while the focus ring lives on the link puts the two at different x-coordinates and produces a visible gap between them when both fire. Promote level indents and any decorations into the focusable element so the wrapper stays a pure semantic shell. See `STATE_BELONGS_TO_INTERACTIVE` in system-principles.

### Auto-collapse on viewport shrink

A workspace shell with a sidebar typically auto-compresses on smaller viewports. A common breakpoint set:

| Viewport | Sidebar behavior |
|---|---|
| ≥1024px | inline + expanded |
| 640–1024px | inline + icon strip |
| <640px | overlay + hidden (toggle slides it in over content) |

User toggles act as a *latched override*: once the user manually picks a state, that choice wins until the viewport crosses a breakpoint, which resets the override. Selecting an item in overlay mode also auto-dismisses (phone-drawer convention).

## Token Application Guide

### When to use each axis setting

| Context | Axis setting | Reasoning |
|---------|-------------|-----------|
| Body text, labels, headings | `--mono: 1` | Default; creates natural grid |
| Long prose (documentation, descriptions) | `--mono: 0` | Readability over density |
| Editorial/marketing contexts | `--mono: 1; --casl: 0.3` | Subtle brush warmth for personality |
| Code blocks | `--mono: 1; --casl: 0` | Always linear mono for code |
| Code comments | `--mono: 1; --slnt: -12` | Slant distinguishes comments from code |
| Table column headers, captions | `--mono: 1` (semibold, uppercase) | Weight and case distinguish structural labels from data |
| Display/hero typography | `--mono: 1; font-weight: 800` | Scale contrast with extended weight range |

### When borders appear

| Pattern | Treatment |
|---------|-----------|
| Table rows (minor separation) | Bottom border (1px, gray-200) or absent if alignment suffices |
| Section/category (major separation) | Bottom border (1px, gray-400) or heavier weight than row borders |
| Interactive focus | Focus ring (purple-500, standard accessibility pattern) |
| Adjacent surfaces of different shade | Border at the boundary for clean contrast |
| Navigation | None; text links with spacing |
| Fieldset-style bordered sections | Thin border (1px, gray-300) around content; heading label breaks the top edge, creating a titled container. Use sparingly for grouping related controls or pricing tiers. |
| Changelog metadata block | Bottom rule (gray-300) separating the metadata header (date, author, feature labels) from the entry body |

### Background shading

Different surfaces use different shades. Where two shades meet, a border creates clean contrast.

| Surface | Background |
|---------|-----------|
| Page | gray-100 or gray-50 |
| Primary content area | white |
| Sidebar / secondary | gray-50 or gray-100 |
| Table header row | gray-100 |
| Table row hover | gray-50 |
| Recessed surface | gray-200 |

### Color budget

| Meaning | Color | Usage |
|---------|-------|-------|
| Fresh / healthy / active | green-700 | Status dots, badges |
| Stale / warning | amber-700 | Status dots, badges |
| Error / critical | red-700 | Status dots, badges |
| Interactive / link | purple-500 | Links, focus rings |
| Required tag | red-700 | API parameter "required" indicator |
| Everything else | gray palette | All chrome, text, backgrounds |

### Spacing defaults

Tight by default. Use the lower end of the spacing scale for internal padding (xs, sm, md). Use the mid-range (lg, xl) for section separation. The 2xl-4xl range is reserved for page-level inset only.

| Context | Spacing |
|---------|---------|
| Table cell padding | sm to md (0.25-0.5rem) |
| Section gap | lg to xl (0.75-1rem) |
| Page inset | 2xl (1.5rem) |
| Between label and content | xs to sm (0.125-0.25rem) |

### Padding: always square, role determines scale

**Padding is always one token on all four sides.** It represents a box's *inset* (the space from its border to its content), and a box has one inset. Asymmetric padding (`padding: sm md`, `padding: md 0`, `padding: lg md sm`) makes elements look over-indented and visually unbalanced; it also conflates inset with other concerns (horizontal breathing for inline text, vertical rhythm between flow children, top-heavy emphasis) that each belong in their own property.

Before writing any padding declaration, identify the element's role. The role picks the *token*, not the shape:

| Role | What it is | Token range | Companion property | Examples |
|------|-----------|-------------|---------------------|---------|
| Container | Primary content surface | `xl` to `3xl` | — | Code blocks, panels, page sections |
| Chrome | Utility strip attached to a container | `lg` to `xl` | — | Toolbars, status bars, filter bars |
| Inline | Small control within chrome or a container | `sm` to `md` | `min-width` for horizontal floor | Buttons, badges, table cells |
| Flow child | Element inside a flow container | `xs` to `sm` (or `0`) | Parent's `gap` for rhythm | List items, derivation steps, stack children |

The rule: **role first, then token, padding is always square.** A toolbar is chrome, not a container; a status bar is chrome, not inline. A list item inside a padded container is a flow child, not a container.

Asymmetric concerns migrate out of padding into the property whose name matches the concern:

- **Inline controls** that need horizontal breathing for short labels: square padding plus `min-width: var(--control-min-width-md)` (or `-sm` / `-lg` per context). The horizontal floor lives in `min-width`, where the concern is named.
- **Flow children** that need vertical rhythm between rows: square (or zero) padding on the child plus `gap` on the parent. The rhythm lives in `gap`, where the concern is named.
- **Top-heavy or bottom-heavy emphasis** (a section header that wants extra space above it): square padding plus rhythm in the parent's `gap` (and, when the gap above the header differs from the regular section rhythm, a structural sibling spacer). The layout concern lives in `gap` or the spacer, where it is named. See `NEVER_MARGIN` in system-principles.

### Container owns inset, children own flow

Both inset and rhythm belong to the container. `padding` owns the inset (square, all four sides). `gap` owns the rhythm between siblings. Children own neither. They have square or zero padding and contribute only their content.

```css
/* Container owns both inset and rhythm */
.block {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-md);   /* inset: square */
  gap: var(--spacing-sm);       /* rhythm between children */
}

/* Children carry square (or zero) padding */
.block-item {
  padding: 0;                   /* or square, if the row needs its own inset */
}
```

This collapses the older split (`padding: 0 X` on the container, `padding: X 0` on the child) into one property per concern at the container level. Both elements have square padding; the asymmetric flow-rhythm concern has moved into `gap`, where it is named.

### Chrome with structural asymmetry

A small, named set of chrome components keep asymmetric padding because the asymmetry is *structural*: it is a load-bearing visual property of the component, not a compensation for short labels or vertical rhythm. Square padding would make these components actively wrong, not merely inconvenient. The exception is narrow and exhaustively listed; new chrome joins the roster by review, not by adding a `padding-lint: ok` comment.

| Component | Padding | Structural property |
|-----------|---------|---------------------|
| `.dk-tab-bar-tab` | `xs 0` | The bottom-border indicator is the visual edge of the active tab and aligns under the text. Horizontal padding would push the indicator inward of the label, breaking that alignment. |
| `.dk-segmented-toggle-button` | `sm lg` | Buttons share a continuous left/right border across siblings; horizontal padding carries the visual segmentation. Vertical padding cannot substitute. |
| `.dk-scroll-list-item` | `sm lg` | A full-bleed `border-bottom` separates rows; horizontal padding is the row's only inset because the bottom border owns the bottom edge. |

Components that happen to be close to square (e.g., `.dk-menu-item` at `md` square, `.dk-bottom-tab-bar-tab` at `sm md`) are *not* on this roster. They are individual cleanup candidates against `SQUARE_PADDING_DEFAULT`, not tier-by-design.

The `control-audit` page (`pages/control-audit.html`) excludes the structural-chrome roster from its square-padding pass/fail tally; the rows still render with their measurements, but the Square? column is marked warn rather than fail. The `padding-lint: ok` comment on each chrome rule is the build-level expression of the same exemption.

### Scroll containers

One scroll-container configuration applies to every overflow region in the system: the container scrolls, but the bar is never painted. This is the contract codified in `SCROLLBAR_HIDDEN_BY_DEFAULT`.

```css
.scroll-region {
  overflow-y: auto;            /* or overflow-x: auto for horizontal leaves */
  scrollbar-width: none;       /* Firefox 64+ */
}
.scroll-region::-webkit-scrollbar {
  display: none;               /* Chromium, Safari, Edge */
}
```

Because no bar is rendered, no gutter is ever reserved; children always paint to the column edge, and layout cannot shift between scrollable and non-scrollable states. This collapses what used to be three modes (invisible-gutter, boundary-rail, transient-thumb) into a single recipe that works regardless of layout mode, child surface tint, or platform scrollbar style.

Skip overflow declarations entirely on regions guaranteed never to overflow.

When a "more below" or "more to the right" cue genuinely matters (typically wide horizontal scroll inside a table or code block), supplement the scroll container with a CSS mask-image fade on its parent. The fade is a separate affordance from the bar and does not reintroduce any of the failure modes the principle closes; canonical implementation: `dk-table-wrap`.

When a scroll container holds both a sticky chrome bar (app bar, section header) at `top: 0` and sticky cell content (`<thead>` cells, sub-section headers) at `top: <chrome-height>`, give the chrome a higher stacking layer than the in-flow stickies. Same `z-index` plus DOM order means the later element (the table header) paints over the chrome in the overlap band, and content briefly appears to sit above the bar before disappearing under it. Use `--z-chrome` for the bar and `--z-sticky` for in-content stickies; both stay below `--z-overlay`.

### Bookend frame for flush dividers

When a horizontal rule must function as a section divider with no padding gap above or below (typically wrapping a flush scrollable region between two sections), the rule cannot live as a child element's `border`. The child only spans its own width, so its border stops short of the column edge. Wrap the content in a *frame* element that owns the full column width and the divider role:

```html
<section class="section-frame-host">…blurb…</section>
<div class="frame">
  <div class="content">…</div>
</div>
<section class="section-after-frame">…next section…</section>
```

The frame carries the top and bottom rules and extends pane-edge to pane-edge. The surrounding sections surrender their adjacent padding to it: the section above zeros its `padding-bottom` and `border-bottom`; the section below zeros its `padding-top`. The frame's bottom rule then serves as the structural section divider with zero gap. Canonical implementation: `pages/inset-vs-flush.html`.

### Structural ornament patterns

These plaintext devices replace graphical decoration within the monospace grid.

| Pattern | Usage | Example |
|---------|-------|---------|
| Dot leaders | Align a left-hand label to a right-hand value across a wide measure | `2026-03-15  Added webhook support ............ jdoe` |
| Bracket-delimited labels | Mark interactive elements, call-to-action links, or section roles | `[ VIEW DOCS ]`, `[ REQUIRED ]` |
| Pipe-delimited lists | Inline navigation or compact horizontal lists | `Manual | Status | Pricing | Terms` |
| Horizontal rules | Section separation; character choice signals weight | `------` (light), `======` (heavy), `~~~` (soft) |
| Asterisk bullets | List items in editorial/changelog contexts | `* Added repository mirroring` |
| Rendered heading markers | Visible `#` or `##` prefixes on headings in editorial contexts | `## Changelog` rendered with literal `##` |

### Data visualization

Inline charts follow the same greyscale discipline as the rest of the interface. They are small, dense, and embedded in context (inside a table cell, next to a value) rather than presented as standalone elements.

| Element | Treatment |
|---------|-----------|
| Line/stroke | gray-500, 1px |
| Data points | gray-500, small circles (r=1.5) |
| Filled area | gray-200 (lighter shade beneath the line) |
| Axes, gridlines, labels | Absent; the surrounding table provides context |
| Size | Compact; sized to fit within a table row (e.g., 120x24px) |

### Icons

A curated set of 15×15 icons (Radix Icons, vendored under `components/icons/`) covers the system's icon needs. Components that accept an `icon` prop look up the name in `components/system/icons.js`; unknown names fall back to literal text, so the prop stays backwards-compatible with bare-string glyphs.

Icons size with their host's `font-size` through the `.dk-icon` utility (`width: 1em; height: 1em`); a 32 px button rendering text at `--font-size-sm` shows a 14 px icon. Color flows through `currentColor`, so setting `color: var(--color-text)` on the parent is enough.

The registry is curated, not exhaustive. Five categories cover what a typical interface needs:

| Category | Use for | Examples |
|---|---|---|
| direction | Disclosure and navigation arrows | `chevron-down`, `arrow-left` |
| action | State-changing controls | `cross-1`, `check`, `trash` |
| navigation | Persistent UI affordances | `hamburger-menu`, `magnifying-glass` |
| status | Status and meta indicators | `info-circled`, `bell` |
| content | Resource-type markers | `file-text`, `code` |

The full list with per-icon usage guidance is in the Icons section of `index.html`. To add an icon, drop the `.svg` into `components/icons/` and append an entry to `CURATED_ICONS` in `src/design_kit/icon_registry.py`; the build regenerates `components/system/icons.js`.

Charts use no color unless encoding semantic meaning (e.g., a red segment for a threshold breach). The default chart is entirely greyscale. Prefer server-rendered inline SVG over client-side charting libraries; it keeps the page dependency-free and renders instantly.
