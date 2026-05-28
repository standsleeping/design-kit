// Design-kit runtime. The framework's reusable surface for any host that wants
// to render contract-conforming component modules: scan a pool, resolve sibling
// CSS, render entries (with slot resolution), wire luminance + color theme
// toggles, capture CustomEvents from a preview tree.
//
// The storybook chrome (variant cards, prop editor, sidebar layout persistence)
// sits on top of this module and imports its functions. Other consumers can
// pull the same primitives without inheriting the storybook UI.

export const CONTRACT_EXPORTS = ['metadata', 'propTypes', 'variants', 'render'];
export const ALLOWED_PROP_TYPES = [
  'string',
  'number',
  'boolean',
  'enum',
  'array',
  'object',
];
export const MAX_EVENT_LOG = 50;

const LUMINANCE_STORAGE_KEY = 'dk-luminance';
const COLOR_THEME_STORAGE_KEY = 'dk-color-theme';
const COLOR_THEMES = ['mono-purple', 'monochrome', 'solarized'];
const DEFAULT_COLOR_THEME = 'mono-purple';

/**
 * @param {string} href
 * @param {string} marker
 * @returns {void}
 */
export function ensureStylesheet(href, marker) {
  if (document.querySelector(`link[${marker}]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.setAttribute(marker, 'true');
  document.head.append(link);
}

/**
 * @param {HTMLElement | null} mountEl
 * @returns {Promise<void>}
 */
export async function mountLuminanceToggle(mountEl) {
  if (!mountEl) return;
  /** @type {string | null} */
  let stored = null;
  try { stored = localStorage.getItem(LUMINANCE_STORAGE_KEY); } catch { /* ignore */ }
  const initial = stored === 'light' || stored === 'dark' ? stored : 'auto';
  if (initial === 'auto') {
    document.documentElement.removeAttribute('data-luminance');
  } else {
    document.documentElement.setAttribute('data-luminance', initial);
  }
  ensureStylesheet('components/luminance-toggle.css', 'data-dk-luminance-css');
  try {
    const mod = await import('../luminance-toggle.js');
    mountEl.innerHTML = '';
    // Layout-transparent mount: the placeholder element itself contributes
    // no box, so the mounted component is the effective flex/inline child
    // of its surrounding context. Without this, the placeholder inherits
    // the surrounding line-height (often a body-relaxed 1.6×font-size) and
    // sits in the layout as a much taller box than the mounted component
    // intends, breaking peer alignment on chrome rails. See
    // VERTICAL_METRIC_DRIFT in system-principles.
    mountEl.style.display = 'contents';
    mountEl.append(mod.render({ value: initial }));
  } catch (err) {
    console.warn('[dk-runtime] luminance toggle mount failed:', err);
  }
}

/**
 * @param {HTMLElement | null} mountEl
 * @returns {Promise<void>}
 */
export async function mountColorThemeToggle(mountEl) {
  if (!mountEl) return;
  /** @type {string | null} */
  let stored = null;
  try { stored = localStorage.getItem(COLOR_THEME_STORAGE_KEY); } catch { /* ignore */ }
  const initial = COLOR_THEMES.includes(stored ?? '') ? (stored ?? DEFAULT_COLOR_THEME) : DEFAULT_COLOR_THEME;
  if (initial === DEFAULT_COLOR_THEME) {
    document.documentElement.removeAttribute('data-color-theme');
  } else {
    document.documentElement.setAttribute('data-color-theme', initial);
  }
  ensureStylesheet('components/color-theme-toggle.css', 'data-dk-color-theme-css');
  try {
    const mod = await import('../color-theme-toggle.js');
    mountEl.innerHTML = '';
    // See note on mountLuminanceToggle: display:contents on the placeholder
    // keeps the mounted component the effective layout child of its
    // surrounding context, preserving peer alignment on chrome rails.
    mountEl.style.display = 'contents';
    mountEl.append(
      mod.render({
        value: /** @type {'mono-purple' | 'monochrome' | 'solarized'} */ (initial),
      }),
    );
  } catch (err) {
    console.warn('[dk-runtime] color theme toggle mount failed:', err);
  }
}

/**
 * @param {Record<string, unknown>} mod
 * @returns {boolean}
 */
export function conforms(mod) {
  return CONTRACT_EXPORTS.every((key) => key in mod);
}

/**
 * @typedef {{ type: string, options?: unknown[] }} PropDescriptor
 */

/**
 * @param {string} url
 * @param {Record<string, unknown>} propTypes
 * @returns {void}
 */
export function validatePropTypes(url, propTypes) {
  if (!propTypes || typeof propTypes !== 'object') {
    console.warn(`[dk-runtime] ${url}: propTypes must be an object`);
    return;
  }
  for (const [key, descriptor] of Object.entries(propTypes)) {
    if (!descriptor || typeof descriptor !== 'object') {
      console.warn(`[dk-runtime] ${url}: propTypes.${key} is not a descriptor object`);
      continue;
    }
    const desc = /** @type {PropDescriptor} */ (descriptor);
    if (!ALLOWED_PROP_TYPES.includes(desc.type)) {
      console.warn(
        `[dk-runtime] ${url}: propTypes.${key}.type = '${desc.type}' is not allowed ` +
        `(allowed: ${ALLOWED_PROP_TYPES.join(', ')})`,
      );
    }
    if (desc.type === 'enum' && !Array.isArray(desc.options)) {
      console.warn(`[dk-runtime] ${url}: propTypes.${key} has type 'enum' but no options array`);
    }
  }
}

/**
 * @param {string} moduleUrl
 * @returns {Promise<void>}
 */
export async function ensureSiblingStyle(moduleUrl) {
  const cssUrl = moduleUrl.replace(/\.js$/, '.css');
  const selector = `link[data-dk-sibling="${cssUrl}"]`;
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
  link.dataset.dkSibling = cssUrl;
  document.head.append(link);
}

/**
 * @typedef {{ name: string, path: string, stylesheet?: string, components?: string[] }} ComponentPool
 */

/**
 * @param {ComponentPool} pool
 * @returns {Promise<void>}
 */
export async function loadPoolStylesheet(pool) {
  if (!pool.stylesheet) return;
  if (document.querySelector(`link[data-dk-pool="${pool.name}"]`)) return;
  const resolved = new URL(pool.stylesheet, document.baseURI).href;
  const existing = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  if (existing.some((l) => /** @type {HTMLLinkElement} */ (l).href === resolved)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = pool.stylesheet;
  link.dataset.dkPool = pool.name;
  document.head.append(link);
}

/**
 * @param {ComponentPool} pool
 * @returns {Promise<string[]>}
 */
export async function resolveComponents(pool) {
  if (Array.isArray(pool.components)) return pool.components;
  const manifestUrl = new URL(`${pool.path}/manifest.json`, document.baseURI).href;
  try {
    const res = await fetch(manifestUrl, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = /** @type {unknown} */ (await res.json());
    if (Array.isArray(data)) return /** @type {string[]} */ (data);
    if (typeof data === 'object' && data !== null && Array.isArray(/** @type {Record<string, unknown>} */ (data)['components'])) {
      return /** @type {string[]} */ (/** @type {Record<string, unknown>} */ (data)['components']);
    }
    console.warn(`[dk-runtime] ${manifestUrl} has unexpected shape; expected array or { components: [] }`);
    return [];
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[dk-runtime] ${pool.name}: no components array and manifest fetch failed: ${msg}`);
    return [];
  }
}

