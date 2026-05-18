"""Generate a preview HTML page that showcases the design kit tokens."""

from __future__ import annotations

import json
from pathlib import Path

from design_kit.icon_registry import CURATED_ICONS, ICON_CATEGORIES, normalise_svg
from design_kit.token_css import GOOGLE_FONTS_LINK

# Palette families shown in the preview, in display order. Excludes
# white/black (rendered separately if at all) and solarized (theme-specific,
# not part of the primary palette surface).
PALETTE_FAMILIES = ("gray", "purple", "blue", "teal", "green", "yellow", "orange", "red")
TOKENS_PATH = Path("tokens/design-tokens.json")


def _load_palette() -> list[tuple[str, list[tuple[str, str]]]]:
    """Load the primitive color palette from design-tokens.json.

    Reading the palette at build time (rather than hardcoding the hex values
    in this file) keeps preview.py from being a silent drift surface — the
    swatches always reflect what tokens.json actually defines. Also lets the
    token-leak audit run cleanly over this file: no raw hex literals here,
    only data loaded from the single source of truth.
    """
    data = json.loads(TOKENS_PATH.read_text(encoding="utf-8"))
    palette = data["primitive"]["color"]
    out: list[tuple[str, list[tuple[str, str]]]] = []
    for family in PALETTE_FAMILIES:
        shades = palette.get(family)
        if not isinstance(shades, dict):
            continue
        out.append(
            (family.capitalize(), [(shade, hex_val) for shade, hex_val in shades.items()])
        )
    return out


def generate_preview_html() -> str:
    """Return a complete HTML page showcasing design kit tokens and foundations.

    This page focuses on tokens (color, typography, spacing, borders, tables).
    Components are demonstrated in the storybook at storybook.html.
    """
    sidebar = _sidebar()
    header = _header()
    nav_script = _nav_script()
    sections = [
        _section_colors(),
        _section_typography(),
        _section_display_typography(),
        _section_spacing(),
        _section_borders(),
        _section_tables(),
        _section_icons(),
    ]
    main_content = "\n".join(sections)

    return f"""\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>Design Kit \u00b7 Tokens</title>
  <link rel="stylesheet" href="tokens.css">
  <link rel="stylesheet" href="components/app-shell.css">
  <link rel="stylesheet" href="components/sidebar.css">
  <link rel="stylesheet" href="components/topbar.css">
  <link rel="stylesheet" href="components/menu-item.css">
  <link rel="stylesheet" href="components/nav-stack.css">
{GOOGLE_FONTS_LINK}
  <style>
    /* Viewport-lock the page so .dk-app-shell's height: 100% resolves:
       sidebar stays fixed, .dk-app-shell-main scrolls. */
    html, body {{
      height: 100%;
      overflow: hidden;
    }}
    .dk-app-shell-main {{
      scroll-behavior: smooth;
    }}
    body {{
      margin: 0;
      font-family: var(--typography-mono);
      color: var(--color-text);
      background: var(--color-bg);
    }}
    .section {{
      display: flex;
      flex-direction: column;
      gap: 1lh;
      padding: var(--spacing-2xl) 0 var(--spacing-xl);
      scroll-margin-top: var(--spacing-2xl);
    }}
    .section + .section {{
      border-top: var(--border-width-thin) solid var(--color-border);
    }}
    .section > * {{
      padding-left: var(--spacing-2xl);
      padding-right: var(--spacing-2xl);
    }}
    .section-heading {{
      font-family: var(--typography-mono);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: var(--font-letter-spacing-wide);
      color: var(--color-text);
    }}
    .heading-anchor {{
      color: inherit;
      text-decoration: none;
    }}
    .subsection {{
      display: flex;
      flex-direction: column;
      gap: 0.5lh;
    }}
    .subsection-heading {{
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      text-transform: uppercase;
      letter-spacing: var(--font-letter-spacing-wide);
      color: var(--color-text-muted);
    }}
    .swatch-grid {{
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm) var(--spacing-md);
    }}
    .swatch {{
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: var(--spacing-xs);
      min-width: var(--control-size-lg);
    }}
    .swatch-color {{
      height: var(--control-size-md);
      border: var(--border-width-thin) solid var(--color-border);
    }}
    .swatch-label {{
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      text-align: center;
    }}
    .type-sample {{
      padding: var(--spacing-sm) 0;
    }}
    .type-meta {{
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }}
    .spacing-row {{
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }}
    .spacing-block {{
      height: var(--font-size-lg);
      background: var(--color-gray-300);
      flex-shrink: 0;
    }}
    .spacing-label {{
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      white-space: nowrap;
      min-width: var(--control-min-width-md);
    }}
    .size-sample {{
      display: flex;
      align-items: baseline;
      gap: var(--spacing-lg);
    }}
    .size-value {{
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      min-width: 60px; /* dimension-audit: ok — preview-only readout column width */
    }}
    .heading-demo {{
      /* row in .subsection flex column; rhythm via parent's gap */
    }}
    .border-row {{
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
    }}
    .border-sample {{
      width: var(--control-min-width-md);
      border-bottom-style: solid;
      border-bottom-color: var(--color-gray-400);
    }}
    .border-label {{
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }}
    .demo-label {{
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }}
    .icon-category-blurb {{
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }}
    .icon-table {{
      width: 100%;
      border-collapse: collapse;
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
    }}
    .icon-table th,
    .icon-table td {{
      text-align: left;
      padding: var(--spacing-sm) var(--spacing-md);
      border-bottom: var(--border-width-thin) solid var(--color-border);
      vertical-align: top;
    }}
    .icon-table th {{
      font-weight: var(--font-weight-semibold);
      text-transform: uppercase;
      letter-spacing: var(--font-letter-spacing-wide);
      color: var(--color-text-muted);
    }}
    .icon-table td.icon-cell {{
      width: var(--control-size-md);
      font-size: var(--font-size-lg);
      color: var(--color-text);
      text-align: center;
    }}
    .icon-table td.icon-name {{
      width: 12em; /* dimension-audit: ok — em-relative column for icon names */
      color: var(--color-text);
    }}
    .icon-table td.icon-guidance {{
      --mono: 0;
      color: var(--color-text);
    }}
  </style>
</head>
<body>
<a href="#main-content" class="visually-hidden">Skip to main content</a>
<div class="dk-app-shell">

  {header}

  <div class="dk-app-shell-body">
    {sidebar}
    <main id="main-content" class="dk-app-shell-main">
      {main_content}
    </main>
  </div>

</div>

{nav_script}
</body>
</html>
"""


