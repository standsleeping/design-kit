// Single source of truth for design-kit's site nav structure.
//
// Consumed by the index page's NavStack (mounted by src/design_kit/preview.py)
// and importable by any future per-page nav widget.
//
// LEVELS holds a single root level: every Token anchor and every external
// page is reachable in one click from the index sidebar. Multi-level drilling
// is reserved for inside leaf pages (a future surface).
//
// TARGETS maps each item.id to its URL or in-page hash.

export const LEVELS = [
  {
    id: 'root',
    title: 'Design Kit',
    items: [
      { kind: 'section-header', id: 'tokens-header',          label: 'Tokens' },
      { kind: 'section-item',   id: 'colors',                 label: 'Colors' },
      { kind: 'section-item',   id: 'typography',             label: 'Typography' },
      { kind: 'section-item',   id: 'display-typography',     label: 'Display Typography' },
      { kind: 'section-item',   id: 'spacing',                label: 'Spacing' },
      { kind: 'section-item',   id: 'borders',                label: 'Borders' },
      { kind: 'section-item',   id: 'tables',                 label: 'Tables' },
      { kind: 'section-item',   id: 'icons',                  label: 'Icons' },
      { kind: 'section-header', id: 'discovery-header',       label: 'Discovery' },
      { kind: 'section-item',   id: 'storybook',              label: 'Storybook' },
      { kind: 'section-item',   id: 'taxonomy',               label: 'Design Taxonomy' },
      { kind: 'section-header', id: 'patterns-header',        label: 'Patterns' },
      { kind: 'section-item',   id: 'dashboard-shell',        label: 'Dashboard Shell' },
      { kind: 'section-item',   id: 'sidebar-nav-stack',      label: 'Sidebar + NavStack' },
      { kind: 'section-item',   id: 'inset-vs-flush',         label: 'Inset vs Flush' },
      { kind: 'section-item',   id: 'session-stats',          label: 'Session Stats' },
      { kind: 'section-item',   id: 'sticky-toc',             label: 'Sticky TOC' },
      { kind: 'section-item',   id: 'scrollbar-tests',        label: 'Scrollbar Modes' },
      { kind: 'section-item',   id: 'line-height-units',      label: 'Line Height Units' },
      { kind: 'section-header', id: 'audits-header',          label: 'Audits' },
      { kind: 'section-item',   id: 'border-audit',           label: 'Border Audit' },
      { kind: 'section-item',   id: 'contract-tests',         label: 'Contract Tests' },
      { kind: 'section-item',   id: 'app-runtime-tests',      label: 'App Runtime Tests' },
      { kind: 'section-item',   id: 'responsive-table-tests', label: 'Responsive Table Tests' },
    ],
  },
];

export const TARGETS = {
  colors:               '#colors',
  typography:           '#typography',
  'display-typography': '#display-typography',
  spacing:              '#spacing',
  borders:              '#borders',
  tables:               '#tables',
  icons:                '#icons',
  storybook:                 'storybook.html',
  taxonomy:                  'taxonomy.html',
  'dashboard-shell':         'dashboard-shell.html',
  'sidebar-nav-stack':       'sidebar-nav-stack.html',
  'inset-vs-flush':          'inset-vs-flush.html',
  'session-stats':           'session-stats.html',
  'sticky-toc':              'sticky-toc.html',
  'scrollbar-tests':         'scrollbar-tests.html',
  'line-height-units':       'line-height-units.html',
  'border-audit':            'border-audit.html',
  'contract-tests':          'contract-tests.html',
  'app-runtime-tests':       'app-runtime-tests.html',
  'responsive-table-tests':  'responsive-table-tests.html',
};
