export const metadata = {
  name: 'Sidebar',
  description: 'Collapsible, resizable sidebar shell; hosts content in [data-slot="header"], [data-slot="main"], and [data-slot="footer"] slots',
  category: 'layout',
};

export const propTypes = {
  side: { type: 'enum', default: 'left', options: ['left', 'right'] },
  mode: { type: 'enum', default: 'inline', options: ['inline', 'overlay'] },
  displayState: { type: 'enum', default: 'expanded', options: ['expanded', 'icon', 'hidden'] },
  width: { type: 'number', default: 280 },
  minWidth: { type: 'number', default: 200 },
  maxWidth: { type: 'number', default: 500 },
  iconWidth: { type: 'number', default: 56 },
  resizable: { type: 'boolean', default: false },
  collapsible: { type: 'boolean', default: false },
};

// Demo nav fixture for the composed `with-nav-stack` variants below. Kept
// inline (not imported from nav-stack.js) so the Sidebar module's variants
// stay self-contained; the slot mechanism references NavStack by name, not
// by import. Icons mirror NavStack's own demo levels so the icon-rail
// composition renders real glyphs rather than initials.
const NAV_STACK_LEVELS = [
  {
    id: 'root',
    title: 'Application',
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
  {
    name: 'basic',
    description: 'Main content only',
    props: { width: 240 },
    slots: {
      main: [
        { component: 'MenuItem', props: { label: 'Dashboard' } },
        { component: 'MenuItem', props: { label: 'Projects' } },
        { component: 'MenuItem', props: { label: 'Settings' } },
      ],
    },
  },
  {
    name: 'with-header-footer',
    description: 'Full shell with header and footer slots',
    props: { width: 240 },
    slots: {
      header: { component: 'MenuItem', props: { label: 'Workspace' } },
      main: [
        { component: 'MenuItem', props: { label: 'Inbox' } },
        { component: 'MenuItem', props: { label: 'Drafts' } },
      ],
      footer: { component: 'MenuItem', props: { label: 'Account' } },
    },
  },
  {
    name: 'right-side',
    description: 'Anchored on the right edge',
    props: { side: 'right', width: 240 },
    slots: {
      main: [
        { component: 'MenuItem', props: { label: 'Outline' } },
        { component: 'MenuItem', props: { label: 'References' } },
      ],
    },
  },
  {
    name: 'resizable',
    description: 'Drag the right edge to resize',
    props: { width: 260, resizable: true },
    slots: {
      main: { component: 'MenuItem', props: { label: 'Drag my edge' } },
    },
  },
  {
    name: 'collapsible',
    description: 'Resizable; drag the right edge past the collapse threshold to snap to the icon rail, then drag back out to expand',
    props: { width: 240, minWidth: 180, maxWidth: 300, resizable: true, collapsible: true },
    slots: {
      main: [
        { component: 'MenuItem', props: { label: 'Inbox', icon: 'bell' } },
        { component: 'MenuItem', props: { label: 'Files', icon: 'file-text' } },
        { component: 'MenuItem', props: { label: 'Settings', icon: 'gear' } },
      ],
    },
  },
  {
    name: 'state-icon',
    description: 'Icon state (inline mode): sidebar shrinks to iconWidth so children render icon-only',
    props: { width: 240, displayState: 'icon' },
    slots: {
      main: [
        { component: 'MenuItem', props: { label: 'Inbox', icon: 'bell' } },
        { component: 'MenuItem', props: { label: 'Users', icon: 'gear' } },
      ],
    },
  },
  {
    name: 'overlay-expanded',
    description: 'Overlay mode, slid in over content; positioned absolute with transform-based animation',
    props: { width: 240, mode: 'overlay', displayState: 'expanded' },
    slots: {
      main: { component: 'MenuItem', props: { label: 'Sliding sidebar' } },
    },
  },
  {
    name: 'overlay-hidden',
    description: 'Overlay mode, slid off-screen via translateX(-100%); the toggle would slide it back in',
    props: { width: 240, mode: 'overlay', displayState: 'hidden' },
    slots: {
      main: { component: 'MenuItem', props: { label: 'Hidden until toggled' } },
    },
  },
  {
    name: 'with-nav-stack',
    description: 'Composition: hosts a NavStack in the main slot. Click "Settings" to drill into the nested level, the back arrow to pop; drag the right edge to resize.',
    props: { width: 260, resizable: true },
    slots: {
      main: {
        component: 'NavStack',
        props: { levels: NAV_STACK_LEVELS, initialPath: ['root'] },
      },
    },
  },
  {
    name: 'with-nav-stack-icon',
    description: 'Composition in the icon rail: the sidebar\'s icon state cascades into the nested NavStack via an ancestor selector, collapsing labels to icon-only.',
    props: { width: 260, displayState: 'icon' },
    slots: {
      main: {
        component: 'NavStack',
        props: { levels: NAV_STACK_LEVELS, initialPath: ['root'] },
      },
    },
  },
];

/**
 * @param {{ side?: 'left' | 'right', mode?: 'inline' | 'overlay', displayState?: 'expanded' | 'icon' | 'hidden', width?: number, minWidth?: number, maxWidth?: number, iconWidth?: number, resizable?: boolean, collapsible?: boolean }} [props]
 * @returns {HTMLDivElement}
 */
export function render(props = {}) {
  const side = props.side ?? propTypes.side.default;
  const mode = props.mode ?? propTypes.mode.default;
  const displayState = props.displayState ?? propTypes.displayState.default;
  const width = props.width ?? propTypes.width.default;
  const minWidth = props.minWidth ?? propTypes.minWidth.default;
  const maxWidth = props.maxWidth ?? propTypes.maxWidth.default;
  const iconWidth = props.iconWidth ?? propTypes.iconWidth.default;
  const resizable = props.resizable ?? propTypes.resizable.default;
  const collapsible = props.collapsible ?? propTypes.collapsible.default;

  const root = document.createElement('div');
  root.className = `dk-sidebar dk-sidebar-${side} dk-sidebar-mode-${mode}`;
  if (collapsible) root.classList.add('dk-sidebar-collapsible');
  root.dataset.state = displayState;
  root.style.setProperty('--dk-sidebar-width', `${width}px`);
  root.style.setProperty('--dk-sidebar-icon-width', `${iconWidth}px`);

  const header = document.createElement('div');
  header.className = 'dk-sidebar-header';
  header.dataset.slot = 'header';

  const main = document.createElement('div');
  main.className = 'dk-sidebar-main';
  main.dataset.slot = 'main';

  const footer = document.createElement('div');
  footer.className = 'dk-sidebar-footer';
  footer.dataset.slot = 'footer';

  root.append(header, main, footer);

  if (resizable) {
    const resizer = document.createElement('div');
    resizer.className = 'dk-sidebar-resizer';
    root.append(resizer);

    resizer.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = root.offsetWidth;
      resizer.setPointerCapture(e.pointerId);

      // Collapse hysteresis band [collapseAt, minWidth]: drag below the band to
      // snap to the icon rail, drag back above it to re-expand. The gap between
      // the two edges keeps the state from flickering when the cursor hovers
      // near the threshold. Non-collapsible sidebars just clamp to [min, max].
      const collapseAt = (iconWidth + minWidth) / 2;
      const onMove = (/** @type {PointerEvent} */ moveEvent) => {
        const delta = side === 'left'
          ? moveEvent.clientX - startX
          : startX - moveEvent.clientX;
        const desired = startWidth + delta;

        if (collapsible) {
          if (root.dataset.state !== 'icon' && desired < collapseAt) {
            root.dataset.state = 'icon';
            return;
          }
          if (root.dataset.state === 'icon') {
            if (desired <= minWidth) return; // still within the rail
            root.dataset.state = 'expanded';  // crossed back out to the band's top
          }
        }

        const newWidth = Math.max(minWidth, Math.min(maxWidth, desired));
        root.style.setProperty('--dk-sidebar-width', `${newWidth}px`);
      };

      const onUp = (/** @type {PointerEvent} */ upEvent) => {
        resizer.releasePointerCapture(upEvent.pointerId);
        resizer.removeEventListener('pointermove', onMove);
        resizer.removeEventListener('pointerup', onUp);
        root.dispatchEvent(new CustomEvent('sidebar:resize', {
          bubbles: true,
          detail: { width: root.offsetWidth, state: root.dataset.state },
        }));
      };

      resizer.addEventListener('pointermove', onMove);
      resizer.addEventListener('pointerup', onUp);
    });
  }

  return root;
}
