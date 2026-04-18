export const metadata = {
  name: 'Sidebar',
  description: 'Collapsible, resizable sidebar shell; hosts content in [data-slot="header"], [data-slot="main"], and [data-slot="footer"] slots',
  category: 'layout',
};

export const propTypes = {
  side: { type: 'enum', default: 'left', options: ['left', 'right'] },
  width: { type: 'number', default: 280 },
  minWidth: { type: 'number', default: 200 },
  maxWidth: { type: 'number', default: 500 },
  collapsed: { type: 'boolean', default: false },
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
];

export function render(props = {}) {
  const side = props.side ?? propTypes.side.default;
  const width = props.width ?? propTypes.width.default;
  const minWidth = props.minWidth ?? propTypes.minWidth.default;
  const maxWidth = props.maxWidth ?? propTypes.maxWidth.default;
  const collapsed = props.collapsed ?? propTypes.collapsed.default;
  const resizable = props.resizable ?? propTypes.resizable.default;

  const root = document.createElement('div');
  root.className = `dk-sidebar dk-sidebar-${side}`;
  if (collapsed) root.classList.add('dk-sidebar-collapsed');
  root.style.width = collapsed ? '0' : `${width}px`;

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
        root.style.width = `${newWidth}px`;
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
