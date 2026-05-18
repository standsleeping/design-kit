// Storybook chrome — sits on top of `runtime.js`. The runtime owns pool scan,
// contract validation, sibling-CSS loading, slot resolution, the luminance +
// color-theme toggles, and the event-log capture. This module owns the
// storybook-specific UI: the component nav list with pool tabs, resizable
// variant cards, the propTypes inspector, layout persistence across the two
// resizable Sidebars, the hash-routed selection, and the main() orchestrator.
import {
  mountLuminanceToggle,
  mountColorThemeToggle,
  scanPool,
  renderEntry,
  resolveSlots,
  runCleanups,
  installEventLog,
} from './system/runtime.js';
import { mountSystemSidebar } from './system/system-sidebar.js';
import { LEVELS, TARGETS } from './system/nav-data.js';

const CONFIG_URL = 'components/storybook.config.json';
const LOCAL_CONFIG_URL = 'components/storybook.config.local.json';

async function loadConfig() {
  const res = await fetch(CONFIG_URL, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`config load failed: ${res.status}`);
  const config = await res.json();
  try {
    const localRes = await fetch(LOCAL_CONFIG_URL, { cache: 'no-cache' });
    if (localRes.ok) {
      const local = await localRes.json();
      const byName = new Map((config.pools ?? []).map((p) => [p.name, p]));
      for (const pool of local.pools ?? []) byName.set(pool.name, pool);
      config.pools = [...byName.values()];
    }
  } catch {
    /* local override is optional */
  }
  return config;
}

// Build NavStack items from the component registry. Section-headers separate
// pools when more than one is loaded; section-items render each component.
// The id is `<pool>/<componentName>` — same shape as the URL hash that
// storybook routes on. Matches the canonical sidebar pattern in
// components/system/nav-data.js (used on the index page).
function buildNavStackItems(registry, active, showPoolHeaders) {
  const items = [];
  let lastPool = null;
  for (const entry of registry) {
    if (showPoolHeaders && entry.pool !== lastPool) {
      items.push({
        kind: 'section-header',
        id: `pool-${entry.pool}`,
        label: entry.pool,
      });
      lastPool = entry.pool;
    }
    const id = `${entry.pool}/${entry.mod.metadata.name}`;
    const isActive =
      entry.pool === active?.pool &&
      entry.mod.metadata.name === active?.mod.metadata.name;
    items.push({
      kind: showPoolHeaders ? 'section-item' : 'item',
      id,
      label: entry.mod.metadata.name,
      selected: isActive,
    });
  }
  return items;
}

const RESIZE_MIN = 40;
const RESIZE_MAX = 2400;
const RESIZE_KEY_STEP = 8;
const RESIZE_KEY_STEP_LARGE = 32;

function clampSize(value) {
  return Math.max(RESIZE_MIN, Math.min(RESIZE_MAX, Math.round(value)));
}

