const CONTRACT_EXPORTS = ['metadata', 'propTypes', 'variants', 'render'];
const ALLOWED_PROP_TYPES = ['string', 'number', 'boolean', 'enum', 'array', 'object'];
const MAX_EVENT_LOG = 50;
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

function conforms(mod) {
  return CONTRACT_EXPORTS.every((key) => key in mod);
}

function validatePropTypes(url, propTypes) {
  if (!propTypes || typeof propTypes !== 'object') {
    console.warn(`[storybook] ${url}: propTypes must be an object`);
    return;
  }
  for (const [key, descriptor] of Object.entries(propTypes)) {
    if (!descriptor || typeof descriptor !== 'object') {
      console.warn(`[storybook] ${url}: propTypes.${key} is not a descriptor object`);
      continue;
    }
    if (!ALLOWED_PROP_TYPES.includes(descriptor.type)) {
      console.warn(
        `[storybook] ${url}: propTypes.${key}.type = '${descriptor.type}' is not allowed ` +
        `(allowed: ${ALLOWED_PROP_TYPES.join(', ')})`,
      );
    }
    if (descriptor.type === 'enum' && !Array.isArray(descriptor.options)) {
      console.warn(`[storybook] ${url}: propTypes.${key} has type 'enum' but no options array`);
    }
  }
}

async function ensureSiblingStyle(moduleUrl) {
  const cssUrl = moduleUrl.replace(/\.js$/, '.css');
  const selector = `link[data-storybook-sibling="${cssUrl}"]`;
  if (document.querySelector(selector)) return;
  try {
    const probe = await fetch(cssUrl, { method: 'HEAD' });
    if (!probe.ok) return;
  } catch {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = cssUrl;
  link.dataset.storybookSibling = cssUrl;
  document.head.append(link);
}

async function loadPoolStylesheet(pool) {
  if (!pool.stylesheet) return;
  if (document.querySelector(`link[data-storybook-pool="${pool.name}"]`)) return;
  const resolved = new URL(pool.stylesheet, document.baseURI).href;
  const existing = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  if (existing.some((l) => l.href === resolved)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = pool.stylesheet;
  link.dataset.storybookPool = pool.name;
  document.head.append(link);
}

async function resolveComponents(pool) {
  if (Array.isArray(pool.components)) return pool.components;
  const manifestUrl = new URL(`${pool.path}/manifest.json`, document.baseURI).href;
  try {
    const res = await fetch(manifestUrl, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.components)) return data.components;
    console.warn(`[storybook] ${manifestUrl} has unexpected shape; expected array or { components: [] }`);
    return [];
  } catch (err) {
    console.warn(`[storybook] ${pool.name}: no components array and manifest fetch failed: ${err.message}`);
    return [];
  }
}

async function scanPool(pool) {
  await loadPoolStylesheet(pool);
  const registry = [];
  const components = await resolveComponents(pool);
  for (const filename of components) {
    const url = new URL(`${pool.path}/${filename}`, document.baseURI).href;
    let mod;
    try {
      mod = await import(url);
    } catch (err) {
      console.warn(`[storybook] failed to import ${url}:`, err);
      continue;
    }
    if (!conforms(mod)) {
      console.warn(
        `[storybook] ${url} does not conform to contract (expected: ${CONTRACT_EXPORTS.join(', ')})`,
      );
      continue;
    }
    validatePropTypes(url, mod.propTypes);
    await ensureSiblingStyle(url);
    registry.push({ pool: pool.name, url, mod });
  }
  return registry;
}

function renderComponentList(listEl, registry, active, onSelect, showPoolHeaders) {
  listEl.innerHTML = '';
  let lastPool = null;
  for (const entry of registry) {
    if (showPoolHeaders && entry.pool !== lastPool) {
      const header = document.createElement('span');
      header.className = 'storybook-pool-header';
      header.textContent = entry.pool;
      listEl.append(header);
      lastPool = entry.pool;
    }
    const link = document.createElement('a');
    link.href = `#${entry.pool}/${entry.mod.metadata.name}`;
    link.className = 'storybook-component-link';
    if (entry.pool === active?.pool && entry.mod.metadata.name === active?.mod.metadata.name) {
      link.classList.add('is-active');
    }
    link.textContent = entry.mod.metadata.name;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      onSelect(entry);
    });
    listEl.append(link);
  }
}

