import { icon as buildIcon } from './icons.js';

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

// Per-instance state lives in a WeakMap keyed by the returned root node.
// This keeps internal state out of the public DOM (no mangled __properties)
// while preserving the no-callbacks contract: state is mutated in place by
// internal handlers, the storybook re-renders by calling render() afresh.
const STATE = new WeakMap();

function emit(root, name, detail) {
  root.dispatchEvent(new CustomEvent(`nav-stack:${name}`, {
    bubbles: true,
    detail,
  }));
}

function findLevel(levels, id) {
  return levels.find((l) => l.id === id);
}

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
      renderBody(root);
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
      renderBody(root);
      emit(root, 'branch', { from: item.id, toLevel: item.branchTo, path: [...s.path] });
    } else {
      emit(root, 'select', { id: item.id, label: item.label, kind: item.kind });
    }
  });

  return btn;
}

function renderBody(root) {
  const s = STATE.get(root);
  if (!s) return;
  const currentLevelId = s.path[s.path.length - 1];
  const level = findLevel(s.levels, currentLevelId);
  if (!level) return;

  root.dataset.level = currentLevelId;
  root.dataset.depth = String(s.path.length);

  const oldHeader = root.querySelector(':scope > .dk-nav-stack-header');
  const oldBody = root.querySelector(':scope > .dk-nav-stack-body');
  if (oldHeader) oldHeader.remove();
  if (oldBody) oldBody.remove();

  root.append(renderHeader(root, level, s.path.length, s.backLabel, s.backIcon));

  const body = document.createElement('div');
  body.className = 'dk-nav-stack-body';
  const list = document.createElement('div');
  list.className = 'dk-nav-stack-list';
  for (const item of level.items ?? []) {
    list.append(renderItem(root, item));
  }
  body.append(list);
  root.append(body);
}

export function render(props = {}) {
  const levels = props.levels ?? propTypes.levels.default;
  const displayState = props.displayState ?? propTypes.displayState.default;
  const backLabel = props.backLabel ?? propTypes.backLabel.default;
  const backIcon = props.backIcon ?? propTypes.backIcon.default;

  let initialPath = props.initialPath ?? propTypes.initialPath.default;
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
