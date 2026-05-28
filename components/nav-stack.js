import { icon as buildIcon } from './system/icons.js';

export const metadata = {
  name: 'NavStack',
  description: 'Drill-down navigation: a stack of menu levels with branch (push) and back (pop) semantics; renders icon-only when its own displayState is "icon" or when nested inside a sidebar in icon state',
  category: 'navigation',
};

export const propTypes = {
  levels: { type: 'array', default: [] },
  initialPath: { type: 'array', default: [] },
  displayState: { type: 'enum', default: 'expanded', options: ['expanded', 'icon'] },
  backLabel: { type: 'string', default: 'Back' },
  backIcon: { type: 'string', default: 'chevron-left' },
};

const DEMO_LEVELS = [
  {
    id: 'root',
    title: 'Workspace',
    items: [
      { kind: 'item',           id: 'pools',    label: 'Pools',    icon: 'dots-horizontal', selected: true },
      { kind: 'item',           id: 'entities', label: 'Entities', icon: 'file-text' },
      { kind: 'branch',         id: 'settings', label: 'Settings', icon: 'gear', branchTo: 'settings' },
      { kind: 'section-header', id: 'wl',       label: 'Watchlist' },
      { kind: 'section-item',   id: 'w1', label: 'production-east',  icon: 'bell' },
      { kind: 'section-item',   id: 'w2', label: 'staging-replicas', icon: 'bell' },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    items: [
      { kind: 'item', id: 'profile',   label: 'Profile',   icon: 'file-text', selected: true },
      { kind: 'item', id: 'workspace', label: 'Workspace', icon: 'code' },
      { kind: 'item', id: 'tokens',    label: 'Tokens',    icon: 'link-1' },
    ],
  },
];

export const variants = [
  { name: 'root-expanded',     description: 'Root level, labels visible',
    props: { levels: DEMO_LEVELS, initialPath: ['root'] } },
  { name: 'settings-expanded', description: 'Nested level; back button auto-renders',
    props: { levels: DEMO_LEVELS, initialPath: ['root', 'settings'] } },
  { name: 'root-icon',         description: 'Root level, icon-only',
    props: { levels: DEMO_LEVELS, initialPath: ['root'], displayState: 'icon' } },
  { name: 'settings-icon',     description: 'Nested level, icon-only; back arrow replaces the workspace header',
    props: { levels: DEMO_LEVELS, initialPath: ['root', 'settings'], displayState: 'icon' } },
];

/**
 * @typedef {{ kind: string, id: string, label?: string, icon?: string, selected?: boolean, branchTo?: string }} NavItem
 * @typedef {{ id: string, title?: string, items: NavItem[] }} NavLevel
 * @typedef {{ path: string[], levels: NavLevel[], backLabel: string, backIcon: string }} NavState
 */

// Per-instance state lives in a WeakMap keyed by the returned root node.
// This keeps internal state out of the public DOM (no mangled __properties).
// The two navigation states the component owns (the drill `path` and each
// item's `selected` flag) are mutated in place by internal handlers (and,
// for selection, by the exported setSelected), never by an external rebuild.
// Levels carry the selected flag per item, so independent levels keep their
// own highlight; isolating that per-click change from the (fixed) structure
// is why a selection no longer tears down the tree (STRUCTURE_REFLECTS_CHANGE).
/** @type {WeakMap<HTMLElement, NavState>} */
const STATE = new WeakMap();

/**
 * @param {HTMLElement} root
 * @param {string} name
 * @param {Record<string, unknown>} detail
 * @returns {void}
 */
function emit(root, name, detail) {
  root.dispatchEvent(new CustomEvent(`nav-stack:${name}`, {
    bubbles: true,
    detail,
  }));
}

/**
 * @param {NavLevel[]} levels
 * @param {string} id
 * @returns {NavLevel | undefined}
 */
function findLevel(levels, id) {
  return levels.find((l) => l.id === id);
}

// Pure selection transform: return `levels` with `id` selected inside whichever
// level contains it, that level's other items cleared. A level without `id` is
// returned by reference, so a sibling level's selection survives (the system-
// root section marker is not wiped when a component is selected). If no level
// contains `id`, the input is returned unchanged. Keeping the selection rules
// here, separate from the DOM toggle in setSelected, makes them unit-testable
// without a DOM (FUNCTIONAL_TESTING) and pins the per-level isolation invariant.
/**
 * @param {NavLevel[]} levels
 * @param {string} id
 * @returns {NavLevel[]}
 */
export function selectInLevels(levels, id) {
  let changed = false;
  const next = levels.map((level) => {
    if (!(level.items ?? []).some((it) => it.id === id)) return level;
    changed = true;
    return {
      ...level,
      items: level.items.map((it) => ({ ...it, selected: it.id === id })),
    };
  });
  return changed ? next : levels;
}

// Move the selection in place. The per-item `selected` flag is the source of
// truth (see selectInLevels); CSS maps `.dk-nav-stack-item-selected` to the
// highlight. Updating it without a re-render lets the rendered list keep its
// scroll offset and focus across a selection change. The DOM is reconciled
// only when `id` is in the rendered level; in any other level the data update
// is enough: renderBody applies it on drill. An unknown `id` is a no-op: the
// data is unchanged and the early return leaves the current highlight intact.
/**
 * @param {HTMLElement} root
 * @param {string} id
 * @returns {void}
 */
export function setSelected(root, id) {
  const s = STATE.get(root);
  if (!s) return;
  s.levels = selectInLevels(s.levels, id);
  const target = root.querySelector(
    `.dk-nav-stack-item[data-item-id="${CSS.escape(id)}"]`,
  );
  if (!target) return;
  for (const prev of Array.from(root.querySelectorAll('.dk-nav-stack-item-selected'))) {
    prev.classList.remove('dk-nav-stack-item-selected');
  }
  target.classList.add('dk-nav-stack-item-selected');
}

/**
 * @param {HTMLElement} root
 * @param {NavLevel} level
 * @param {number} depth
 * @param {string} backLabel
 * @param {string} backIcon
 * @returns {HTMLDivElement}
 */
function renderHeader(root, level, depth, backLabel, backIcon) {
  const header = document.createElement('div');
  header.className = 'dk-nav-stack-header';

  if (depth > 1) {
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'dk-nav-stack-back';
    const iconEl = document.createElement('span');
    iconEl.className = 'dk-nav-stack-back-icon';
    iconEl.setAttribute('aria-hidden', 'true');
    const backSvg = buildIcon(backIcon);
    if (backSvg) iconEl.append(backSvg); else iconEl.textContent = backIcon;
    const labelEl = document.createElement('span');
    labelEl.className = 'dk-nav-stack-back-label';
    labelEl.textContent = backLabel;
    backBtn.append(iconEl, labelEl);
    backBtn.addEventListener('click', () => {
      const s = STATE.get(root);
      if (!s || s.path.length <= 1) return;
      s.path.pop();
      const newLevelId = s.path[s.path.length - 1];
      renderBody(root, 'pop');
      emit(root, 'back', { fromLevel: level.id, toLevel: newLevelId, path: [...s.path] });
    });
    header.append(backBtn);
  } else {
    const title = document.createElement('div');
    title.className = 'dk-nav-stack-title';
    title.textContent = level.title ?? '';
    header.append(title);
  }

  return header;
}

/**
 * @param {HTMLElement} root
 * @param {NavItem} item
 * @returns {HTMLElement}
 */
function renderItem(root, item) {
  if (item.kind === 'section-header') {
    const node = document.createElement('div');
    node.className = 'dk-nav-stack-section-header';
    node.dataset.kind = 'section-header';
    const labelEl = document.createElement('span');
    labelEl.className = 'dk-nav-stack-label';
    labelEl.textContent = item.label ?? '';
    node.append(labelEl);
    return node;
  }

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'dk-nav-stack-item';
  btn.dataset.kind = item.kind;
  btn.dataset.itemId = item.id;
  if (item.kind === 'section-item') btn.classList.add('dk-nav-stack-section-item');
  if (item.selected) btn.classList.add('dk-nav-stack-item-selected');

  const iconEl = document.createElement('span');
  iconEl.className = 'dk-nav-stack-icon';
  iconEl.setAttribute('aria-hidden', 'true');
  if (item.icon) {
    const svg = buildIcon(item.icon);
    if (svg) {
      iconEl.append(svg);
    } else {
      iconEl.textContent = item.icon;
    }
  } else {
    iconEl.textContent = (item.label ?? '').charAt(0).toUpperCase();
  }
  btn.append(iconEl);

  const labelEl = document.createElement('span');
  labelEl.className = 'dk-nav-stack-label';
  labelEl.textContent = item.label ?? '';
  btn.append(labelEl);

  if (item.kind === 'branch') {
    const chev = document.createElement('span');
    chev.className = 'dk-nav-stack-chevron';
    chev.setAttribute('aria-hidden', 'true');
    const chevSvg = buildIcon('chevron-right');
    if (chevSvg) chev.append(chevSvg); else chev.textContent = '›';
    btn.append(chev);
  }

  btn.addEventListener('click', () => {
    if (item.kind === 'branch' && item.branchTo) {
      const s = STATE.get(root);
      if (!s) return;
      s.path.push(item.branchTo);
      renderBody(root, 'push');
      emit(root, 'branch', { from: item.id, toLevel: item.branchTo, path: [...s.path] });
    } else {
      setSelected(root, item.id);
      emit(root, 'select', { id: item.id, label: item.label, kind: item.kind });
    }
  });

  return btn;
}

/**
 * Build a level wrapper for the given level: a single element containing the
 * header and the scrollable body. Levels are the unit of swap so an animated
 * drill can keep the outgoing and incoming levels alive simultaneously.
 * @param {HTMLElement} root
 * @param {NavLevel} level
 * @param {number} depth
 * @param {string} backLabel
 * @param {string} backIcon
 * @returns {HTMLDivElement}
 */
function buildLevel(root, level, depth, backLabel, backIcon) {
  const wrapper = document.createElement('div');
  wrapper.className = 'dk-nav-stack-level';
  wrapper.dataset.level = level.id;
  wrapper.append(renderHeader(root, level, depth, backLabel, backIcon));
  const body = document.createElement('div');
  body.className = 'dk-nav-stack-body';
  const list = document.createElement('div');
  list.className = 'dk-nav-stack-list';
  for (const item of level.items ?? []) {
    list.append(renderItem(root, item));
  }
  body.append(list);
  wrapper.append(body);
  return wrapper;
}

/**
 * @returns {boolean}
 */
function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Slide the outgoing level off and the incoming level in. Push enters from
 * the right (the user is going deeper); pop enters from the left (the user
 * is returning). Falls back to an instant swap when no transitions are
 * available (no old level on first render, no direction passed, or the user
 * prefers reduced motion).
 * @param {HTMLElement} root
 * @param {HTMLElement} oldLevel
 * @param {HTMLElement} newLevel
 * @param {'push' | 'pop'} direction
 * @returns {void}
 */
function animateLevelSwap(root, oldLevel, newLevel, direction) {
  const incomingFrom = direction === 'push' ? 'incoming-from-right' : 'incoming-from-left';
  const outgoingTo = direction === 'push' ? 'outgoing-to-left' : 'outgoing-to-right';
  root.dataset.animating = direction;
  oldLevel.dataset.animState = 'settled';
  newLevel.dataset.animState = incomingFrom;
  root.append(newLevel);
  // Force layout so the browser applies the starting transform before the
  // class swap, otherwise both transforms land in the same frame and the
  // transition collapses to an instant swap.
  void newLevel.offsetWidth;
  oldLevel.dataset.animState = outgoingTo;
  newLevel.dataset.animState = 'settled';

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    oldLevel.remove();
    delete newLevel.dataset.animState;
    delete root.dataset.animating;
  };
  newLevel.addEventListener('transitionend', finish, { once: true });
  // Fallback in case transitionend never fires (e.g. the new level is
  // detached before the frame, or a CSS override neutralises the transition).
  setTimeout(finish, 400);
}

