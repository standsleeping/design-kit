import './sp-all.js';

const COMPONENTS = [
  {
    tag: 'sp-app-shell',
    title: 'SPAppShell',
    description: 'Application shell with header, content, and sidebars.',
    defaults: {},
    variants: [],
  },
  {
    tag: 'sp-sidebar',
    title: 'SPSidebar',
    description: 'Collapsible/resizable sidebar panel.',
    defaults: { width: 280, side: 'left', resizable: true },
    variants: [
      { name: 'Left', props: { side: 'left', width: 260 } },
      { name: 'Right', props: { side: 'right', width: 260 } },
      { name: 'Collapsed', props: { side: 'left', collapsed: true, width: 260 } },
    ],
  },
  {
    tag: 'sp-container',
    title: 'SPContainer',
    description: 'Layout container presets.',
    defaults: { preset: 'standard' },
    variants: [
      { name: 'Standard', props: { preset: 'standard' } },
      { name: 'Centered', props: { preset: 'centered' } },
    ],
  },
  {
    tag: 'sp-button',
    title: 'SPButton',
    description: 'Button with default and primary variants.',
    defaults: { variant: 'default', disabled: false, type: 'button' },
    variants: [
      { name: 'Default', props: { variant: 'default' } },
      { name: 'Primary', props: { variant: 'primary' } },
      { name: 'Disabled', props: { variant: 'default', disabled: true } },
    ],
  },
  {
    tag: 'sp-menu-item',
    title: 'SPMenuItem',
    description: 'Selectable navigation row with optional icon.',
    defaults: { label: 'Menu Item', icon: '', selected: false, disabled: false },
    variants: [
      { name: 'Default', props: { label: 'Menu Item', selected: false } },
      { name: 'Selected', props: { label: 'Selected Item', selected: true } },
      { name: 'Disabled', props: { label: 'Disabled Item', disabled: true } },
    ],
  },
  {
    tag: 'sp-metrics-card',
    title: 'SPMetricsCard',
    description: 'Inline metrics strip with loading, error, and empty states.',
    defaults: {
      metrics: [
        { label: 'Decisions', value: 47 },
        { label: 'Data Paths', value: 123 },
      ],
      loading: false,
      error: '',
    },
    variants: [
      {
        name: 'With Data',
        props: {
          metrics: [
            { label: 'Decisions', value: 47 },
            { label: 'Data Paths', value: 123 },
          ],
          loading: false,
          error: '',
        },
      },
      { name: 'Loading', props: { metrics: [], loading: true, error: '' } },
      { name: 'Error', props: { metrics: [], loading: false, error: 'Failed to load metrics' } },
      { name: 'Empty', props: { metrics: [], loading: false, error: '' } },
    ],
  },
  {
    tag: 'sp-adaptive-metrics-list',
    title: 'SPAdaptiveMetricsList',
    description:
      'Responsive metrics list that progressively hides lower-priority columns as width shrinks.',
    defaults: {
      title: 'Data',
      columns: [
        { key: 'fields', label: 'F', priority: 1 },
        { key: 'consumers', label: 'C', priority: 2, hideBelow: 'medium' },
        { key: 'producers', label: 'P', priority: 3, hideBelow: 'wide' },
      ],
      items: [
        { id: 'customer', name: 'Customer', fields: 9, consumers: 3, producers: 2 },
        { id: 'order', name: 'Order', fields: 17, consumers: 6, producers: 2 },
        { id: 'menu', name: 'MenuItem', fields: 11, consumers: 3, producers: 1 },
      ],
      'selected-id': 'order',
      'sort-column': 'fields',
      'sort-direction': 'desc',
      sortable: true,
      'outlier-thresholds': { fields: 15, consumers: 5, producers: 3 },
    },
    variants: [
      {
        name: 'Sorted + Outliers',
        props: {
          title: 'Data',
          columns: [
            { key: 'fields', label: 'F', priority: 1 },
            { key: 'consumers', label: 'C', priority: 2, hideBelow: 'medium' },
            { key: 'producers', label: 'P', priority: 3, hideBelow: 'wide' },
          ],
          items: [
            { id: 'customer', name: 'Customer', fields: 9, consumers: 3, producers: 2 },
            { id: 'order', name: 'Order', fields: 17, consumers: 6, producers: 2 },
            { id: 'menu', name: 'MenuItem', fields: 11, consumers: 3, producers: 1 },
          ],
          'selected-id': 'order',
          'sort-column': 'fields',
          'sort-direction': 'desc',
          sortable: true,
          'outlier-thresholds': { fields: 15, consumers: 5, producers: 3 },
        },
      },
      {
        name: 'Priority + Min Width',
        props: {
          title: 'Functions',
          columns: [
            { key: 'calls', label: 'C', priority: 1 },
            { key: 'decisions', label: 'D', priority: 2, minWidth: 340 },
          ],
          items: [
            { id: 'parse', name: 'parse_data', calls: 5, decisions: 2 },
            { id: 'emit', name: 'emit_report', calls: 0, decisions: 0 },
          ],
          'selected-id': 'parse',
          'sort-column': 'calls',
          'sort-direction': 'asc',
        },
      },
    ],
  },
  {
    tag: 'sp-expandable-card',
    title: 'SPExpandableCard',
    description: 'Expandable card with title, count, and disabled state support.',
    defaults: { title: 'Dependencies', count: 5, expanded: false, disabled: false },
    variants: [
      { name: 'Collapsed', props: { title: 'Dependencies', count: 5, expanded: false, disabled: false } },
      { name: 'Expanded', props: { title: 'Dependencies', count: 5, expanded: true, disabled: false } },
      { name: 'Disabled', props: { title: 'Dependencies', count: 0, expanded: false, disabled: true } },
    ],
  },
  {
    tag: 'sp-search-input',
    title: 'SPSearchInput',
    description: 'Minimal search input for filtering and quick find interactions.',
    defaults: { value: '', placeholder: 'Filter', disabled: false },
    variants: [
      { name: 'Empty', props: { value: '', placeholder: 'Filter' } },
      { name: 'With Value', props: { value: 'Order', placeholder: 'Filter' } },
      { name: 'Disabled', props: { value: '', placeholder: 'Filter', disabled: true } },
    ],
  },
  {
    tag: 'sp-text-input',
    title: 'SPTextInput',
    description: 'Typed text input wrapper with normalized events.',
    defaults: { type: 'text', value: '', placeholder: 'Enter value', disabled: false },
    variants: [
      { name: 'Text', props: { type: 'text', value: '', placeholder: 'Enter value' } },
      { name: 'Search', props: { type: 'search', value: 'Customer', placeholder: 'Filter' } },
      { name: 'Email', props: { type: 'email', value: '', placeholder: 'user@example.com' } },
      { name: 'Disabled', props: { type: 'text', value: 'Read only', disabled: true } },
    ],
  },
  {
    tag: 'sp-number-input',
    title: 'SPNumberInput',
    description: 'Number input wrapper with normalized value events.',
    defaults: { value: 90, min: 0, max: 100, step: 1, placeholder: '', disabled: false },
    variants: [
      { name: 'Default', props: { value: 90, min: 0, max: 100, step: 1 } },
      { name: 'Bounded', props: { value: 25, min: 10, max: 40, step: 5 } },
      { name: 'Disabled', props: { value: 90, min: 0, max: 100, step: 1, disabled: true } },
    ],
  },
  {
    tag: 'sp-checkbox',
    title: 'SPCheckbox',
    description: 'Checkbox wrapper with normalized change payload.',
    defaults: { checked: false, disabled: false },
    variants: [
      { name: 'Unchecked', props: { checked: false, disabled: false } },
      { name: 'Checked', props: { checked: true, disabled: false } },
      { name: 'Disabled', props: { checked: true, disabled: true } },
    ],
  },
  {
    tag: 'sp-select',
    title: 'SPSelect',
    description: 'Select control with array-based options schema.',
    defaults: {
      value: 'a-z',
      options: [
        { label: 'A-Z', value: 'a-z' },
        { label: 'Complexity', value: 'complexity' },
        { label: 'Updated', value: 'updated' },
      ],
      disabled: false,
    },
    variants: [
      {
        name: 'Basic',
        props: {
          value: 'a-z',
          options: [
            { label: 'A-Z', value: 'a-z' },
            { label: 'Complexity', value: 'complexity' },
            { label: 'Updated', value: 'updated' },
          ],
          disabled: false,
        },
      },
      {
        name: 'Disabled',
        props: {
          value: 'complexity',
          options: [
            { label: 'A-Z', value: 'a-z' },
            { label: 'Complexity', value: 'complexity' },
          ],
          disabled: true,
        },
      },
    ],
  },
  {
    tag: 'sp-range',
    title: 'SPRange',
    description: 'Range slider with inline numeric value.',
    defaults: { value: 75, min: 0, max: 100, step: 1, disabled: false },
    variants: [
      { name: 'Default', props: { value: 75, min: 0, max: 100, step: 1, disabled: false } },
      { name: 'Coarse', props: { value: 40, min: 0, max: 80, step: 5, disabled: false } },
      { name: 'Disabled', props: { value: 50, min: 0, max: 100, step: 1, disabled: true } },
    ],
  },
  {
    tag: 'sp-checkbox-number',
    title: 'SPCheckboxNumber',
    description: 'Compound checkbox + number control for enable-and-tune patterns.',
    defaults: { checked: true, value: 90, min: 0, max: 100, step: 1, disabled: false },
    variants: [
      { name: 'Enabled', props: { checked: true, value: 90, min: 0, max: 100, step: 1 } },
      { name: 'Unchecked', props: { checked: false, value: 90, min: 0, max: 100, step: 1 } },
      { name: 'Disabled', props: { checked: true, value: 90, min: 0, max: 100, step: 1, disabled: true } },
    ],
  },
  {
    tag: 'sp-field-row',
    title: 'SPFieldRow',
    description: 'Reusable label/control shell for settings rows.',
    defaults: { label: 'Sort by', compact: false, disabled: false },
    variants: [
      { name: 'Default', props: { label: 'Sort by', compact: false, disabled: false } },
      { name: 'Compact', props: { label: 'Card spacing', compact: true, disabled: false } },
      { name: 'Disabled', props: { label: 'Percentile', compact: false, disabled: true } },
    ],
  },
  {
    tag: 'sp-setting-row',
    title: 'SPSettingRow',
    description: 'Composable settings row that maps control types to primitives.',
    defaults: {
      name: 'sort_by',
      label: 'Sort by',
      'control-type': 'select',
      value: 'a-z',
      options: [
        { label: 'A-Z', value: 'a-z' },
        { label: 'Complexity', value: 'complexity' },
        { label: 'Updated', value: 'updated' },
      ],
      compact: false,
      disabled: false,
    },
    variants: [
      {
        name: 'Select',
        props: {
          name: 'sort_by',
          label: 'Sort by',
          'control-type': 'select',
          value: 'a-z',
          options: [
            { label: 'A-Z', value: 'a-z' },
            { label: 'Complexity', value: 'complexity' },
            { label: 'Updated', value: 'updated' },
          ],
        },
      },
      {
        name: 'Range',
        props: {
          name: 'opacity',
          label: 'Opacity',
          'control-type': 'range',
          value: '75',
          min: 0,
          max: 100,
          step: 1,
        },
      },
      {
        name: 'Checkbox Number',
        props: {
          name: 'highlight_outliers',
          label: 'Highlight outliers',
          'control-type': 'checkbox-number',
          checked: true,
          value: '90',
          min: 0,
          max: 100,
          step: 1,
        },
      },
      {
        name: 'Text',
        props: {
          name: 'query_label',
          label: 'Query label',
          'control-type': 'text',
          type: 'text',
          value: 'My metric',
          placeholder: 'Enter label',
        },
      },
      {
        name: 'Disabled',
        props: {
          name: 'threshold',
          label: 'Threshold',
          'control-type': 'number',
          type: 'number',
          value: '90',
          disabled: true,
        },
      },
    ],
  },
  {
    tag: 'sp-icon-button',
    title: 'SPIconButton',
    description: 'Icon-only button with size options.',
    defaults: { size: 'default', label: 'Action', disabled: false },
    variants: [
      { name: 'Small', props: { size: 'sm' } },
      { name: 'Default', props: { size: 'default' } },
      { name: 'Touch', props: { size: 'touch' } },
    ],
  },
  {
    tag: 'sp-collapsible-section',
    title: 'SPCollapsibleSection',
    description: 'Sticky-header collapsible section.',
    defaults: { title: 'Section', count: 3, expanded: true },
    variants: [
      { name: 'Expanded', props: { expanded: true } },
      { name: 'Collapsed', props: { expanded: false } },
    ],
  },
  {
    tag: 'sp-tab-bar',
    title: 'SPTabBar',
    description: 'Horizontal tab bar with active selection.',
    defaults: { active: 'overview' },
    variants: [
      { name: 'Overview', props: { active: 'overview' } },
      { name: 'API', props: { active: 'api' } },
      { name: 'Examples', props: { active: 'examples' } },
    ],
  },
  {
    tag: 'sp-bottom-tab-bar',
    title: 'SPBottomTabBar',
    description: 'Bottom navigation tab bar.',
    defaults: { active: 'home' },
    variants: [
      { name: 'Home', props: { active: 'home' } },
      { name: 'Search', props: { active: 'search' } },
      { name: 'Settings', props: { active: 'settings' } },
    ],
  },
  {
    tag: 'sp-code-block',
    title: 'SPCodeBlock',
    description: 'Code block with copy and language tabs.',
    defaults: { languages: 'Python, JavaScript', 'active-language': 'Python' },
    variants: [
      { name: 'Single', props: { languages: '', 'active-language': '' } },
      { name: 'Tabbed', props: { languages: 'Python, JavaScript', 'active-language': 'Python' } },
    ],
  },
  {
    tag: 'sp-toc',
    title: 'SPToc',
    description: 'Table of contents with active-section highlighting.',
    defaults: {
      label: 'On this page',
      items: [
        { label: 'Intro', href: '#intro', level: 0 },
        { label: 'Usage', href: '#usage', level: 0 },
        { label: 'Examples', href: '#examples', level: 1 },
      ],
    },
    variants: [],
  },
  {
    tag: 'sp-breadcrumb',
    title: 'SPBreadcrumb',
    description: 'Breadcrumb trail with current page marker.',
    defaults: {
      items: [
        { label: 'Design Kit', href: '#' },
        { label: 'Components', href: '#' },
        { label: 'SPButton' },
      ],
    },
    variants: [],
  },
  {
    tag: 'sp-page-nav',
    title: 'SPPageNav',
    description: 'Previous/next page navigation.',
    defaults: {
      'prev-label': 'Buttons',
      'prev-href': '#',
      'prev-subtitle': 'Components',
      'next-label': 'Icon Buttons',
      'next-href': '#',
      'next-subtitle': 'Components',
    },
    variants: [],
  },
  {
    tag: 'sp-theme-toggle',
    title: 'SPThemeToggle',
    description: 'Light/dark/auto theme control.',
    defaults: {},
    variants: [],
  },
  {
    tag: 'sp-segmented-toggle',
    title: 'SPSegmentedToggle',
    description: 'Mutually-exclusive segmented options.',
    defaults: { active: 'months' },
    variants: [
      { name: 'Two Options', props: { active: 'claude' } },
      { name: 'Three Options', props: { active: 'months' } },
      { name: 'Four Options', props: { active: 'all' } },
    ],
  },
  {
    tag: 'sp-modal',
    title: 'SPModal',
    description: 'Floating draggable modal dialog.',
    defaults: { title: 'Example Modal', position: 'center', width: 320, open: false },
    variants: [
      { name: 'Center', props: { position: 'center', width: 320 } },
      { name: 'Top Right', props: { position: 'top-right', width: 320 } },
      { name: 'Bottom Right', props: { position: 'bottom-right', width: 320 } },
    ],
  },
  {
    tag: 'sp-title-block',
    title: 'SPTitleBlock',
    description: 'Document identity block in the standards-manual tradition.',
    defaults: { 'doc-title': 'Design Token Specification', identifier: 'DK-2024-001', revision: '1.3', date: '2026-03-31', author: 'Standards Division', status: 'ACTIVE' },
    variants: [
      { name: 'Full', props: { 'doc-title': 'Design Token Specification', identifier: 'DK-2024-001', revision: '1.3', date: '2026-03-31', author: 'Standards Division', status: 'ACTIVE' } },
      { name: 'Minimal', props: { 'doc-title': 'Quarterly Report', date: '2026-03-31' } },
      { name: 'With Status', props: { 'doc-title': 'API Reference', identifier: 'API-v2', revision: '2.0', date: '2026-03-31', status: 'DRAFT' } },
    ],
  },
  {
    tag: 'sp-form-layout',
    title: 'SPFormLayout',
    description: 'Grid form layout for structured data entry.',
    defaults: { columns: 2, label: '' },
    variants: [
      { name: 'Two Column', props: { columns: 2 } },
      { name: 'Three Column', props: { columns: 3 } },
      { name: 'With Label', props: { columns: 2, label: 'PASSENGER DATA' } },
      { name: 'With Sections', props: { columns: 2, label: 'APPLICATION' } },
      { name: 'Single Column', props: { columns: 1 } },
    ],
  },
];