// Wires drag and keyboard resize affordances into a variant card. All inline
// style + override-map mutation lives here; renderVariants stays declarative.
function installResizableCard(card, body, opts) {
  const { variantName, sizeOverrides, defaults, footerText, onChange } = opts;
  const initial = sizeOverrides.get(variantName);

  const applyHeightOverride = (h) => {
    card.style.height = `${h}px`;
    body.style.minHeight = '0';
    body.style.overflow = 'auto';
  };

  if (initial?.w !== undefined) card.style.width = `${initial.w}px`;
  if (initial?.h !== undefined) applyHeightOverride(initial.h);
  if (initial?.w !== undefined || initial?.h !== undefined) {
    card.classList.add('storybook-variant-card-overridden');
  }

  const updateFooter = () => {
    const rect = card.getBoundingClientRect();
    footerText.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)} px`;
  };
  requestAnimationFrame(updateFooter);

  const setOverrides = (patch) => {
    const cur = sizeOverrides.get(variantName) ?? {};
    sizeOverrides.set(variantName, { ...cur, ...patch });
    card.classList.add('storybook-variant-card-overridden');
  };

  const applyDelta = (axis, dx, dy, base) => {
    const patch = {};
    if (axis === 'x' || axis === 'xy') {
      const w = clampSize(base.w + dx);
      card.style.width = `${w}px`;
      patch.w = w;
    }
    if (axis === 'y' || axis === 'xy') {
      const h = clampSize(base.h + dy);
      applyHeightOverride(h);
      patch.h = h;
    }
    setOverrides(patch);
    updateFooter();
    onChange?.();
  };

  const clearOverrides = () => {
    sizeOverrides.delete(variantName);
    card.style.width = `${defaults.w}px`;
    card.style.height = '';
    body.style.overflow = '';
    body.style.minHeight = defaults.h > 0 ? `${defaults.h}px` : '';
    card.classList.remove('storybook-variant-card-overridden');
    requestAnimationFrame(updateFooter);
    onChange?.();
  };

  const installHandle = (axis, className, label) => {
    const handle = document.createElement('div');
    handle.className = `storybook-variant-resize ${className}`;
    handle.title = `Drag or arrow keys to resize · double-click to reset`;
    handle.setAttribute('role', 'separator');
    handle.setAttribute('tabindex', '0');
    handle.setAttribute('aria-label', label);
    if (axis === 'x') handle.setAttribute('aria-orientation', 'vertical');
    else if (axis === 'y') handle.setAttribute('aria-orientation', 'horizontal');

    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      const startX = e.clientX;
      const startY = e.clientY;
      const rect = card.getBoundingClientRect();
      const base = { w: rect.width, h: rect.height };
      const onMove = (mv) => applyDelta(axis, mv.clientX - startX, mv.clientY - startY, base);
      const onUp = (up) => {
        handle.releasePointerCapture(up.pointerId);
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
      };
      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
    });

    handle.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? RESIZE_KEY_STEP_LARGE : RESIZE_KEY_STEP;
      let dx = 0, dy = 0;
      if (e.key === 'ArrowLeft')  dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else if (e.key === 'ArrowUp')    dy = -step;
      else if (e.key === 'ArrowDown')  dy = step;
      else if (e.key === 'Escape') { clearOverrides(); e.preventDefault(); return; }
      else return;
      if ((axis === 'x' && dx === 0) || (axis === 'y' && dy === 0)) return;
      e.preventDefault();
      const rect = card.getBoundingClientRect();
      applyDelta(axis, dx, dy, { w: rect.width, h: rect.height });
    });

    handle.addEventListener('dblclick', clearOverrides);
    card.append(handle);
  };

  installHandle('x',  'storybook-variant-resize-x',  `Resize ${variantName} width`);
  installHandle('y',  'storybook-variant-resize-y',  `Resize ${variantName} height`);
  installHandle('xy', 'storybook-variant-resize-xy', `Resize ${variantName} width and height`);
}

function renderVariants(variantsEl, entry, width, height, registry, cleanups, overrides, sizeOverrides, callbacks) {
  runCleanups(cleanups);
  variantsEl.innerHTML = '';
  for (const variant of entry.mod.variants) {
    const card = document.createElement('section');
    card.className = 'storybook-variant-card';
    card.style.width = `${width}px`;

    const header = document.createElement('header');
    header.className = 'storybook-variant-header';
    const name = document.createElement('span');
    name.className = 'storybook-variant-name';
    name.textContent = variant.name;
    header.append(name);
    if (variant.description) {
      const desc = document.createElement('span');
      desc.className = 'storybook-variant-description';
      desc.textContent = variant.description;
      header.append(desc);
    }
    card.append(header);

    const body = document.createElement('div');
    body.className = 'storybook-variant-body';
    if (height > 0) body.style.minHeight = `${height}px`;
    const mergedProps = overrides ? { ...(variant.props ?? {}), ...overrides } : variant.props;
    const node = renderEntry(entry.mod, mergedProps, cleanups);
    if (variant.slots) resolveSlots(node, variant.slots, registry, cleanups);
    body.append(node);
    card.append(body);

    const footer = document.createElement('footer');
    footer.className = 'storybook-variant-footer';
    const footerText = document.createElement('span');
    footer.append(footerText);
    card.append(footer);

    if (sizeOverrides) {
      installResizableCard(card, body, {
        variantName: variant.name,
        sizeOverrides,
        defaults: { w: width, h: height },
        footerText,
        onChange: callbacks?.onResize,
      });
    } else {
      requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        footerText.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)} px`;
      });
    }

    variantsEl.append(card);
  }
}

