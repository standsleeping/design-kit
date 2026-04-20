"""Generate a preview HTML page that showcases the design kit tokens."""

from __future__ import annotations

from design_kit.token_css import GOOGLE_FONTS_LINK


def generate_preview_html() -> str:
    """Return a complete HTML page showcasing design kit tokens and foundations.

    This page focuses on tokens (color, typography, spacing, borders, tables).
    Components are demonstrated in the storybook at storybook.html.
    """
    sidebar = _sidebar()
    header = _header()
    sections = [
        _section_colors(),
        _section_typography(),
        _section_display_typography(),
        _section_spacing(),
        _section_borders(),
        _section_tables(),
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
  <link rel="stylesheet" href="components/menu-item.css">
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
      margin-bottom: 1lh;
    }}
    .heading-anchor {{
      color: inherit;
      text-decoration: none;
    }}
    .subsection {{
      margin-top: 1lh;
    }}
    .subsection-heading {{
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      text-transform: uppercase;
      letter-spacing: var(--font-letter-spacing-wide);
      color: var(--color-text-muted);
      margin-bottom: 0.5lh;
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
      min-width: 40px;
    }}
    .swatch-color {{
      height: 32px;
      border: var(--border-width-thin) solid rgba(128, 128, 128, 0.3);
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
      margin-bottom: var(--spacing-xs);
    }}
    .spacing-row {{
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-sm);
    }}
    .spacing-block {{
      height: 20px;
      background: var(--color-gray-300);
      flex-shrink: 0;
    }}
    .spacing-label {{
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      white-space: nowrap;
      min-width: 80px;
    }}
    .size-sample {{
      display: flex;
      align-items: baseline;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-xs);
    }}
    .size-value {{
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      min-width: 60px;
    }}
    .header-bar {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-md) var(--spacing-xl);
      border-bottom: var(--border-width-thin) solid var(--color-border);
      background: var(--color-bg);
    }}
    .header-title {{
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text);
      text-transform: uppercase;
      letter-spacing: var(--font-letter-spacing-wide);
    }}
    .header-note {{
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }}
    .sidebar-header-block {{
      padding: var(--spacing-lg) var(--spacing-lg);
      border-bottom: var(--border-width-thin) solid var(--color-border);
    }}
    .sidebar-brand {{
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: var(--font-letter-spacing-wider);
      color: var(--color-text);
    }}
    .sidebar-version {{
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }}
    .nav-section {{
      padding: var(--spacing-sm) 0;
    }}
    .nav-section-title {{
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      text-transform: uppercase;
      letter-spacing: var(--font-letter-spacing-wide);
      color: var(--color-text-muted);
      padding: var(--spacing-sm) var(--spacing-lg);
    }}
    .nav-link {{
      display: block;
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      text-decoration: none;
      padding: var(--spacing-xs) var(--spacing-lg) var(--spacing-xs) var(--spacing-2xl);
    }}
    .nav-link:hover {{
      color: var(--color-text);
      background: var(--color-hover-bg);
      text-decoration: none;
    }}
    .main-content {{
      padding: var(--spacing-xl) 0;
    }}
    .heading-demo {{
      margin-bottom: var(--spacing-md);
    }}
    .border-row {{
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-md);
    }}
    .border-sample {{
      width: 80px;
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
  </style>
</head>
<body>
<a href="#main-content" class="visually-hidden">Skip to main content</a>
<div class="dk-app-shell">

  {header}

  <div class="dk-app-shell-body">
    {sidebar}
    <div class="dk-app-shell-main">
      <div id="main-content" class="main-content">
        {main_content}
      </div>
    </div>
  </div>

</div>
</body>
</html>
"""


def _header() -> str:
    return """\
  <div class="dk-app-shell-header header-bar">
    <span class="header-title">Design Kit \u00b7 Tokens</span>
    <span class="header-note"><a href="storybook.html">Open storybook \u2192</a></span>
  </div>"""


def _sidebar() -> str:
    return """\
  <aside class="dk-app-shell-left dk-sidebar dk-sidebar-left" style="width: 220px;">
    <div class="dk-sidebar-header sidebar-header-block">
      <div class="sidebar-brand">DESIGN KIT</div>
      <div class="sidebar-version">v0.1</div>
    </div>

    <div class="dk-sidebar-main">
      <div class="nav-section">
        <div class="nav-section-title">Tokens</div>
        <a class="nav-link" href="#colors">Colors</a>
        <a class="nav-link" href="#typography">Typography</a>
        <a class="nav-link" href="#display-typography">Display Typography</a>
        <a class="nav-link" href="#spacing">Spacing</a>
        <a class="nav-link" href="#borders">Borders</a>
        <a class="nav-link" href="#tables">Tables</a>
      </div>

      <div class="nav-section">
        <div class="nav-section-title">Explore</div>
        <a class="nav-link" href="storybook.html">Storybook</a>
        <a class="nav-link" href="bento.html">Bento Layout</a>
        <a class="nav-link" href="taxonomy.html">Design Taxonomy</a>
        <a class="nav-link" href="line-height-units.html">Line Height Units</a>
      </div>
    </div>
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
    families: list[tuple[str, list[tuple[str, str]]]] = [
        (
            "Gray",
            [
                ("50", "#F5F5F5"),
                ("100", "#ECECED"),
                ("200", "#C5C3C7"),
                ("300", "#9F9CA2"),
                ("400", "#7B777F"),
                ("500", "#57545A"),
                ("600", "#363438"),
                ("700", "#181619"),
            ],
        ),
        (
            "Purple",
            [
                ("100", "#F1E8FF"),
                ("200", "#D6B6FF"),
                ("300", "#BF80FF"),
                ("400", "#AC38FF"),
                ("500", "#8300CA"),
                ("600", "#530082"),
                ("700", "#280042"),
            ],
        ),
        (
            "Blue",
            [
                ("100", "#EDF0FF"),
                ("200", "#A6B2FF"),
                ("300", "#5E74FF"),
                ("400", "#4758C2"),
                ("500", "#303B85"),
                ("600", "#28316C"),
                ("700", "#151732"),
            ],
        ),
        (
            "Teal",
            [
                ("100", "#80FFFF"),
                ("200", "#00D9D9"),
                ("300", "#00AEAE"),
                ("400", "#008686"),
                ("500", "#005F5F"),
                ("600", "#003B3B"),
                ("700", "#001A1A"),
            ],
        ),
        (
            "Green",
            [
                ("100", "#C0FF80"),
                ("200", "#8FD900"),
                ("300", "#72AE00"),
                ("400", "#578600"),
                ("500", "#3C5F00"),
                ("600", "#243C00"),
                ("700", "#0E1B00"),
            ],
        ),
        (
            "Yellow",
            [
                ("100", "#FFF2C1"),
                ("200", "#FFE684"),
                ("300", "#FFD946"),
                ("400", "#FFCC08"),
                ("500", "#E6B605"),
                ("600", "#CDA003"),
                ("700", "#B38900"),
            ],
        ),
        (
            "Orange",
            [
                ("100", "#FFF5EC"),
                ("200", "#FFD6B8"),
                ("300", "#FFA473"),
                ("400", "#FF771C"),
                ("500", "#D35713"),
                ("600", "#A83709"),
                ("700", "#7C1700"),
            ],
        ),
        (
            "Red",
            [
                ("100", "#FFECEC"),
                ("200", "#FFBDBD"),
                ("300", "#FF8080"),
                ("400", "#FF1616"),
                ("500", "#BF0000"),
                ("600", "#7F0000"),
                ("700", "#450000"),
            ],
        ),
    ]

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
        <div class="spacing-block" style="width: var(--spacing-{name}); min-width: 2px;"></div>
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


def _section_tables() -> str:
    return f"""\
    <div class="section">
      {_heading("tables", "Tables")}

      <div class="subsection">
        <div class="subsection-heading">Content Table</div>
        <div class="demo-label">Sticky headers, no horizontal scroll. For tables embedded in prose. Headers stick when the page scrolls.</div>
        <div class="content-table" style="margin-top: var(--spacing-md);">
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
        <div class="data-table" style="margin-top: var(--spacing-md);">
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