const elList = document.getElementById('component-list');
const elName = document.getElementById('viewer-name');
const elDesc = document.getElementById('viewer-desc');
const elFrame = document.getElementById('preview-frame');
const elVariants = document.getElementById('variants-grid');
const elProps = document.getElementById('props-editor');
const elMeta = document.getElementById('meta-grid');
const elEventLog = document.getElementById('event-log');
const elWRange = document.getElementById('width-range');
const elWNumber = document.getElementById('width-number');
const elHRange = document.getElementById('height-range');
const elHNumber = document.getElementById('height-number');

const EVENT_NAMES = [
  'sp-input',
  'sp-change',
  'sp-select',
  'sp-select-row',
  'sp-sort',
  'sp-toggle',
  'sp-toggle-change',
  'sp-tab-change',
  'sp-language-change',
  'sp-modal-open',
  'sp-modal-close',
  'sp-resize',
  'sp-collapse',
  'sp-toc-change',
];

const state = {
  selectedTag: COMPONENTS[0]?.tag || '',
  props: {},
  width: Number(elWRange.value),
  height: Number(elHRange.value),
  eventLog: [],
};

function getDefinition(tag) {
  return COMPONENTS.find((c) => c.tag === tag);
}

function getPropTypes(tag) {
  const cls = customElements.get(tag);
  return cls?.propTypes || {};
}

