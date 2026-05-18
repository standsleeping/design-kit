export const metadata = {
  name: 'Sidebar',
  description: 'Collapsible, resizable sidebar shell; hosts content in [data-slot="header"], [data-slot="main"], and [data-slot="footer"] slots',
  category: 'layout',
  examplePage: 'sidebar-nav-stack.html',
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
};

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
    name: 'state-icon',
    description: 'Icon state (inline mode) — sidebar shrinks to iconWidth so children render icon-only',
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
];

export function render(props = {}) {
  const side = props.side ?? propTypes.side.default;
  const mode = props.mode ?? propTypes.mode.default;
  const displayState = props.displayState ?? propTypes.displayState.default;
  const width = props.width ?? propTypes.width.default;
  const minWidth = props.minWidth ?? propTypes.minWidth.default;
  const maxWidth = props.maxWidth ?? propTypes.maxWidth.default;
  const iconWidth = props.iconWidth ?? propTypes.iconWidth.default;
  const resizable = props.resizable ?? propTypes.resizable.default;

  const root = document.createElement('div');
  root.className = `dk-sidebar dk-sidebar-${side} dk-sidebar-mode-${mode}`;
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

      const onMove = (moveEvent) => {
        const delta = side === 'left'
          ? moveEvent.clientX - startX
          : startX - moveEvent.clientX;
        const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + delta));
        root.style.setProperty('--dk-sidebar-width', `${newWidth}px`);
      };

      const onUp = (upEvent) => {
        resizer.releasePointerCapture(upEvent.pointerId);
        resizer.removeEventListener('pointermove', onMove);
        resizer.removeEventListener('pointerup', onUp);
        root.dispatchEvent(new CustomEvent('sidebar:resize', {
          bubbles: true,
          detail: { width: root.offsetWidth },
        }));
      };

      resizer.addEventListener('pointermove', onMove);
      resizer.addEventListener('pointerup', onUp);
    });
  }

  return root;
}