/**
 * @typedef {{ pool: string, url: string, mod: Record<string, unknown> }} RegistryEntry
 */

/**
 * @param {ComponentPool} pool
 * @returns {Promise<RegistryEntry[]>}
 */
export async function scanPool(pool) {
  await loadPoolStylesheet(pool);
  /** @type {RegistryEntry[]} */
  const registry = [];
  const components = await resolveComponents(pool);
  for (const filename of components) {
    const url = new URL(`${pool.path}/${filename}`, document.baseURI).href;
    /** @type {Record<string, unknown>} */
    let mod;
    try {
      mod = await import(url);
    } catch (err) {
      console.warn(`[dk-runtime] failed to import ${url}:`, err);
      continue;
    }
    if (!conforms(mod)) {
      console.warn(
        `[dk-runtime] ${url} does not conform to contract (expected: ${CONTRACT_EXPORTS.join(', ')})`,
      );
      continue;
    }
    validatePropTypes(url, /** @type {Record<string, unknown>} */ (mod['propTypes']));
    await ensureSiblingStyle(url);
    registry.push({ pool: pool.name, url, mod });
  }
  return registry;
}

/**
 * @typedef {{ component: string, props?: Record<string, unknown>, slots?: Record<string, SlotSpec | SlotSpec[]> }} SlotSpec
 */

