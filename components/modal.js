import { icon as buildIcon } from './system/icons.js';

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
  {
    name: 'narrow-box',
    description: 'Long title + wide content-width prop in a narrow ancestor; max-width cap prevents horizontal overflow',
    props: {
      open: true,
      title: 'This is a very long modal title that would overflow a narrow container without the width cap',
      position: 'center',
      width: 600,
    },
    slots: {
      content: { component: 'MenuItem', props: { label: 'Content that wraps inside the capped width' } },
    },
  },
];

/**
 * @param {{ open?: boolean, title?: string, position?: 'center' | 'top-right' | 'bottom-right', width?: number }} [props]
 * @returns {{ node: HTMLDialogElement, cleanup: () => void }}
 */
export function render(props = {}) {
  const open = props.open ?? propTypes.open.default;
  const title = props.title ?? propTypes.title.default;
  const position = props.position ?? propTypes.position.default;
  const width = props.width ?? propTypes.width.default;
  const titleId = `dk-modal-title-${nextId++}`;

  // Native <dialog>: showModal() supplies the focus trap, background inert, and
  // a native 'cancel' event for Escape (no manual keydown listener). The element
  // already exposes role="dialog" implicitly, so only aria-labelledby is set.
  const root = /** @type {HTMLDialogElement} */ (document.createElement('dialog'));
  root.className = `dk-modal dk-modal-${position}`;
  root.setAttribute('aria-labelledby', titleId);
  root.style.inlineSize = `${width}px`;

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
  const closeSvg = buildIcon('cross-1');
  if (closeSvg) closeBtn.append(closeSvg); else closeBtn.textContent = '✕';

  header.append(titleEl, closeBtn);

  const content = document.createElement('div');
  content.className = 'dk-modal-content';
  content.dataset.slot = 'content';

  root.append(header, content);

  let hasBeenDragged = false;
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  // Open via showModal() (top layer + viewport centering). The storybook appends
  // the node AFTER render() returns, and showModal() throws on a disconnected
  // dialog, so defer the open to a microtask and guard on connectedness +
  // current open state. Fall back to the open attribute if showModal is absent.
  const show = () => {
    if (!root.isConnected || root.open) return;
    if (typeof root.showModal === 'function') {
      root.showModal();
    } else {
      root.setAttribute('open', '');
    }
    root.dispatchEvent(new CustomEvent('modal:open', { bubbles: true }));
  };

  const onPointerMove = (/** @type {PointerEvent} */ e) => {
    if (!dragging) return;
    root.style.insetInlineStart = `${e.clientX - offsetX}px`;
    root.style.insetBlockStart = `${e.clientY - offsetY}px`;
  };

  const onPointerUp = () => {
    dragging = false;
    root.classList.remove('dk-modal-dragging');
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
  };

  closeBtn.addEventListener('click', () => {
    root.close();
  });

  // Single teardown point. The native 'close' event fires for the close button
  // (via root.close()), for the native 'cancel' event (Escape), and for any
  // programmatic close. modal:close is dispatched here, once, with the same
  // drag-listener cleanup the old hand-rolled close() performed.
  root.addEventListener('close', () => {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    dragging = false;
    root.classList.remove('dk-modal-dragging');
    root.dispatchEvent(new CustomEvent('modal:close', { bubbles: true }));
  });

  header.addEventListener('pointerdown', (e) => {
    const target = /** @type {Element | null} */ (e.target);
    if (target && target.closest('.dk-modal-close')) return;
    const rect = root.getBoundingClientRect();
    dragging = true;
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    if (!hasBeenDragged) {
      root.style.insetBlockStart = `${rect.top}px`;
      root.style.insetInlineStart = `${rect.left}px`;
      root.style.insetInlineEnd = 'auto';
      root.style.insetBlockEnd = 'auto';
      root.style.transform = 'none';
      hasBeenDragged = true;
    }

    root.classList.add('dk-modal-dragging');
    e.preventDefault();

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  });

  if (open) {
    queueMicrotask(show);
  }

  const cleanup = () => {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
  };

  return { node: root, cleanup };
}
