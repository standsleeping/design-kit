# Bento Grid Notation

A text-based shorthand for communicating bento layout intent to agents. Not a compiled format; a communication format designed to be unambiguous to an LLM, fast to type, and forgiving of imprecision.

## Structure

Two parts: a grid map and cell descriptions.

### Grid map

First line declares column proportions. Subsequent lines are the grid; each letter is one cell. Repeated letters indicate spanning. `.` marks empty cells.

```
cols: 1fr 2fr 1fr

a a a
a a a
b c d
b c e
b f f
g f f
g h i
```

The agent reads the grid, counts each letter's column span and row span, and generates the corresponding CSS grid placements.

### Cell descriptions

After the grid, one line per cell. Format: `letter: natural language description`. Include surface variant (filled, shaded, code, accent) and content type. No schema to remember.

```
a: hero banner, full-width image or bold statement. accent
b: sidebar navigation or table of contents
c: main article with heading, description, metadata. filled
d: metric (large number + label)
e: code snippet, scrollable. code bg
f: feature block spanning two columns. filled
g: paragraph with read-more at narrow widths
h: compressed tag list
i: small action button
```

## Conventions

| Pattern | Meaning |
|---------|---------|
| `a a a` | Cell `a` spans all columns in that row |
| `a` repeated vertically | Cell `a` spans multiple rows |
| `.` | Empty grid cell |
| `cols: 1fr 2fr 1fr` | Column width ratios |
| `filled`, `shaded`, `code`, `accent` | Surface variant keywords in cell descriptions |

## Example: hero + content layout

```
cols: 1fr 2fr 1fr

h h h
h h h
a b c
a b d
a b d
e f f
e f f
g g g

h: hero statement, large scale heading. accent
a: sidebar nav or metadata
b: main article content. filled
c: metric or key stat
d: code example, scrollable. code bg
e: secondary content or list
f: feature block with heading and description. filled
g: footer bar or call-to-action, full width. shaded
```