/**
 * @param {Record<string, unknown>} mod
 * @param {Record<string, unknown>} props
 * @param {Array<() => void>} cleanups
 * @returns {HTMLElement}
 */
export function renderEntry(mod, props, cleanups) {
  const renderFn = /** @type {(p: Record<string, unknown>) => HTMLElement | { node: HTMLElement, cleanup: () => void }} */ (mod['render']);
  const rendered = renderFn(props ?? {});
  if (rendered instanceof HTMLElement) return rendered;
  const withCleanup = /** @type {{ node: HTMLElement, cleanup: () => void }} */ (rendered);
  if (typeof withCleanup.cleanup === 'function') cleanups.push(withCleanup.cleanup);
  return withCleanup.node;
}

/**
 * @param {SlotSpec} spec
 * @param {RegistryEntry[]} registry
 * @param {Array<() => void>} cleanups
 * @returns {HTMLElement}
 */
export function renderSpec(spec, registry, cleanups) {
  const entry = registry.find((e) => {
    const meta = /** @type {{ name?: string }} */ (e.mod['metadata']);
    return meta?.name === spec.component;
  });
  if (!entry) {
    console.warn(`[dk-runtime] slot component not found: ${spec.component}`);
    const fallback = document.createElement('span');
    fallback.textContent = `[missing: ${spec.component}]`;
    return fallback;
  }
  const node = renderEntry(entry.mod, spec.props ?? {}, cleanups);
  if (spec.slots) resolveSlots(node, spec.slots, registry, cleanups);
  return node;
}

/**
 * @param {HTMLElement} root
 * @param {Record<string, SlotSpec | SlotSpec[]>} slots
 * @param {RegistryEntry[]} registry
 * @param {Array<() => void>} cleanups
 * @returns {void}
 */
export function resolveSlots(root, slots, registry, cleanups) {
  for (const [key, value] of Object.entries(slots)) {
    const target = root.matches?.(`[data-slot="${key}"]`)
      ? root
      : root.querySelector(`[data-slot="${key}"]`);
    if (!target) {
      console.warn(`[dk-runtime] no [data-slot="${key}"] element in shell`);
      continue;
    }
    const specs = Array.isArray(value) ? value : [value];
    for (const spec of specs) {
      target.append(renderSpec(spec, registry, cleanups));
    }
  }
}

/**
 * @param {Array<() => void>} cleanups
 * @returns {void}
 */
export function runCleanups(cleanups) {
  for (const fn of cleanups) {
    try { fn(); } catch (err) { console.warn('[dk-runtime] cleanup failed:', err); }
  }
  cleanups.length = 0;
}

/**
 * @typedef {{ t: number, name: string, detail: unknown }} EventLogEntry
 */

// Capture CustomEvents that bubble out of `previewRoot` and feed them into
// `logEl`. Monkey-patches `EventTarget.prototype.dispatchEvent` so the log
// entry is recorded *before* handlers run. Handlers that dispatch follow-ups
// then nest chronologically after the outer event.
/**
 * @param {Node} previewRoot
 * @param {HTMLElement} logEl
 * @returns {{ clear: () => void }}
 */
export function installEventLog(previewRoot, logEl) {
  /** @type {EventLogEntry[]} */
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
  EventTarget.prototype.dispatchEvent = function (/** @type {Event} */ event) {
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