def _header() -> str:
    return """\
  <header class="dk-app-shell-header dk-topbar">
    <span class="dk-topbar-title dk-topbar-title-eyebrow">Design Kit</span>
  </header>"""


def _nav_script() -> str:
    """Include the shared system-sidebar mounting script.

    The same script and the same nav data drive the sidebar on every page,
    so the navigation is cohesive across the system. See
    components/system/system-sidebar.js and planning/design-kit/nav-model.md.
    """
    return '<script type="module" src="components/system/system-sidebar.js"></script>'


def _sidebar() -> str:
    return """\
  <aside class="dk-app-shell-left dk-sidebar dk-sidebar-left dk-sidebar-mode-inline"
         data-state="expanded"
         style="--dk-sidebar-width: 220px;"
         aria-label="Design Kit navigation">
    <div class="dk-sidebar-main" data-slot="main" data-system-nav></div>
  </aside>"""


def _heading(section_id: str, text: str) -> str:
    """Return an h2 with an anchor link for deep-linking."""
    return (
        f'<h2 class="section-heading" id="{section_id}">'
        f'<a href="#{section_id}" class="heading-anchor">{text}</a></h2>'
    )


def _color_family_swatches(family: str, shades: list[tuple[str, str]]) -> str:
    swatches = ""
    for shade, hex_val in shades:
        swatches += f"""\
      <div class="swatch">
        <div class="swatch-color" style="background: {hex_val};"></div>
        <span class="swatch-label">{shade}</span>
      </div>
"""
    return f"""\
      <div class="subsection">
        <div class="subsection-heading">{family}</div>
        <div class="swatch-grid">
{swatches}        </div>
      </div>"""


def _section_colors() -> str:
    families = _load_palette()

    family_html = "\n".join(
        _color_family_swatches(name, shades) for name, shades in families
    )

    syntax_names = ["keyword", "string", "comment", "function", "punctuation"]
    syntax_swatches = ""
    for name in syntax_names:
        syntax_swatches += f"""\
      <div class="swatch">
        <div class="swatch-color" style="background: var(--color-syntax-{name});"></div>
        <span class="swatch-label">{name}</span>
      </div>
"""

    return f"""\
    <div class="section">
      {_heading("colors", "Color Palette")}

{family_html}

      <div class="subsection">
        <div class="subsection-heading">Syntax Highlighting</div>
        <div class="swatch-grid">
{syntax_swatches}        </div>
      </div>
    </div>"""