function applyProps(el, propTypes, props) {
  Object.entries(propTypes).forEach(([name, spec]) => {
    const type = spec?.type;
    const value = props[name];
    if (type === 'function') return;
    if (type === 'boolean') {
      if (value) el.setAttribute(name, '');
      else el.removeAttribute(name);
      return;
    }
    if (value === null || value === undefined || value === '') {
      el.removeAttribute(name);
      return;
    }
    if (type === 'object' || type === 'array') {
      el.setAttribute(name, JSON.stringify(value));
      return;
    }
    el.setAttribute(name, String(value));
  });
}

function applySlotContent(el, tag) {
  if (tag === 'sp-button') {
    el.textContent = 'Preview Button';
  } else if (tag === 'sp-icon-button') {
    el.textContent = 'x';
  } else if (tag === 'sp-collapsible-section') {
    const content = document.createElement('div');
    content.style.padding = 'var(--spacing-md)';
    content.style.fontFamily = 'var(--typography-mono)';
    content.style.fontSize = 'var(--font-size-xs)';
    content.style.color = 'var(--color-text-muted)';
    content.textContent = 'Collapsible section content.';
    el.appendChild(content);
  } else if (tag === 'sp-tab-bar') {
    ['overview', 'api', 'examples'].forEach((id) => {
      const tab = document.createElement('sp-tab');
      tab.id = id;
      tab.setAttribute('label', id[0].toUpperCase() + id.slice(1));
      el.appendChild(tab);
    });
  } else if (tag === 'sp-bottom-tab-bar') {
    ['home', 'search', 'settings'].forEach((id) => {
      const tab = document.createElement('sp-tab');
      tab.id = id;
      tab.setAttribute('label', id[0].toUpperCase() + id.slice(1));
      el.appendChild(tab);
    });
  } else if (tag === 'sp-code-block') {
    el.textContent = "print('hello from design-kit')";
  } else if (tag === 'sp-segmented-toggle') {
    const sets =
      state.props.active === 'claude'
        ? ['claude', 'cursor']
        : state.props.active === 'all'
          ? ['all', 'now', 'next', 'later']
          : ['months', 'weeks', 'days'];
    sets.forEach((id) => {
      const opt = document.createElement('sp-option');
      opt.id = id;
      opt.setAttribute('label', id[0].toUpperCase() + id.slice(1));
      el.appendChild(opt);
    });
  } else if (tag === 'sp-modal') {
    const p = document.createElement('p');
    p.style.fontFamily = 'var(--typography-mono)';
    p.style.fontSize = 'var(--font-size-xs)';
    p.style.color = 'var(--color-text-muted)';
    p.style.margin = '0';
    p.textContent = 'Use open=true to show this modal.';
    el.appendChild(p);
  } else if (tag === 'sp-app-shell') {
    const header = document.createElement('div');
    header.setAttribute('slot', 'header');
    header.style.padding = 'var(--spacing-sm) var(--spacing-md)';
    header.style.borderBottom = '1px solid var(--color-border)';
    header.style.fontFamily = 'var(--typography-mono)';
    header.style.fontSize = 'var(--font-size-xs)';
    header.textContent = 'Header';
    const left = document.createElement('sp-sidebar');
    left.setAttribute('slot', 'left-sidebar');
    left.setAttribute('width', '180');
    left.innerHTML = '<div style="padding: var(--spacing-sm); font-family: var(--typography-mono); font-size: var(--font-size-xs);">Left</div>';
    const main = document.createElement('div');
    main.style.padding = 'var(--spacing-md)';
    main.style.fontFamily = 'var(--typography-mono)';
    main.style.fontSize = 'var(--font-size-xs)';
    main.textContent = 'Main content';
    el.appendChild(header);
    el.appendChild(left);
    el.appendChild(main);
  } else if (tag === 'sp-field-row') {
    const control = document.createElement('sp-text-input');
    control.setAttribute('placeholder', 'Value');
    if (state.props.disabled) {
      control.setAttribute('disabled', '');
    }
    el.appendChild(control);
  } else if (tag === 'sp-form-layout') {
    const cols = state.props.columns || 2;
    const useSections = state.props.label === 'APPLICATION';
    const fields = useSections
      ? [
          { label: 'SURNAME', span: '2' },
          { label: 'GIVEN NAMES' },
          { label: 'DATE OF BIRTH' },
          { sectionHeader: 'CONTACT INFORMATION' },
          { label: 'EMAIL', span: '2' },
          { label: 'PHONE' },
          { label: 'COUNTRY' },
        ]
      : [
          { label: 'SURNAME', span: Math.min(cols, 2) > 1 ? '2' : null },
          { label: 'GIVEN NAMES' },
          { label: 'DATE OF BIRTH' },
          { label: 'NATIONALITY' },
          ...(cols >= 3 ? [{ label: 'DOCUMENT NO.' }] : []),
        ];
    fields.forEach((f) => {
      if (f.sectionHeader) {
        const div = document.createElement('div');
        div.setAttribute('section-header', '');
        div.textContent = f.sectionHeader;
        el.appendChild(div);
        return;
      }
      const row = document.createElement('sp-field-row');
      row.setAttribute('label', f.label);
      if (f.span) row.setAttribute('span', f.span);
      const input = document.createElement('sp-text-input');
      input.setAttribute('placeholder', f.label);
      row.appendChild(input);
      el.appendChild(row);
    });
  } else if (tag === 'sp-expandable-card') {
    const content = document.createElement('div');
    content.style.fontFamily = 'var(--typography-mono)';
    content.style.fontSize = 'var(--font-size-xs)';
    content.style.color = 'var(--color-text-muted)';
    content.textContent = 'Expandable card content goes here.';
    el.appendChild(content);
  }
}