function hashToSelection(hash, registry) {
  if (!hash || !hash.startsWith('#')) return registry[0];
  const [poolName, name] = hash.slice(1).split('/');
  return (
    registry.find((e) => e.pool === poolName && e.mod.metadata.name === name) ??
    registry[0]
  );
}

const LAYOUT_STORAGE_KEY = 'dk-storybook-layout';
const LAYOUT_DEFAULTS = { nav: 240, inspector: 320 };
const LAYOUT_CONSTRAINTS = {
  nav: { min: 160, max: 360 },
  inspector: { min: 240, max: 480 },
};

function loadLayout() {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return { ...LAYOUT_DEFAULTS };
    const parsed = JSON.parse(raw);
    return {
      nav: Number(parsed.nav) || LAYOUT_DEFAULTS.nav,
      inspector: Number(parsed.inspector) || LAYOUT_DEFAULTS.inspector,
    };
  } catch {
    return { ...LAYOUT_DEFAULTS };
  }
}

function saveLayout(layout) {
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  } catch {
    /* quota or disabled — ignore */
  }
}

// Mount nav and inspector content into left + right Sidebars inside the
// AppShell. Sidebar's built-in resizer + sidebar:resize event drives
// persistence; LAYOUT_CONSTRAINTS becomes minWidth/maxWidth props.
async function mountSidebars() {
  const inspectorHost = document.querySelector('[data-storybook-inspector-host]');
  const navMount = document.querySelector('.dk-app-shell-left');
  const inspectorMount = document.querySelector('.dk-app-shell-right');
  if (!inspectorHost || !navMount || !inspectorMount) return null;

  const layout = loadLayout();
  const sidebarMod = await import('./sidebar.js');

  const navSb = sidebarMod.render({
    side: 'left',
    width: layout.nav,
    minWidth: LAYOUT_CONSTRAINTS.nav.min,
    maxWidth: LAYOUT_CONSTRAINTS.nav.max,
    resizable: true,
  });
  const inspectorSb = sidebarMod.render({
    side: 'right',
    width: layout.inspector,
    minWidth: LAYOUT_CONSTRAINTS.inspector.min,
    maxWidth: LAYOUT_CONSTRAINTS.inspector.max,
    resizable: true,
  });

  inspectorSb.querySelector('[data-slot="main"]').append(inspectorHost);
  navMount.append(navSb);
  inspectorMount.append(inspectorSb);

  navSb.addEventListener('sidebar:resize', (e) => {
    layout.nav = e.detail.width;
    saveLayout(layout);
  });
  inspectorSb.addEventListener('sidebar:resize', (e) => {
    layout.inspector = e.detail.width;
    saveLayout(layout);
  });

  return { navSlot: navSb.querySelector('[data-slot="main"]') };
}

