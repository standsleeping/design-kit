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
];

const elList = document.getElementById('component-list');
const elName = document.getElementById('viewer-name');
const elDesc = document.getElementById('viewer-desc');
const elFrame = document.getElementById('preview-frame');
const elVariants = document.getElementById('variants-grid');
const elProps = document.getElementById('props-editor');
const elMeta = document.getElementById('meta-grid');
const elWRange = document.getElementById('width-range');
const elWNumber = document.getElementById('width-number');
const elHRange = document.getElementById('height-range');
const elHNumber = document.getElementById('height-number');

const state = {
  selectedTag: COMPONENTS[0]?.tag || '',
  props: {},
  width: Number(elWRange.value),
  height: Number(elHRange.value),
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
if (COMPONENTS.length > 0) {
  selectComponent(COMPONENTS[0].tag);
}