function buildInstance(tag, props) {
  const el = document.createElement(tag);
  const propTypes = getPropTypes(tag);
  applyProps(el, propTypes, props);
  applySlotContent(el, tag);
  return el;
}

function renderList() {
  elList.innerHTML = '';
  COMPONENTS.forEach((def) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `component-item${state.selectedTag === def.tag ? ' active' : ''}`;
    button.textContent = def.title;
    button.addEventListener('click', () => {
      selectComponent(def.tag);
    });
    elList.appendChild(button);
  });
}

function renderMeta(def) {
  const cls = customElements.get(def.tag);
  const meta = cls?.metadata || {};
  const entries = [
    ['Tag', def.tag],
    ['Name', meta.name || def.title],
    ['Category', meta.category || '-'],
    ['Variants', String(def.variants?.length || 0)],
  ];
  elMeta.innerHTML = '';
  entries.forEach(([k, v]) => {
    const kEl = document.createElement('div');
    kEl.className = 'meta-k';
    kEl.textContent = k;
    const vEl = document.createElement('div');
    vEl.className = 'meta-v';
    vEl.textContent = v;
    elMeta.appendChild(kEl);
    elMeta.appendChild(vEl);
  });
}

function renderProps(def) {
  const propTypes = getPropTypes(def.tag);
  elProps.innerHTML = '';
  Object.entries(propTypes).forEach(([name, spec]) => {
    if (spec?.type === 'function') return;
    const row = document.createElement('div');
    row.className = 'prop-row';
    const label = document.createElement('label');
    label.className = 'prop-name';
    label.textContent = name;
    row.appendChild(label);
    let input;
    if (spec?.type === 'boolean') {
      input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = Boolean(state.props[name]);
      input.addEventListener('change', () => {
        state.props[name] = input.checked;
        renderPreview();
      });
    } else {
      input = document.createElement('input');
      input.className = 'prop-input';
      input.type = spec?.type === 'number' ? 'number' : 'text';
      const value = state.props[name];
      if (spec?.type === 'object' || spec?.type === 'array') {
        input.value = value ? JSON.stringify(value) : '';
      } else {
        input.value = value === undefined || value === null ? '' : String(value);
      }
      input.addEventListener('input', () => {
        if (spec?.type === 'number') {
          state.props[name] = input.value === '' ? null : Number(input.value);
        } else if (spec?.type === 'object' || spec?.type === 'array') {
          if (input.value === '') {
            state.props[name] = null;
          } else {
            try {
              state.props[name] = JSON.parse(input.value);
            } catch {
              return;
            }
          }
        } else {
          state.props[name] = input.value;
        }
        renderPreview();
      });
    }
    row.appendChild(input);
    elProps.appendChild(row);
  });
}

