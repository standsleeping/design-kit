let nextId = 0;

export const metadata = {
  name: 'Modal',
  description: 'Draggable floating dialog shell; hosts body in the [data-slot="content"] slot',
  category: 'overlays',
};

export const propTypes = {
  open: { type: 'boolean', default: false },
  title: { type: 'string', default: '' },
  position: { type: 'enum', default: 'center', options: ['center', 'top-right', 'bottom-right'] },
  width: { type: 'number', default: 400 },
};

export const variants = [
  {
    name: 'center',
    description: 'Centered dialog',
    props: { open: true, title: 'Centered Modal', position: 'center', width: 200 },
    slots: {
      content: { component: 'MenuItem', props: { label: 'Modal body' } },
    },
  },
  {
    name: 'top-right',
    description: 'Anchored to the top-right corner',
    props: { open: true, title: 'Top Right', position: 'top-right', width: 200 },
    slots: {
      content: { component: 'MenuItem', props: { label: 'Top-right body' } },
    },
  },
  {
    name: 'bottom-right',
    description: 'Anchored to the bottom-right corner',
    props: { open: true, title: 'Bottom Right', position: 'bottom-right', width: 200 },
    slots: {
      content: { component: 'MenuItem', props: { label: 'Bottom-right body' } },
    },
  },
  {
    name: 'closed',
    description: 'Initially closed',
    props: { open: false, title: 'Hidden', position: 'center', width: 200 },
    slots: {
      content: { component: 'MenuItem', props: { label: 'Not visible' } },
    },
  },
];

export function render(props = {}) {
  const open = props.open ?? propTypes.open.default;
  const title = props.title ?? propTypes.title.default;
  const position = props.position ?? propTypes.position.default;
  const width = props.width ?? propTypes.width.default;
  const titleId = `dk-modal-title-${nextId++}`;

  const root = document.createElement('div');
  root.className = `dk-modal dk-modal-${position}`;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-labelledby', titleId);
  root.style.width = `${width}px`;
  root.hidden = !open;

  const header = document.createElement('div');
  header.className = 'dk-modal-header';

  const titleEl = document.createElement('span');
  titleEl.className = 'dk-modal-title';
  titleEl.id = titleId;
  titleEl.textContent = title;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'dk-modal-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.textContent = '\u2715';

  header.append(titleEl, closeBtn);

  const content = document.createElement('div');
  content.className = 'dk-modal-content';
  content.dataset.slot = 'content';

  root.append(header, content);

  let hasBeenDragged = false;
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  const close = () => {
    if (root.hidden) return;
    root.hidden = true;
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    dragging = false;
    root.classList.remove('dk-modal-dragging');
    root.dispatchEvent(new CustomEvent('modal:close', { bubbles: true }));
  };

  const onKeydown = (e) => {
    if (e.key === 'Escape') close();
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    root.style.left = `${e.clientX - offsetX}px`;
    root.style.top = `${e.clientY - offsetY}px`;
  };

  const onPointerUp = () => {
    dragging = false;
    root.classList.remove('dk-modal-dragging');
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
  };

  closeBtn.addEventListener('click', close);

  header.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.dk-modal-close')) return;
    const rect = root.getBoundingClientRect();
    dragging = true;
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    if (!hasBeenDragged) {
      root.style.top = `${rect.top}px`;
      root.style.left = `${rect.left}px`;
      root.style.right = 'auto';
      root.style.bottom = 'auto';
      root.style.transform = 'none';
      hasBeenDragged = true;
    }

    root.classList.add('dk-modal-dragging');
    e.preventDefault();

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  });

  if (open) {
    document.addEventListener('keydown', onKeydown);
    root.dispatchEvent(new CustomEvent('modal:open', { bubbles: true }));
  }

  const cleanup = () => {
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
  };

  return { node: root, cleanup };
}
