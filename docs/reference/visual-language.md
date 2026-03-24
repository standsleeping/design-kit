# Visual Language

## Identity

Data-forward interfaces that feel like well-designed developer tools: an IDE, a Bloomberg terminal, a thoughtfully formatted CLI output. Monospace typography carries structure. Greyscale carries hierarchy. Color is scarce and therefore meaningful. The aesthetic is modern and minimal, not nostalgically retro.

## Principles

### 1. Monospace is the default

The primary typeface is monospace. Proportional fonts are the exception, used only where monospace actively hinders readability (long prose paragraphs). Headings, labels, data, navigation, and UI chrome are all monospace. This creates natural grid alignment without effort.

### 2. Greyscale carries hierarchy

The full stone palette is the primary tool for establishing visual hierarchy. Dark text for primary content; medium grey for secondary; light grey for tertiary and chrome. Different font sizes and weights at different grey levels create clear information layers without needing color or decoration. Where two surfaces of different shade meet, a border provides clean separation.

### 3. Color is semantic, not decorative

Color appears only to encode meaning: status (fresh/stale/error), interactive affordance (links, focus), or data categories in charts. Outside of these roles, the interface is greyscale. When color does appear, its scarcity makes it immediately noticeable.

### 4. Strip decoration, not structure

Semantic structure serves comprehension: tables for tabular data, column headers for labeling, grouped sections for categories. These are not decoration; removing them loses information. What is decorative: card borders drawn around content, rounded-corner panels, drop shadow depth, boxes for visual grouping. Grouping is achieved through proximity, shared indentation, shared background shade, or a single structural border (one side only: left for hierarchy, bottom for sequence). If removing a border changes nothing about comprehension, remove it. If removing a table header or a section grouping makes data harder to scan, it was structural.

### 5. Density over whitespace

Favor compact presentation. Padding is tight. Line height is close. More information visible at once is better than fewer items with generous breathing room. The interface rewards scanning, not scrolling. This does not mean cramped; spacing is consistent and deliberate, just minimal. Spacing carries hierarchy: the gap between sections should be visibly larger than the gap between rows within a section. Tight inside, clear separation between.

### 6. Typography is structure

Weight, size, and shade create hierarchy without color or decoration. Use normal title or sentence casing; forced lowercase and forced uppercase are both affectations. Section labels are small and muted. Data values are regular weight. Emphasis uses weight (medium/semibold), never italic, never underline (except links). The font size range is narrow; hierarchy comes from weight and color more than from dramatic size differences.

### 7. Dividers reflect hierarchy

Borders and rules carry hierarchy just like text. A section boundary is a heavier division than a row boundary; they should not look the same. Differentiate through color (darker for major, lighter for minor), width, or absence. Row-level dividers within a tight monospace table can often be very faint or removed entirely; the grid alignment provides implicit structure. If two dividers at different levels look identical, one of them needs to change.

### 8. Let the data lead

Tables, numbers, and values are first-class. Column headers exist when needed but are understated (muted, lightweight). Data rows have no row-level decoration; the grid alignment of monospace text provides implicit structure. Right-align numbers. Use fixed-width formatting so values scan vertically. Order columns by importance: primary data (values, dates, counts) before metadata (frequency, classification, source). Drop columns whose information is already communicated by context; if rows are grouped by category, a category column within the table is noise.

## Token Application Guide

### When to use each font family

| Context | Font | Reasoning |
|---------|------|-----------|
| Body text, labels, headings | mono | Default; creates natural grid |
| Long prose (documentation, descriptions) | sans | Readability over density |
| Never | heading (Rubik) | Not part of this aesthetic |

### When borders appear

| Pattern | Treatment |
|---------|-----------|
| Table rows (minor separation) | Bottom border (1px, stone-200) or absent if alignment suffices |
| Section/category (major separation) | Bottom border (1px, stone-400) or heavier weight than row borders |
| Interactive focus | Focus ring (blue-600, standard accessibility pattern) |
| Adjacent surfaces of different shade | Border at the boundary for clean contrast |
| Navigation | None; text links with spacing |

### Background shading

Different surfaces use different shades. Where two shades meet, a border creates clean contrast.

| Surface | Background |
|---------|-----------|
| Page | stone-100 or stone-50 |
| Primary content area | white |
| Sidebar / secondary | stone-50 or stone-100 |
| Table header row | stone-100 |
| Table row hover | stone-50 |
| Recessed/inset | stone-200 |

### Color budget

| Meaning | Color | Usage |
|---------|-------|-------|
| Fresh / healthy / active | green-700 | Status dots, badges |
| Stale / warning | amber-700 | Status dots, badges |
| Error / critical | red-700 | Status dots, badges |
| Interactive / link | blue-600 | Links, focus rings |
| Everything else | stone palette | All chrome, text, backgrounds |

### Spacing defaults

Tight by default. Use the lower end of the spacing scale for internal padding (xs, sm, md). Use the mid-range (lg, xl) for section separation. The 2xl-4xl range is reserved for page-level margins only.

| Context | Spacing |
|---------|---------|
| Table cell padding | sm to md (0.25-0.5rem) |
| Section gap | lg to xl (0.75-1rem) |
| Page margin | 2xl (1.5rem) |
| Between label and content | xs to sm (0.125-0.25rem) |