function renderVariants(def) {
  elVariants.innerHTML = '';
  def.variants.forEach((variant) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'variant-btn';
    btn.textContent = variant.name;
    btn.addEventListener('click', () => {
      state.props = { ...state.props, ...variant.props };
      renderProps(def);
      renderPreview();
    });
    elVariants.appendChild(btn);
  });
}

function clearEventLog() {
  state.eventLog = [];
  renderEventLog();
}

function renderEventLog() {
  if (!elEventLog) return;
  if (state.eventLog.length === 0) {
    elEventLog.innerHTML =
      '<div class="event-log-empty">Interact with the preview to inspect events.</div>';
    return;
  }

  const rows = state.eventLog
    .map((entry) => {
      const detailText = entry.detail ? JSON.stringify(entry.detail) : '{}';
      return `<div class="event-log-row"><span class="event-log-event">${entry.event}</span><span class="event-log-target">${entry.target}</span>${detailText}</div>`;
    })
    .join('');
  elEventLog.innerHTML = rows;
}

function pushEventLog(eventName, targetTag, detail) {
  const target = (targetTag || '').toLowerCase() || 'unknown';
  state.eventLog.unshift({
    event: eventName,
    target,
    detail: detail || {},
  });
  if (state.eventLog.length > 25) {
    state.eventLog = state.eventLog.slice(0, 25);
  }
  renderEventLog();
}

