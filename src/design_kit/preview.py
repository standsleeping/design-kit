"""Generate a preview HTML page that showcases the design kit using its own components."""

from __future__ import annotations

import json


def generate_preview_html() -> str:
    """Return a complete HTML page showcasing all design kit tokens and components.

    The page uses the app shell layout with a left sidebar for navigation
    and a main content area displaying color palettes, typography, spacing,
    and all web components. All styling defers to tokens.css; only minimal
    additional CSS is added inline.
    """
    sidebar = _sidebar()
    header = _header()
    right_toc = _right_toc()
    sections = [
        _section_colors(),
        _section_typography(),
        _section_spacing(),
        _section_borders(),
        _section_buttons(),
        _section_icon_buttons(),
        _section_tab_bar(),
        _section_collapsible(),
        _section_code_block(),
        _section_breadcrumb(),
        _section_page_nav(),
        _section_toc(),
    ]
    main_content = "\n".join(sections)

    return f"""\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Design Kit</title>
  <link rel="stylesheet" href="tokens.css">
  <script type="module" src="components/sp-all.js"></script>
  <style>
    .section {{
      padding: var(--spacing-2xl) var(--spacing-2xl) var(--spacing-xl);
    }}
    .section + .section {{
      border-top: 1px solid var(--color-gray-200);
    }}
    .section-heading {{
      font-family: var(--typography-mono);
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: var(--font-letter-spacing-wide);
      color: var(--color-gray-700);
      margin-bottom: var(--spacing-xl);
    }}
    .subsection {{
      margin-top: var(--spacing-xl);
    }}
    .subsection-heading {{
      font-family: var(--typography-mono);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      text-transform: uppercase;
      letter-spacing: var(--font-letter-spacing-wide);
      color: var(--color-gray-400);
      margin-bottom: var(--spacing-md);
    }}
    .swatch-grid {{
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }}
    .swatch {{
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-xs);
    }}
    .swatch-color {{
      width: 48px;
      height: 32px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-gray-200);
    }}
    .swatch-label {{
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
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
      border-radius: var(--radius-sm);
      flex-shrink: 0;
    }}
    .spacing-label {{
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      white-space: nowrap;
      min-width: 80px;
    }}
    .component-demo {{
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-lg) 0;
    }}
    .demo-label {{
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      width: 100%;
    }}
    .demo-block {{
      padding: var(--spacing-lg) 0;
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
      border-bottom: 1px solid var(--color-border);
      background: var(--color-bg);
    }}
    .header-title {{
      font-family: var(--typography-mono);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-600);
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
      border-bottom: 1px solid var(--color-border);
    }}
    .sidebar-brand {{
      font-family: var(--typography-mono);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: var(--font-letter-spacing-wider);
      color: var(--color-gray-700);
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
      color: var(--color-gray-500);
      text-decoration: none;
      padding: var(--spacing-xs) var(--spacing-lg) var(--spacing-xs) var(--spacing-2xl);
    }}
    .nav-link:hover {{
      color: var(--color-gray-700);
      background: var(--color-gray-100);
      text-decoration: none;
    }}
    .sidebar-footer-block {{
      padding: var(--spacing-lg) var(--spacing-lg);
      border-top: 1px solid var(--color-border);
    }}
    .sidebar-footer-link {{
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-muted);
      text-decoration: none;
      letter-spacing: var(--font-letter-spacing-wide);
    }}
    .sidebar-footer-link:hover {{
      color: var(--color-gray-700);
      text-decoration: none;
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
  </style>
</head>
<body>
<a href="#main-content" class="visually-hidden">Skip to main content</a>
<sp-app-shell>

  {header}

  {sidebar}

  <sp-container id="main-content" preset="standard">
    {main_content}
  </sp-container>

  {right_toc}

</sp-app-shell>
</body>
</html>
"""


def _header() -> str:
    return """\
  <div slot="header" class="header-bar">
    <span class="header-title">Design Kit</span>
    <sp-theme-toggle></sp-theme-toggle>
  </div>"""


def _sidebar() -> str:
    return """\
  <sp-sidebar slot="left-sidebar" width="220" resizable>
    <div slot="header" class="sidebar-header-block">
      <div class="sidebar-brand">DESIGN KIT</div>
      <div class="sidebar-version">v0.1</div>
    </div>

    <div class="nav-section">
      <div class="nav-section-title">Tokens</div>
      <a class="nav-link" href="#colors">Colors</a>
      <a class="nav-link" href="#typography">Typography</a>
      <a class="nav-link" href="#spacing">Spacing</a>
      <a class="nav-link" href="#borders">Borders</a>
    </div>
    <div class="nav-section">
      <div class="nav-section-title">Components</div>
      <a class="nav-link" href="#buttons">Buttons</a>
      <a class="nav-link" href="#icon-buttons">Icon Buttons</a>
      <a class="nav-link" href="#tab-bar">Tab Bar</a>
      <a class="nav-link" href="#collapsible">Collapsible Section</a>
    </div>
    <div class="nav-section">
      <div class="nav-section-title">Patterns</div>
      <a class="nav-link" href="#code-block">Code Block</a>
      <a class="nav-link" href="#breadcrumb">Breadcrumb</a>
      <a class="nav-link" href="#page-nav">Page Nav</a>
      <a class="nav-link" href="#toc">Table of Contents</a>
    </div>

    <div slot="footer" class="sidebar-footer-block">
      <a href="#" class="sidebar-footer-link">Docs</a>
    </div>
  </sp-sidebar>"""


