export const metadata = {
  name: 'SessionStatsFooter',
  description: 'Live metrics strip tracking time on page, time off page, max scroll percent, tab switches, mouse moves, and clicks',
  category: 'display',
  examplePage: 'session-stats.html',
};

export const propTypes = {
  scrollTarget: { type: 'string', default: '' },
};

export const variants = [
  {
    name: 'default',
    description: 'Tracks the current window. Move the mouse, click, switch tabs, or scroll the page.',
    props: {},
  },
  {
    name: 'narrow-box',
    description: 'Demonstrates priority-based item dropping at constrained widths. Lower-priority items (moves, clicks, tabs) hide first; on/off/scroll always remain.',
    props: {},
  },
];

/**
 * FIELDS ordered from highest to lowest priority.
 * Priority 1 = most important (always shown last); priority 6 = dropped first.
 * DOM order matches priority order — installResponsiveStats uses this to
 * decide what to hide when the strip is too narrow for a single row.
 */
const FIELDS = [
  { key: 'on',     label: 'on',       priority: 1 },
  { key: 'off',    label: 'off',      priority: 2 },
  { key: 'scroll', label: 'scroll %', priority: 3 },
  { key: 'tabs',   label: 'tabs',     priority: 4 },
  { key: 'moves',  label: 'moves',    priority: 5 },
  { key: 'clicks', label: 'clicks',   priority: 6 },
];

/**
 * @param {number} ms
 * @returns {string}
 */