async function main() {
  const config = await loadConfig();

  const el = {
    count: document.querySelector('[data-storybook-count]'),
    name: document.querySelector('[data-storybook-component-name]'),
    example: document.querySelector('[data-storybook-component-example]'),
    widthSlider: document.querySelector('[data-storybook-width-slider]'),
    widthNumber: document.querySelector('[data-storybook-width-number]'),
    heightSlider: document.querySelector('[data-storybook-height-slider]'),
    heightNumber: document.querySelector('[data-storybook-height-number]'),
    variants: document.querySelector('[data-storybook-variants]'),
    events: document.querySelector('[data-storybook-events]'),
    footerHash: document.querySelector('[data-storybook-footer-hash]'),
    footerSize: document.querySelector('[data-storybook-footer-size]'),
    propsForm: document.querySelector('[data-storybook-props-form]'),
    propsReset: document.querySelector('[data-storybook-props-reset]'),
    luminanceMount: document.querySelector('[data-storybook-luminance]'),
    colorThemeMount: document.querySelector('[data-storybook-color-theme]'),
  };

  const [, , sidebars] = await Promise.all([
    mountLuminanceToggle(el.luminanceMount),
    mountColorThemeToggle(el.colorThemeMount),
    mountSidebars(),
  ]);

  let registry = [];
  const poolNames = [];
  for (const pool of config.pools ?? []) {
    const poolRegistry = await scanPool(pool);
    if (poolRegistry.length > 0 && !poolNames.includes(pool.name)) {
      poolNames.push(pool.name);
    }
    registry = registry.concat(poolRegistry);
  }

  el.count.textContent = `${registry.length} registered`;

  if (registry.length === 0) {
    el.variants.textContent = 'No components loaded. Check storybook.config.json.';
    return;
  }

  const eventLog = installEventLog(el.variants, el.events);
  const cleanups = [];

  let active = hashToSelection(window.location.hash, registry);
  let width = Number(el.widthSlider.value);
  let height = Number(el.heightSlider.value);
  let overrides = {};
  const sizeOverrides = new Map();
  const updateFooter = () => {
    if (el.footerHash) {
      el.footerHash.textContent = `#${active.pool}/${active.mod.metadata.name}`;
    }
    if (el.footerSize) {
      const h = height > 0 ? `${height}px` : 'auto';
      const n = sizeOverrides.size;
      const suffix = n > 0 ? ` · ${n} card override${n === 1 ? '' : 's'}` : '';
      el.footerSize.textContent = `Width ${width}px · Height ${h}${suffix}`;
    }
  };

  const variantCallbacks = { onResize: updateFooter };

  // NavStack lifecycle. Storybook delegates to mountSystemSidebar with an
  // augmented two-level structure: the canonical system root (with the
  // 'storybook' item rewritten as a branch into the sub-level) plus a
  // 'storybook' sub-level whose items are the component registry. Initial
  // path drills the user straight into the storybook sub-level; the
  // NavStack back button pops them to the system root, from which any
  // other system page is one click away. Re-renders on every paint so the
  // selected component reflects the active entry.
  let currentNav = null;
  const handleNavSelect = (e) => {
    const id = e.detail.id;
    if (id.startsWith('pool-')) return;
    if (id in TARGETS) {
      const target = TARGETS[id];
      // Token anchors (#colors, #typography, ...) live on the index page;
      // navigate there rather than mutate storybook's own #pool/component
      // hash, which would mis-route the component selection.
      window.location.href = target.startsWith('#')
        ? `index.html${target}`
        : target;
      return;
    }
    const [poolName, componentName] = id.split('/');
    const entry = registry.find(
      (e2) => e2.pool === poolName && e2.mod.metadata.name === componentName,
    );
    if (entry) select(entry);
  };
  const renderNav = async () => {
    if (!sidebars) return;
    if (currentNav) currentNav.remove();
    const componentItems = buildNavStackItems(
      registry, active, poolNames.length > 1,
    );
    const systemRoot = {
      ...LEVELS[0],
      items: LEVELS[0].items.map((item) =>
        item.id === 'storybook'
          ? { ...item, kind: 'branch', branchTo: 'storybook' }
          : item,
      ),
    };
    const storybookLevel = {
      id: 'storybook',
      title: 'Components',
      items: componentItems,
    };
    currentNav = await mountSystemSidebar({
      host: sidebars.navSlot,
      levels: [systemRoot, storybookLevel],
      current: 'storybook',
      initialPath: ['root', 'storybook'],
      onSelect: handleNavSelect,
    });
  };

  const paint = () => {
    renderNav();
    el.name.textContent = active.mod.metadata.name;
    if (el.example) {
      const examplePage = active.mod.metadata.examplePage;
      if (examplePage) {
        el.example.hidden = false;
        el.example.href = examplePage;
        el.example.textContent = 'Example →';
      } else {
        el.example.hidden = true;
        el.example.removeAttribute('href');
      }
    }
    renderVariants(el.variants, active, width, height, registry, cleanups, overrides, sizeOverrides, variantCallbacks);
    renderPropsForm();
    updateFooter();
  };

  const repaintVariants = () => {
    renderVariants(el.variants, active, width, height, registry, cleanups, overrides, sizeOverrides, variantCallbacks);
  };

  const select = (entry) => {
    active = entry;
    window.location.hash = `${entry.pool}/${entry.mod.metadata.name}`;
    eventLog.clear();
    overrides = {};
    sizeOverrides.clear();
    paint();
  };

  const setWidth = (next) => {
    width = Math.max(
      Number(el.widthSlider.min),
      Math.min(Number(el.widthSlider.max), next),
    );
    el.widthSlider.value = String(width);
    el.widthNumber.value = String(width);
    repaintVariants();
    updateFooter();
  };

  const setHeight = (next) => {
    height = Math.max(
      Number(el.heightSlider.min),
      Math.min(Number(el.heightSlider.max), next),
    );
    el.heightSlider.value = String(height);
    el.heightNumber.value = height > 0 ? String(height) : '';
    repaintVariants();
    updateFooter();
  };

  function renderPropsForm() {
    if (!el.propsForm) return;
    el.propsForm.innerHTML = '';
    const propTypes = active.mod.propTypes ?? {};
    const keys = Object.keys(propTypes);
    if (keys.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'storybook-props-empty';
      empty.textContent = 'This component has no editable props.';
      el.propsForm.append(empty);
      return;
    }
    const baseVariantProps = active.mod.variants?.[0]?.props ?? {};
    for (const key of keys) {
      const descriptor = propTypes[key];
      const current = overrides[key] !== undefined
        ? overrides[key]
        : (baseVariantProps[key] !== undefined ? baseVariantProps[key] : descriptor.default);
      el.propsForm.append(buildPropRow(key, descriptor, current, (value) => {
        overrides[key] = value;
        repaintVariants();
      }));
    }
  }

  function buildPropRow(key, descriptor, value, onChange) {
    const row = document.createElement('div');
    row.className = 'storybook-prop-row';
    const label = document.createElement('label');
    label.className = 'storybook-prop-label';
    label.textContent = key;
    const type = document.createElement('span');
    type.className = 'storybook-prop-type';
    type.textContent = ` · ${descriptor.type}`;
    label.append(type);
    row.append(label);

    if (descriptor.type === 'boolean') {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'storybook-prop-input storybook-prop-checkbox';
      input.checked = Boolean(value);
      input.addEventListener('change', () => onChange(input.checked));
      label.prepend(input);
      label.style.flexDirection = 'row';
      label.style.gap = 'var(--spacing-xs)';
      return row;
    }
    if (descriptor.type === 'enum') {
      const select = document.createElement('select');
      select.className = 'storybook-prop-input';
      for (const option of (descriptor.options ?? [])) {
        const opt = document.createElement('option');
        opt.value = String(option);
        opt.textContent = String(option);
        if (String(option) === String(value)) opt.selected = true;
        select.append(opt);
      }
      select.addEventListener('change', () => onChange(select.value));
      row.append(select);
      return row;
    }
    if (descriptor.type === 'number') {
      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'storybook-prop-input';
      if (value !== undefined && value !== null) input.value = String(value);
      input.addEventListener('input', () => {
        const v = input.value === '' ? null : Number(input.value);
        onChange(v);
      });
      row.append(input);
      return row;
    }
    if (descriptor.type === 'array' || descriptor.type === 'object') {
      const textarea = document.createElement('textarea');
      textarea.className = 'storybook-prop-input';
      textarea.value = value === null || value === undefined
        ? (descriptor.type === 'array' ? '[]' : '{}')
        : JSON.stringify(value, null, 2);
      textarea.addEventListener('input', () => {
        try {
          const parsed = JSON.parse(textarea.value);
          textarea.classList.remove('storybook-prop-input-invalid');
          onChange(parsed);
        } catch {
          textarea.classList.add('storybook-prop-input-invalid');
        }
      });
      row.append(textarea);
      return row;
    }
    // string default
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'storybook-prop-input';
    input.value = value ?? '';
    input.addEventListener('input', () => onChange(input.value));
    row.append(input);
    return row;
  }

  el.widthSlider.addEventListener('input', () => setWidth(Number(el.widthSlider.value)));
  el.widthNumber.addEventListener('input', () => setWidth(Number(el.widthNumber.value)));
  el.heightSlider.addEventListener('input', () => setHeight(Number(el.heightSlider.value)));
  el.heightNumber.addEventListener('input', () => setHeight(Number(el.heightNumber.value)));

  const AXES = [
    { key: 'mono', def: 1,   digits: 1 },
    { key: 'casl', def: 0,   digits: 1 },
    { key: 'slnt', def: 0,   digits: 0 },
    { key: 'crsv', def: 0.5, digits: 1 },
  ];
  const axisInputs = document.querySelectorAll('[data-storybook-axis]');
  const applyAxis = (key, value) => {
    const axis = AXES.find((a) => a.key === key);
    if (!axis) return;
    const readout = document.querySelector(`[data-storybook-axis-readout="${key}"]`);
    if (readout) readout.textContent = Number(value).toFixed(axis.digits);
    el.variants.style.setProperty(`--${key}`, String(value));
  };
  for (const input of axisInputs) {
    input.addEventListener('input', () => applyAxis(input.dataset.storybookAxis, input.value));
  }
  const resetBtn = document.querySelector('[data-storybook-axes-reset]');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      for (const axis of AXES) {
        const input = document.querySelector(`[data-storybook-axis="${axis.key}"]`);
        if (input) input.value = String(axis.def);
        applyAxis(axis.key, axis.def);
      }
    });
  }

  for (const tab of document.querySelectorAll('[data-storybook-inspector-tab]')) {
    tab.addEventListener('click', () => {
      const target = tab.dataset.storybookInspectorTab;
      for (const t of document.querySelectorAll('[data-storybook-inspector-tab]')) {
        const isActive = t === tab;
        t.classList.toggle('storybook-inspector-tab-active', isActive);
        t.setAttribute('aria-selected', String(isActive));
      }
      for (const panel of document.querySelectorAll('[data-storybook-inspector-panel]')) {
        panel.hidden = panel.dataset.storybookInspectorPanel !== target;
      }
    });
  }

  if (el.propsReset) {
    el.propsReset.addEventListener('click', () => {
      overrides = {};
      renderPropsForm();
      repaintVariants();
    });
  }
  window.addEventListener('hashchange', () => {
    const next = hashToSelection(window.location.hash, registry);
    if (next && next !== active) {
      active = next;
      eventLog.clear();
      paint();
    }
  });

  paint();
}

main().catch((err) => {
  console.error('[storybook] fatal:', err);
  document.body.insertAdjacentHTML(
    'beforeend',
    `<pre style="color:#a33;padding:1rem">[storybook] ${String(err)}</pre>`,
  );
});