_SECTIONS: list[dict[str, str | int]] = [
    {"id": "colors", "label": "Color Palette", "level": 0},
    {"id": "typography", "label": "Typography", "level": 0},
    {"id": "spacing", "label": "Spacing Scale", "level": 0},
    {"id": "borders", "label": "Borders", "level": 0},
    {"id": "buttons", "label": "Buttons", "level": 0},
    {"id": "icon-buttons", "label": "Icon Buttons", "level": 1},
    {"id": "tab-bar", "label": "Tab Bar", "level": 0},
    {"id": "collapsible", "label": "Collapsible", "level": 0},
    {"id": "code-block", "label": "Code Block", "level": 0},
    {"id": "breadcrumb", "label": "Breadcrumb", "level": 1},
    {"id": "page-nav", "label": "Page Nav", "level": 1},
    {"id": "toc", "label": "Table of Contents", "level": 1},
]


def _right_toc() -> str:
    items = [
        {"label": s["label"], "href": f"#{s['id']}", "level": s["level"]}
        for s in _SECTIONS
    ]
    items_json = json.dumps(items)
    return f"""\
  <sp-sidebar slot="right-sidebar" width="200" side="right">
    <sp-toc label="On this page" items='{items_json}'></sp-toc>
  </sp-sidebar>"""


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

    syntax_swatches = ""
    syntax_colors = [
        ("keyword", "#303B85"),
        ("string", "#3C5F00"),
        ("comment", "#9F9CA2"),
        ("function", "#8300CA"),
        ("punctuation", "#57545A"),
    ]
    for name, hex_val in syntax_colors:
        syntax_swatches += f"""\
      <div class="swatch">
        <div class="swatch-color" style="background: {hex_val};"></div>
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
        ("xs", "0.6875rem"),
        ("sm", "0.75rem"),
        ("base", "0.8125rem"),
        ("md", "0.875rem"),
        ("lg", "1rem"),
        ("xl", "1.125rem"),
        ("2xl", "1.25rem"),
        ("3xl", "1.5rem"),
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
        <div class="subsection-heading">Font Families</div>
        <div class="type-sample">
          <div class="type-meta">mono (IBM Plex Mono): default for UI</div>
          <div style="font-family: var(--typography-mono); font-size: var(--font-size-base);">
            ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
          </div>
        </div>
        <div class="type-sample">
          <div class="type-meta">sans (IBM Plex Sans): long prose</div>
          <div style="font-family: var(--typography-body); font-size: var(--font-size-base);">
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

      <div class="subsection">
        <div class="subsection-heading">Border Radii</div>
        <div class="swatch-grid">
          <div class="swatch">
            <div class="swatch-color" style="border-radius: var(--radius-sm); background: var(--color-gray-300);"></div>
            <span class="swatch-label">sm (2px)</span>
          </div>
          <div class="swatch">
            <div class="swatch-color" style="border-radius: var(--radius-md); background: var(--color-gray-300);"></div>
            <span class="swatch-label">md (4px)</span>
          </div>
          <div class="swatch">
            <div class="swatch-color" style="border-radius: var(--radius-lg); background: var(--color-gray-300);"></div>
            <span class="swatch-label">lg (6px)</span>
          </div>
          <div class="swatch">
            <div class="swatch-color" style="border-radius: var(--radius-xl); background: var(--color-gray-300);"></div>
            <span class="swatch-label">xl (8px)</span>
          </div>
        </div>
      </div>
    </div>"""


def _section_buttons() -> str:
    return f"""\
    <div class="section">
      {_heading("buttons", "Buttons")}

      <div class="subsection">
        <div class="subsection-heading">Variants</div>
        <div class="component-demo">
          <sp-button>Default</sp-button>
          <sp-button variant="primary">Primary</sp-button>
          <sp-button disabled>Disabled</sp-button>
          <sp-button variant="primary" disabled>Primary Disabled</sp-button>
        </div>
      </div>
    </div>"""


def _section_icon_buttons() -> str:
    return f"""\
    <div class="section">
      {_heading("icon-buttons", "Icon Buttons")}

      <div class="subsection">
        <div class="subsection-heading">Sizes</div>
        <div class="component-demo">
          <sp-icon-button size="sm" label="Small action">\u2715</sp-icon-button>
          <sp-icon-button label="Default action">\u2715</sp-icon-button>
          <sp-icon-button size="touch" label="Touch action">\u2715</sp-icon-button>
          <sp-icon-button disabled label="Disabled">\u2715</sp-icon-button>
        </div>
        <div class="component-demo">
          <sp-icon-button size="sm" label="Copy">\u2398</sp-icon-button>
          <sp-icon-button label="Settings">\u2699</sp-icon-button>
          <sp-icon-button size="touch" label="Menu">\u2630</sp-icon-button>
        </div>
      </div>
    </div>"""