def _section_typography() -> str:
    sizes = [
        ("2xs", "0.625rem"),
        ("xs", "0.75rem"),
        ("sm", "0.875rem"),
        ("base", "1rem"),
        ("lg", "1.125rem"),
        ("xl", "1.25rem"),
        ("2xl", "1.5rem"),
        ("3xl", "2rem"),
    ]
    size_rows = ""
    for name, value in sizes:
        size_rows += f"""\
        <div class="size-sample">
          <span class="size-value">{name} ({value})</span>
          <span style="font-family: var(--typography-mono); font-size: var(--font-size-{name});">
            The quick brown fox
          </span>
        </div>
"""

    return f"""\
    <div class="section">
      {_heading("typography", "Typography")}

      <div class="subsection">
        <div class="subsection-heading">Font Axes</div>
        <div class="type-sample">
          <div class="type-meta">mono (Recursive MONO 1): default for UI</div>
          <div style="--mono: 1; font-size: var(--font-size-sm);">
            ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
          </div>
        </div>
        <div class="type-sample">
          <div class="type-meta">proportional (Recursive MONO 0): long prose</div>
          <div style="--mono: 0; font-size: var(--font-size-sm);">
            ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
          </div>
        </div>
        <div class="type-sample">
          <div class="type-meta">casual (Recursive CASL 0.5): editorial warmth</div>
          <div style="--mono: 1; --casl: 0.5; font-size: var(--font-size-sm);">
            ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
          </div>
        </div>
        <div class="type-sample">
          <div class="type-meta">slanted (Recursive slnt -12): comments, attribution</div>
          <div style="--mono: 1; --slnt: -12; font-size: var(--font-size-sm);">
            ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
          </div>
        </div>
      </div>

      <div class="subsection">
        <div class="subsection-heading">Font Size Scale</div>
{size_rows}
      </div>

      <div class="subsection">
        <div class="subsection-heading">Heading Treatments</div>
        <div class="heading-demo">
          <h1>H1 Heading</h1>
        </div>
        <div class="heading-demo">
          <h2>H2 Heading</h2>
        </div>
        <div class="heading-demo">
          <h3>H3 Heading</h3>
        </div>
      </div>
    </div>"""


def _section_display_typography() -> str:
    weights = [
        ("Light", 300),
        ("Regular", 400),
        ("Medium", 500),
        ("Semibold", 600),
        ("Bold", 700),
        ("ExtraBold", 800),
        ("Black", 900),
    ]
    weight_samples = ""
    for label, value in weights:
        weight_samples += (
            f'        <div style="font-weight: {value}; --mono: 1;'
            f' font-size: var(--font-size-2xl);">'
            f"{label} ({value})</div>\n"
        )

    return f"""\
    <div class="section">
      {_heading("display-typography", "Display Typography")}

      <div class="subsection">
        <div class="subsection-heading">Display Scales</div>
        <div style="--mono: 1; font-weight: var(--font-weight-extrabold);\
 overflow: hidden;">
          <div style="font-size: var(--font-size-4xl); line-height:\
 var(--font-line-height-tight);">4xl (2.5rem)</div>
          <div style="font-size: var(--font-size-5xl); line-height:\
 var(--font-line-height-tight);">5xl (3rem)</div>
          <div style="font-size: var(--font-size-display); line-height:\
 var(--font-line-height-tight);">display</div>
        </div>
      </div>

      <div class="subsection">
        <div class="subsection-heading">Weight Range</div>
{weight_samples}\
      </div>

      <div class="subsection">
        <div class="subsection-heading">Axis Combinations at Scale</div>
        <div style="overflow: hidden;">
          <div style="--mono: 1; --casl: 0; font-weight: 800;\
 font-size: var(--font-size-4xl); line-height: var(--font-line-height-tight);\
">Linear ExtraBold</div>
          <div style="--mono: 1; --casl: 0.5; font-weight: 800;\
 font-size: var(--font-size-4xl); line-height: var(--font-line-height-tight);\
">Casual ExtraBold</div>
          <div style="--mono: 0; --casl: 0; font-weight: 900;\
 font-size: var(--font-size-4xl); line-height: var(--font-line-height-tight);\
">Proportional Black</div>
          <div style="--mono: 1; --slnt: -12; font-weight: 700;\
 font-size: var(--font-size-4xl); line-height: var(--font-line-height-tight);\
">Slanted Bold</div>
        </div>
      </div>
    </div>"""


def _section_spacing() -> str:
    scale = [
        ("xs", "0.125rem"),
        ("sm", "0.25rem"),
        ("md", "0.5rem"),
        ("lg", "0.75rem"),
        ("xl", "1rem"),
        ("2xl", "1.5rem"),
        ("3xl", "2rem"),
        ("4xl", "3rem"),
    ]
    rows = ""
    for name, value in scale:
        rows += f"""\
      <div class="spacing-row">
        <span class="spacing-label">{name} ({value})</span>
        <div class="spacing-block" style="width: var(--spacing-{name}); min-width: 2px;"></div> <!-- dimension-audit: ok — 2px floor keeps the smallest spacing token visually present -->
      </div>
"""

    return f"""\
    <div class="section">
      {_heading("spacing", "Spacing Scale")}
{rows}
    </div>"""


