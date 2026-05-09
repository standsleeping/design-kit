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
];

const FIELDS = [
  { key: 'on', label: 'on' },
  { key: 'off', label: 'off' },
  { key: 'scroll', label: 'scroll %' },
  { key: 'tabs', label: 'tabs' },
  { key: 'moves', label: 'moves' },
  { key: 'clicks', label: 'clicks' },
];

function formatDuration(ms) {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function resolveScrollTarget(selector) {
  if (!selector) return window;
  try {
    return document.querySelector(selector) || window;
  } catch {
    return window;
  }
}

function readScrollPct(target) {
  let top, scrollH, clientH;
  if (target === window) {
    top = window.scrollY;
    scrollH = document.documentElement.scrollHeight;
    clientH = window.innerHeight;
  } else {
    top = target.scrollTop;
    scrollH = target.scrollHeight;
    clientH = target.clientHeight;
  }
  const range = scrollH - clientH;
  if (range <= 0) return 0;
  return Math.min(100, Math.max(0, (top / range) * 100));
}

export function render(props = {}) {
  const root = document.createElement('div');
  root.className = 'dk-ssf';
  root.setAttribute('role', 'status');
  root.setAttribute('aria-live', 'off');

  const valueEls = {};
  FIELDS.forEach((field, i) => {
    const item = document.createElement('span');
    item.className = 'dk-ssf-item';

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

  const onAwayChange = (countAsTabSwitch) => {
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

  const cleanup = () => {
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