def _section_tab_bar() -> str:
    return f"""\
    <div class="section">
      {_heading("tab-bar", "Tab Bar")}

      <div class="demo-block">
        <div class="demo-label">Interactive tab bar with dot separators</div>
        <sp-tab-bar active="overview">
          <sp-tab id="overview" label="Overview"></sp-tab>
          <sp-tab id="api" label="API"></sp-tab>
          <sp-tab id="examples" label="Examples"></sp-tab>
          <sp-tab id="changelog" label="Changelog"></sp-tab>
        </sp-tab-bar>
      </div>
    </div>"""


def _section_collapsible() -> str:
    return f"""\
    <div class="section">
      {_heading("collapsible", "Collapsible Section")}

      <div class="demo-block">
        <sp-collapsible-section title="Expanded Section" expanded count="3">
          <div style="padding: var(--spacing-md) var(--spacing-lg);">
            <p style="font-family: var(--typography-mono); font-size: var(--font-size-sm); \
color: var(--color-text-muted); margin-bottom: var(--spacing-sm);">
              Content inside a collapsible section. Click the header to toggle.
            </p>
            <p style="font-family: var(--typography-mono); font-size: var(--font-size-sm); \
color: var(--color-text-muted);">
              Sections have sticky headers and optional item counts.
            </p>
          </div>
        </sp-collapsible-section>

        <sp-collapsible-section title="Collapsed Section" count="7">
          <div style="padding: var(--spacing-md) var(--spacing-lg);">
            <p style="font-family: var(--typography-mono); font-size: var(--font-size-sm);">
              This content is hidden until expanded.
            </p>
          </div>
        </sp-collapsible-section>
      </div>
    </div>"""


def _section_code_block() -> str:
    return f"""\
    <div class="section">
      {_heading("code-block", "Code Block")}

      <div class="demo-block">
        <div class="demo-label">Single language with copy button</div>
        <sp-code-block><span class="syn-keyword">from</span> design_kit.preview <span class="syn-keyword">import</span> generate_preview_html

html <span class="syn-punctuation">=</span> <span class="syn-function">generate_preview_html</span><span class="syn-punctuation">()</span>
<span class="syn-function">print</span><span class="syn-punctuation">(</span>html<span class="syn-punctuation">)</span></sp-code-block>
      </div>

      <div class="demo-block" style="margin-top: var(--spacing-xl);">
        <div class="demo-label">Multi-language with tab switching</div>
        <sp-code-block languages="Python, JavaScript, Shell" active-language="Python">\
<span class="syn-comment"># Install the design kit</span>
pip install design-kit</sp-code-block>
      </div>
    </div>"""


def _section_breadcrumb() -> str:
    return f"""\
    <div class="section">
      {_heading("breadcrumb", "Breadcrumb")}

      <div class="demo-block">
        <sp-breadcrumb items='[\
{{"label": "Design Kit", "href": "#"}},\
{{"label": "Components", "href": "#"}},\
{{"label": "Breadcrumb"}}\
]'></sp-breadcrumb>
      </div>
    </div>"""


def _section_page_nav() -> str:
    return f"""\
    <div class="section">
      {_heading("page-nav", "Page Nav")}

      <div class="demo-block">
        <sp-page-nav
          prev-label="Buttons"
          prev-href="#buttons"
          prev-subtitle="Components"
          next-label="Table of Contents"
          next-href="#toc"
          next-subtitle="Patterns"
        ></sp-page-nav>
      </div>
    </div>"""


def _section_toc() -> str:
    return f"""\
    <div class="section">
      {_heading("toc", "Table of Contents")}

      <div class="demo-block">
        <div class="demo-label">Inline TOC demo with section tracking</div>
        <sp-toc
          label="On this page"
          items='[\
{{"label": "Color Palette", "href": "#colors", "level": 0}},\
{{"label": "Typography", "href": "#typography", "level": 0}},\
{{"label": "Spacing", "href": "#spacing", "level": 0}},\
{{"label": "Borders", "href": "#borders", "level": 0}},\
{{"label": "Buttons", "href": "#buttons", "level": 0}},\
{{"label": "Icon Buttons", "href": "#icon-buttons", "level": 1}},\
{{"label": "Tab Bar", "href": "#tab-bar", "level": 0}},\
{{"label": "Code Block", "href": "#code-block", "level": 0}},\
{{"label": "Breadcrumb", "href": "#breadcrumb", "level": 1}},\
{{"label": "Page Nav", "href": "#page-nav", "level": 1}},\
{{"label": "TOC", "href": "#toc", "level": 1}}\
]'
        ></sp-toc>
      </div>
    </div>"""