/**
 * @param {HTMLElement} root
 * @param {'push' | 'pop'} [direction]
 * @returns {void}
 */
function renderBody(root, direction) {
  const s = STATE.get(root);
  if (!s) return;
  const currentLevelId = s.path[s.path.length - 1];
  const level = findLevel(s.levels, currentLevelId);
  if (!level) return;

  root.dataset.level = currentLevelId;
  root.dataset.depth = String(s.path.length);

  const oldLevel = /** @type {HTMLElement | null} */ (
    root.querySelector(':scope > .dk-nav-stack-level')
  );
  const newLevel = buildLevel(root, level, s.path.length, s.backLabel, s.backIcon);

  if (oldLevel && direction && !prefersReducedMotion()) {
    animateLevelSwap(root, oldLevel, newLevel, direction);
    return;
  }
  if (oldLevel) oldLevel.remove();
  root.append(newLevel);
}

/**
 * @param {{ levels?: NavLevel[], initialPath?: string[], displayState?: 'expanded' | 'icon', backLabel?: string, backIcon?: string }} [props]
 * @returns {HTMLElement}
 */
export function render(props = {}) {
  const levels = props.levels ?? /** @type {NavLevel[]} */ (propTypes.levels.default);
  const displayState = /** @type {'expanded' | 'icon'} */ (props.displayState ?? propTypes.displayState.default);
  const backLabel = props.backLabel ?? propTypes.backLabel.default;
  const backIcon = props.backIcon ?? propTypes.backIcon.default;

  let initialPath = props.initialPath ?? /** @type {string[]} */ (propTypes.initialPath.default);
  if (!initialPath.length && levels.length) initialPath = [levels[0].id];

  const root = document.createElement('nav');
  root.className = 'dk-nav-stack';
  root.dataset.state = displayState;

  STATE.set(root, {
    path: [...initialPath],
    levels,
    backLabel,
    backIcon,
  });

  renderBody(root);
  return root;
}