def _section_borders() -> str:
    return f"""\
    <div class="section">
      {_heading("borders", "Borders")}

      <div class="subsection">
        <div class="subsection-heading">Border Widths</div>
        <div class="border-row">
          <div class="border-sample" style="border-bottom-width: var(--border-width-thin);"></div>
          <span class="border-label">thin (1px)</span>
        </div>
        <div class="border-row">
          <div class="border-sample" style="border-bottom-width: var(--border-width-medium);"></div>
          <span class="border-label">medium (2px)</span>
        </div>
        <div class="border-row">
          <div class="border-sample" style="border-bottom-width: var(--border-width-thick);"></div>
          <span class="border-label">thick (3px)</span>
        </div>
      </div>

    </div>"""


def _section_icons() -> str:
    """Render the curated Radix icon registry grouped by category.

    Reads each SVG from components/icons/ and inlines it so the preview
    is self-contained (no extra fetches at view time).
    """
    from pathlib import Path

    icons_dir = Path("components") / "icons"

    by_category: dict[str, list[tuple[str, str]]] = {}
    for entry in CURATED_ICONS:
        by_category.setdefault(entry.category, []).append((entry.name, entry.guidance))

    blocks: list[str] = []
    for category_name, category_blurb in ICON_CATEGORIES:
        rows = by_category.get(category_name, [])
        if not rows:
            continue
        row_html: list[str] = []
        for name, guidance in rows:
            svg_path = icons_dir / f"{name}.svg"
            svg = (
                normalise_svg(svg_path.read_text(encoding="utf-8"), with_class=True)
                if svg_path.is_file()
                else ""
            )
            row_html.append(
                f"""\
              <tr>
                <td class="icon-cell">{svg}</td>
                <td class="icon-name"><code>{name}</code></td>
                <td class="icon-guidance">{guidance}</td>
              </tr>"""
            )
        rows_block = "\n".join(row_html)
        blocks.append(
            f"""\
      <div class="subsection">
        <div class="subsection-heading">{category_name}</div>
        <div class="icon-category-blurb">{category_blurb}</div>
        <table class="icon-table">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>When to use</th>
            </tr>
          </thead>
          <tbody>
{rows_block}
          </tbody>
        </table>
      </div>"""
        )

    body = "\n\n".join(blocks)

    return f"""\
    <div class="section">
      {_heading("icons", "Icons")}

      <div class="subsection">
        <div class="demo-label">
          Curated Radix Icons (MIT, WorkOS). Pass a name (e.g. <code>chevron-down</code>)
          to any component that accepts an <code>icon</code> prop;
          unknown names fall back to literal text. Color via <code>currentColor</code>;
          size via the parent's <code>font-size</code> through <code>.dk-icon</code>.
        </div>
      </div>

{body}
    </div>"""


def _section_tables() -> str:
    return f"""\
    <div class="section">
      {_heading("tables", "Tables")}

      <div class="subsection">
        <div class="subsection-heading">Content Table</div>
        <div class="demo-label">Sticky headers, no horizontal scroll. For tables embedded in prose. Headers stick when the page scrolls.</div>
        <div class="content-table">
          <table>
            <caption>Design token categories</caption>
            <thead><tr><th>Category</th><th>Purpose</th><th>Example</th></tr></thead>
            <tbody>
              <tr><td>Color</td><td>Visual identity</td><td><code>--color-gray-500</code></td></tr>
              <tr><td>Spacing</td><td>Consistent rhythm</td><td><code>--spacing-lg</code></td></tr>
              <tr><td>Typography</td><td>Font stacks</td><td><code>--typography-mono</code></td></tr>
              <tr><td>Motion</td><td>Transitions</td><td><code>--motion-duration-fast</code></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="subsection">
        <div class="subsection-heading">Data Table</div>
        <div class="demo-label">Horizontal scroll wrapper. For wide tables with many columns.</div>
        <div class="data-table">
          <table>
            <thead><tr><th>Component</th><th>Category</th><th>Props</th><th>Events</th><th>Composition</th></tr></thead>
            <tbody>
              <tr><td>Button</td><td>Actions</td><td>variant, disabled, type</td><td>button:click</td><td>standalone</td></tr>
              <tr><td>TabBar</td><td>Navigation</td><td>active, tabs</td><td>tab-bar:change</td><td>standalone</td></tr>
              <tr><td>SegmentedToggle</td><td>Controls</td><td>active, options</td><td>segmented-toggle:change</td><td>standalone</td></tr>
              <tr><td>CollapsibleSection</td><td>Layout</td><td>title, expanded, count</td><td>collapsible-section:toggle</td><td>slot-based</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>"""