const POOL_FILTER_STORAGE_KEY = 'dk-storybook-pool-filter';
const POOL_FILTER_ALL = 'all';

function loadPoolFilter() {
  try {
    return localStorage.getItem(POOL_FILTER_STORAGE_KEY) || POOL_FILTER_ALL;
  } catch {
    return POOL_FILTER_ALL;
  }
}

function savePoolFilter(value) {
  try {
    localStorage.setItem(POOL_FILTER_STORAGE_KEY, value);
  } catch {
    /* quota or disabled — ignore */
  }
}

function renderPoolFilter(filterEl, poolNames, activeFilter, onChange) {
  filterEl.innerHTML = '';
  if (poolNames.length < 2) {
    filterEl.hidden = true;
    return;
  }
  filterEl.hidden = false;
  const entries = [POOL_FILTER_ALL, ...poolNames];
  entries.forEach((value, idx) => {
    if (idx > 0) {
      const sep = document.createElement('span');
      sep.className = 'storybook-pool-tab-separator';
      sep.setAttribute('aria-hidden', 'true');
      sep.textContent = '\u00B7';
      filterEl.append(sep);
    }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'storybook-pool-tab';
    btn.dataset.poolFilter = value;
    btn.setAttribute('role', 'tab');
    const isActive = value === activeFilter;
    btn.setAttribute('aria-selected', String(isActive));
    if (isActive) btn.classList.add('storybook-pool-tab-active');
    btn.textContent = value === POOL_FILTER_ALL ? 'All' : value;
    btn.addEventListener('click', () => onChange(value));
    filterEl.append(btn);
  });
}

function renderEntry(mod, props, cleanups) {
  const rendered = mod.render(props ?? {});
  if (rendered instanceof HTMLElement) return rendered;
  if (typeof rendered.cleanup === 'function') cleanups.push(rendered.cleanup);
  return rendered.node;
}

function renderSpec(spec, registry, cleanups) {
  const entry = registry.find((e) => e.mod.metadata.name === spec.component);
  if (!entry) {
    console.warn(`[storybook] slot component not found: ${spec.component}`);
    const fallback = document.createElement('span');
    fallback.textContent = `[missing: ${spec.component}]`;
    return fallback;
  }
  const node = renderEntry(entry.mod, spec.props, cleanups);
  if (spec.slots) resolveSlots(node, spec.slots, registry, cleanups);
  return node;
}

function resolveSlots(root, slots, registry, cleanups) {
  for (const [key, value] of Object.entries(slots)) {
    const target = root.matches?.(`[data-slot="${key}"]`)
      ? root
      : root.querySelector(`[data-slot="${key}"]`);
    if (!target) {
      console.warn(`[storybook] no [data-slot="${key}"] element in shell`);
      continue;
    }
    const specs = Array.isArray(value) ? value : [value];
    for (const spec of specs) {
      target.append(renderSpec(spec, registry, cleanups));
    }
  }
}

function runCleanups(cleanups) {
  for (const fn of cleanups) {
    try { fn(); } catch (err) { console.warn('[storybook] cleanup failed:', err); }
  }
  cleanups.length = 0;
}

function renderVariants(variantsEl, entry, width, height, registry, cleanups, overrides) {
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

    variantsEl.append(card);
  }
}

