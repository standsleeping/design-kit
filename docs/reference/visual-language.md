# Visual Language

This document describes the aesthetic principles and specific choices that define design-kit's visual identity. The principles below govern all projects that use this design system.

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

### 4. Strip decoration, not structure

Semantic structure serves comprehension: tables for tabular data, column headers for labeling, grouped sections for categories. These are not decoration; removing them loses information. What is decorative: card borders drawn around content, rounded-corner panels, drop shadow depth, boxes for visual grouping. Grouping is achieved through proximity, shared indentation, shared background shade, or a single structural border (one side only: left for hierarchy, bottom for sequence). Prefer single-side borders over full boxes. All corners are square; the token system enforces zero border-radius. No shadows exist in the token palette. The monospace grid demands sharp geometry; every lineage this system draws from (Swiss grids, NASA spec pages, OCR documents, seven-segment displays) uses right angles exclusively. If removing a border changes nothing about comprehension, remove it. If removing a table header or a section grouping makes data harder to scan, it was structural.

**ASCII structural ornament.** Plaintext characters can serve as structural devices within the monospace grid. Dot leaders align a label to a value across a wide column. Bracket-delimited labels (`[ ACTION ]`) mark interactive elements or section roles. Pipe-delimited lists (`Manual | Status | Pricing`) present inline navigation. Horizontal rules from repeated characters (`------`, `~~~`) separate sections at a visible but lightweight level. These are not decoration because they carry meaning: containment, separation, alignment. They belong to the monospace grid and reinforce the terminal aesthetic. The test remains the same: if removing the character sequence loses structural information, it is justified.

### 5. Density over whitespace

Favor compact presentation. Padding is tight. Line height is close. More information visible at once is better than fewer items with generous breathing room. The interface rewards scanning, not scrolling. This does not mean cramped; spacing is consistent and deliberate, just minimal. Spacing carries hierarchy: the gap between sections should be visibly larger than the gap between rows within a section. Tight inside, clear separation between.

**Transparent by default.** Badges, labels, and inline text elements have transparent backgrounds with no padding or border-radius. Reserve background color for major container surfaces (see Background shading below). Small elements should not compete for attention; let the content hierarchy do the work.

### 6. Typography is structure

Weight, size, and shade create hierarchy without color or decoration. Recursive's weight axis spans 300 (Light) to 900 (Black), enabling dramatic scale contrast: Light for muted chrome, Regular for body, Semibold for table headers, ExtraBold/Black for display and hero typography. Section labels are small and muted. Data values are regular weight. Emphasis uses weight (medium/semibold), never underline (except links). The slant axis (`--slnt: -12`) serves one specific role: distinguishing code comments. It is not general-purpose emphasis.

**Case treatment.** Normal title or sentence casing is the default for body text and most labels. Uppercase with letter-spacing is acceptable for headings and section labels when it reinforces the monospace/terminal identity; it signals structural landmarks in a page of otherwise quiet text. Do not use forced lowercase as an affectation.

**Rendered heading markers.** The `#` and `##` characters from markdown can be rendered literally as structural prefixes alongside heading text. This treats them as visible typographic elements (not hidden semantic markup), reinforcing the plaintext aesthetic. Use this treatment selectively; it works best in editorial or changelog contexts where the raw-document feel is intentional.

### 7. Dividers reflect hierarchy

Borders and rules carry hierarchy just like text. A section boundary is a heavier division than a row boundary; they should not look the same. Differentiate through color (darker for major, lighter for minor), width, or absence. Row-level dividers within a tight monospace table can often be very faint or removed entirely; the grid alignment provides implicit structure. If two dividers at different levels look identical, one of them needs to change.

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
| Recessed/inset | gray-200 |

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

Tight by default. Use the lower end of the spacing scale for internal padding (xs, sm, md). Use the mid-range (lg, xl) for section separation. The 2xl-4xl range is reserved for page-level margins only.

| Context | Spacing |
|---------|---------|
| Table cell padding | sm to md (0.25-0.5rem) |
| Section gap | lg to xl (0.75-1rem) |
| Page margin | 2xl (1.5rem) |
| Between label and content | xs to sm (0.125-0.25rem) |

### Padding: square by default, role determines scale

**Default to square padding** (same token on all four sides). Asymmetric padding (more horizontal than vertical) is the single most common layout mistake; it makes elements look over-indented and visually unbalanced. Only use asymmetric padding at inline scale where the text content dominates and the padding itself is invisible.

Before writing any padding declaration, identify the element's role:

| Role | What it is | Padding | Token range | Examples |
|------|-----------|---------|-------------|---------|
| Container | Primary content surface | Square | `xl` to `3xl` | Code blocks, panels, page sections |
| Chrome | Utility strip attached to a container | Square | `lg` to `xl` | Toolbars, status bars, filter bars |
| Inline | Small control within chrome or a container | May be asymmetric | `sm` to `md` | Buttons, badges, table cells |
| Flow child | Element inside a flow container | Vertical only | `xs` to `sm` | List items, derivation steps, stack children |

The rule: **role first, then token, then square unless inline or flow child.** A toolbar is chrome, not a container; a status bar is chrome, not inline. A list item inside a padded container is a flow child, not a container. Getting the role wrong produces padding that is visibly too large or too small.

### Container owns inset, children own flow

Horizontal padding belongs on the container; children handle only vertical spacing (via gap or vertical padding with zero horizontal). This prevents compounding inset when both container and children apply horizontal padding, and ensures all children share a consistent left/right edge without declaring it individually.

```css
/* Container sets horizontal inset */
.block {
  display: flex;
  flex-direction: column;
  padding: 0 var(--spacing-md);
}

/* Children set only vertical flow spacing */
.block-item {
  padding: var(--spacing-sm) 0;
}
```

When a child needs the `padding` shorthand for vertical values, use longhand properties (`padding-top`, `padding-bottom`) to avoid clobbering the zero horizontal padding.

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

Charts use no color unless encoding semantic meaning (e.g., a red segment for a threshold breach). The default chart is entirely greyscale. Prefer server-rendered inline SVG over client-side charting libraries; it keeps the page dependency-free and renders instantly.