function formatDuration(ms) {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * @param {string} selector
 * @returns {Window | Element}
 */
function resolveScrollTarget(selector) {
  if (!selector) return window;
  try {
    return document.querySelector(selector) || window;
  } catch {
    return window;
  }
}

/**
 * @param {Window | Element} target
 * @returns {number}
 */
function readScrollPct(target) {
  let top, scrollH, clientH;
  if (target === window) {
    top = window.scrollY;
    scrollH = document.documentElement.scrollHeight;
    clientH = window.innerHeight;
  } else {
    const el = /** @type {Element} */ (target);
    top = el.scrollTop;
    scrollH = el.scrollHeight;
    clientH = el.clientHeight;
  }
  const range = scrollH - clientH;
  if (range <= 0) return 0;
  return Math.min(100, Math.max(0, (top / range) * 100));
}

/**
 * @param {{ scrollTarget?: string }} [props]
 * @returns {{ node: HTMLDivElement, cleanup: () => void }}
 */
export function render(props = {}) {
  const root = document.createElement('div');
  root.className = 'dk-ssf';
  root.setAttribute('role', 'status');
  root.setAttribute('aria-live', 'off');

  /** @type {Record<string, HTMLSpanElement>} */
  const valueEls = {};
  FIELDS.forEach((field, i) => {
    const item = document.createElement('span');
    item.className = 'dk-ssf-item';
    item.dataset.priority = String(field.priority);

    const value = document.createElement('span');
    value.className = 'dk-ssf-value';
    value.textContent = '0';
    valueEls[field.key] = value;

    const label = document.createElement('span');
    label.className = 'dk-ssf-label';
    label.textContent = field.label;

    item.append(value, label);
    root.append(item);

    if (i < FIELDS.length - 1) {
      const sep = document.createElement('span');
      sep.className = 'dk-ssf-separator';
      sep.setAttribute('aria-hidden', 'true');
      sep.textContent = '·';
      // Tracks the priority of the NEXT item so the enhancer can hide
      // the separator whenever that item is hidden (no orphaned separators).
      sep.dataset.forPriority = String(FIELDS[i + 1].priority);
      root.append(sep);
    }
  });

  const scrollTarget = resolveScrollTarget(props.scrollTarget ?? propTypes.scrollTarget.default);
  const computeAway = () => document.hidden || !document.hasFocus();
  let onMs = 0;
  let offMs = 0;
  let lastTransition = performance.now();
  let isAway = computeAway();
  let maxScrollPct = readScrollPct(scrollTarget);
  let tabSwitches = 0;
  let mouseMoves = 0;
  let clicks = 0;
  let frameQueued = false;

  const accumulate = () => {
    const now = performance.now();
    const delta = now - lastTransition;
    if (isAway) offMs += delta;
    else onMs += delta;
    lastTransition = now;
  };

  const paint = () => {
    frameQueued = false;
    accumulate();
    valueEls.on.textContent = formatDuration(onMs);
    valueEls.off.textContent = formatDuration(offMs);
    valueEls.scroll.textContent = Math.round(maxScrollPct).toString();
    valueEls.tabs.textContent = tabSwitches.toLocaleString();
    valueEls.moves.textContent = mouseMoves.toLocaleString();
    valueEls.clicks.textContent = clicks.toLocaleString();
  };

  const schedulePaint = () => {
    if (frameQueued) return;
    frameQueued = true;
    requestAnimationFrame(paint);
  };

  const onScroll = () => {
    const pct = readScrollPct(scrollTarget);
    if (pct > maxScrollPct) {
      maxScrollPct = pct;
      schedulePaint();
    }
  };

  const onAwayChange = (/** @type {boolean} */ countAsTabSwitch) => {
    const nextAway = computeAway();
    if (nextAway === isAway) return;
    accumulate();
    isAway = nextAway;
    if (isAway && countAsTabSwitch) tabSwitches += 1;
    schedulePaint();
  };

  const onVisibility = () => onAwayChange(true);
  const onFocus = () => onAwayChange(false);
  const onBlur = () => onAwayChange(false);

  const onMove = () => {
    mouseMoves += 1;
    schedulePaint();
  };

  const onClick = () => {
    clicks += 1;
    schedulePaint();
  };

  const tickInterval = setInterval(paint, 1000);
  scrollTarget.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('focus', onFocus);
  window.addEventListener('blur', onBlur);
  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('click', onClick, { passive: true });

  paint();

  // Self-wire the responsive enhancer so the strip drops items by priority
  // (single row) instead of wrapping into rows that the strip's own
  // `overflow: hidden` would clip. Consumers that want manual control can
  // still import installResponsiveStats directly.
  const stopResponsive = installResponsiveStats(root);

  const cleanup = () => {
    stopResponsive();
    clearInterval(tickInterval);
    scrollTarget.removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('focus', onFocus);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('click', onClick);
  };

  return { node: root, cleanup };
}

/**
 * Opt-in responsive enhancer for `.dk-ssf` strips hosted inside a fixed-height
 * chrome rail (AppShell footer, status bar) that has no give for wrapped rows.
 *
 * When active the enhancer:
 *   - Switches flex-wrap to nowrap on the root so the strip stays single-row.
 *   - Observes the root's own box width via ResizeObserver.
 *   - Hides items with the highest `data-priority` number first (lowest
 *     importance) until all visible items fit within the available width.
 *   - Hides any `.dk-ssf-separator` whose `data-for-priority` matches a hidden
 *     item, preventing orphaned separators.
 *   - Unhides items as width grows (lowest priority still hides last).
 *
 * Priority is read from `data-priority` on each `.dk-ssf-item`. DOM order
 * serves as the natural tiebreaker; items rendered by `render()` already carry
 * the correct attribute.
 *
 * Avoids feedback loops: visibility changes alter the box's scroll width, but
 * the observer fires on contentRect.width (the host's available width), which
 * only changes when the host element itself resizes — not when children are
 * hidden. The loop guard `Math.abs(w - lastWidth) > 1` is a secondary safety
 * net.
 *
 * @param {HTMLElement} root - A `.dk-ssf` element returned by `render()`.
 * @returns {() => void} Cleanup function that disconnects the observer and
 *   restores the original flex-wrap value.
 */
export function installResponsiveStats(root) {
  if (typeof ResizeObserver === 'undefined') return () => {};

  // Collect items sorted by descending priority number (highest number = drops first).
  const items = /** @type {HTMLElement[]} */ (
    Array.from(root.querySelectorAll('.dk-ssf-item'))
  ).sort((a, b) => {
    const pa = Number(a.dataset.priority ?? 0);
    const pb = Number(b.dataset.priority ?? 0);
    return pb - pa; // descending: highest priority-number first = drops first
  });

  const separators = /** @type {HTMLElement[]} */ (
    Array.from(root.querySelectorAll('.dk-ssf-separator'))
  );

  // Switch to single-row mode while the enhancer is active.
  const prevWrap = root.style.flexWrap;
  root.style.flexWrap = 'nowrap';

  let lastWidth = -1;

  /** @param {number} availableWidth */
  const apply = (availableWidth) => {
    // Reveal everything first, then iteratively hide from lowest priority up
    // until the items' natural single-row scrollWidth fits within available width.
    for (const item of items) {
      item.style.display = '';
    }
    for (const sep of separators) {
      sep.style.display = '';
    }

    // Identify which items to hide: work through items (already sorted
    // highest-priority-number-first) and hide until scrollWidth fits.
    const hiddenPriorities = new Set();
    for (const item of items) {
      if (root.scrollWidth <= availableWidth) break;
      item.style.display = 'none';
      hiddenPriorities.add(Number(item.dataset.priority ?? -1));
    }

    // Hide separators whose following item was hidden.
    for (const sep of separators) {
      const forPriority = Number(sep.dataset.forPriority ?? -1);
      if (hiddenPriorities.has(forPriority)) {
        sep.style.display = 'none';
      }
    }
  };

  const observer = new ResizeObserver((entries) => {
    const w = entries[0]?.contentRect?.width ?? 0;
    if (Math.abs(w - lastWidth) <= 1) return;
    lastWidth = w;
    apply(w);
  });

  // The observer delivers its first entry once the node is attached and sized;
  // that drives the initial drop. render() self-wires this before the node is
  // appended, so there is nothing to measure synchronously here. (Same pattern
  // as AdaptiveMetricsList; covered by pages/responsive-adaptive-tests.html.)
  observer.observe(root);

  return () => {
    observer.disconnect();
    // Restore original flex-wrap.
    root.style.flexWrap = prevWrap;
    // Restore all item/separator visibility.
    for (const item of items) item.style.display = '';
    for (const sep of separators) sep.style.display = '';
  };
}