function installEventLog(previewRoot, logEl) {
  const events = [];

  const renderLog = () => {
    logEl.innerHTML = '';
    if (events.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'storybook-event-empty';
      empty.textContent = 'No events yet. Interact with a variant above.';
      logEl.append(empty);
      return;
    }
    for (const ev of events) {
      const row = document.createElement('div');
      row.className = 'storybook-event-row';
      const time = new Date(ev.t).toTimeString().slice(0, 8);
      const meta = document.createElement('span');
      meta.className = 'storybook-event-meta';
      meta.textContent = `${time} · ${ev.name}`;
      const detail = document.createElement('span');
      detail.className = 'storybook-event-detail';
      detail.textContent = JSON.stringify(ev.detail);
      row.append(meta, detail);
      logEl.append(row);
    }
    logEl.scrollTop = logEl.scrollHeight;
  };

  const originalDispatch = EventTarget.prototype.dispatchEvent;
  EventTarget.prototype.dispatchEvent = function (event) {
    // Capture the dispatch sequence *before* handlers run so compound events
    // show cause-above-effect: a handler that dispatches a follow-up event
    // nests inside the outer dispatch, so logging at start (not at return)
    // keeps the outer event chronologically earlier than its consequences.
    if (
      event instanceof CustomEvent &&
      this instanceof Node &&
      previewRoot.contains(this)
    ) {
      try {
        events.push({ t: Date.now(), name: event.type, detail: event.detail });
        if (events.length > MAX_EVENT_LOG) events.splice(0, events.length - MAX_EVENT_LOG);
        renderLog();
      } catch {
        /* swallow */
      }
    }
    return originalDispatch.call(this, event);
  };

  renderLog();
  return {
    clear: () => {
      events.length = 0;
      renderLog();
    },
  };
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

function applyLayout(storybookEl, layout) {
  storybookEl.style.gridTemplateColumns = `${layout.nav}px 1fr ${layout.inspector}px`;
}

function installResize() {
  const storybookEl = document.querySelector('.storybook');
  if (!storybookEl) return;

  const layout = loadLayout();
  applyLayout(storybookEl, layout);

  for (const handle of document.querySelectorAll('[data-storybook-resize]')) {
    const key = handle.dataset.storybookResize;
    const constraints = LAYOUT_CONSTRAINTS[key];
    if (!constraints) continue;

    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      const startX = e.clientX;
      const startWidth = layout[key];

      const onMove = (moveEvent) => {
        const delta = key === 'nav'
          ? moveEvent.clientX - startX
          : startX - moveEvent.clientX;
        const next = Math.max(constraints.min, Math.min(constraints.max, startWidth + delta));
        layout[key] = next;
        applyLayout(storybookEl, layout);
      };

      const onUp = (upEvent) => {
        handle.releasePointerCapture(upEvent.pointerId);
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
        saveLayout(layout);
      };

      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
    });
  }
}

async function main() {
  const config = await loadConfig();

  const el = {
    count: document.querySelector('[data-storybook-count]'),
    list: document.querySelector('[data-storybook-list]'),
    poolFilter: document.querySelector('[data-storybook-pool-filter]'),
    name: document.querySelector('[data-storybook-component-name]'),
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
  };

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
  let poolFilter = loadPoolFilter();
  if (poolFilter !== POOL_FILTER_ALL && !poolNames.includes(poolFilter)) {
    poolFilter = POOL_FILTER_ALL;
  }

  const visibleRegistry = () =>
    poolFilter === POOL_FILTER_ALL
      ? registry
      : registry.filter((e) => e.pool === poolFilter);

  const updateFooter = () => {
    if (el.footerHash) {
      el.footerHash.textContent = `#${active.pool}/${active.mod.metadata.name}`;
    }
    if (el.footerSize) {
      const h = height > 0 ? `${height}px` : 'auto';
      el.footerSize.textContent = `Width ${width}px · Height ${h}`;
    }
  };

  const paint = () => {
    const visible = visibleRegistry();
    const showPoolHeaders = new Set(visible.map((e) => e.pool)).size > 1;
    renderComponentList(el.list, visible, active, select, showPoolHeaders);
    if (el.poolFilter) {
      renderPoolFilter(el.poolFilter, poolNames, poolFilter, (next) => {
        poolFilter = next;
        savePoolFilter(next);
        paint();
      });
    }
    el.name.textContent = active.mod.metadata.name;
    renderVariants(el.variants, active, width, height, registry, cleanups, overrides);
    renderPropsForm();
    updateFooter();
  };

  const repaintVariants = () => {
    renderVariants(el.variants, active, width, height, registry, cleanups, overrides);
  };

  const select = (entry) => {
    active = entry;
    window.location.hash = `${entry.pool}/${entry.mod.metadata.name}`;
    eventLog.clear();
    overrides = {};
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

  installResize();

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