function bindEventLogListeners() {
  EVENT_NAMES.forEach((eventName) => {
    elFrame.addEventListener(eventName, (event) => {
      pushEventLog(eventName, event.target?.tagName, event.detail);
    });
  });
}

function renderPreview() {
  const def = getDefinition(state.selectedTag);
  if (!def) return;
  elFrame.innerHTML = '';
  elFrame.style.width = `${state.width}px`;
  elFrame.style.height = `${state.height}px`;
  const instance = buildInstance(def.tag, state.props);
  elFrame.appendChild(instance);
}

function selectComponent(tag) {
  const def = getDefinition(tag);
  if (!def) return;
  state.selectedTag = tag;
  state.props = { ...def.defaults };
  clearEventLog();
  elName.textContent = def.title;
  elDesc.textContent = def.description;
  renderList();
  renderMeta(def);
  renderProps(def);
  renderVariants(def);
  renderPreview();
}

function bindSizeControls() {
  const syncWidth = (value) => {
    const next = Math.max(120, Math.min(900, Number(value)));
    state.width = next;
    elWRange.value = String(next);
    elWNumber.value = String(next);
    renderPreview();
  };
  const syncHeight = (value) => {
    const next = Math.max(80, Math.min(640, Number(value)));
    state.height = next;
    elHRange.value = String(next);
    elHNumber.value = String(next);
    renderPreview();
  };
  elWRange.addEventListener('input', () => syncWidth(elWRange.value));
  elWNumber.addEventListener('input', () => syncWidth(elWNumber.value || state.width));
  elHRange.addEventListener('input', () => syncHeight(elHRange.value));
  elHNumber.addEventListener('input', () => syncHeight(elHNumber.value || state.height));
}

bindSizeControls();
bindEventLogListeners();
if (COMPONENTS.length > 0) {
  selectComponent(COMPONENTS[0].tag);
}
