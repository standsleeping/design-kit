import { SPElement } from './sp-element.js';

let nextId = 0;

export class SPModal extends SPElement {
  static metadata = {
    name: 'SPModal',
    description: 'Draggable floating dialog panel',
    category: 'overlays',
  };

  static propTypes = {
    open: { type: 'boolean', default: false },
    title: { type: 'string', default: '' },
    position: { type: 'string', default: 'center' },
    width: { type: 'number', default: 400 },
  };

  static variants = ['center', 'top-right', 'bottom-right'];
  static componentStyles = new CSSStyleSheet();

  constructor() {
    super();
    this._dragState = { dragging: false, offsetX: 0, offsetY: 0 };
    this._handleKeydown = this._handleKeydown.bind(this);
    this._handlePointerMove = this._handlePointerMove.bind(this);
    this._handlePointerUp = this._handlePointerUp.bind(this);
    this._previousFocus = null;
    this._hasBeenDragged = false;
    this._dialog = null;
    this._titleId = `sp-modal-title-${nextId++}`;
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'open') {
      if (newVal !== null && newVal !== 'false') {
        this._show();
      } else {
        this._hide();
      }
    } else if (name === 'title') {
      const titleEl = this._dialog?.querySelector('.modal-title');
      if (titleEl) titleEl.textContent = this.prop('title');
    } else {
      this._applyPosition();
    }
  }

  connectedCallback() {
    this.render();
    if (this.prop('open')) {
      this._show();
    }
  }

  disconnectedCallback() {
    this._removeDocumentListeners();
  }

  render() {
    const title = this.prop('title');

    this.shadowRoot.innerHTML = `
      <div class="modal" role="dialog" aria-labelledby="${this._titleId}" ${this.prop('open') ? '' : 'hidden'}>
        <div class="modal-header">
          <span class="modal-title" id="${this._titleId}">${title}</span>
          <button class="modal-close" aria-label="Close">\u2715</button>
        </div>
        <div class="modal-content">
          <slot></slot>
        </div>
      </div>
    `;

    this._dialog = this.shadowRoot.querySelector('.modal');
    this._applyPosition();
    this._setupListeners();
  }

  _applyPosition() {
    const dialog = this._dialog;
    if (!dialog || this._hasBeenDragged) return;

    const width = this.prop('width');
    dialog.style.width = `${width}px`;

    const position = this.prop('position');
    switch (position) {
      case 'top-right':
        dialog.style.top = 'var(--spacing-2xl)';
        dialog.style.right = 'var(--spacing-2xl)';
        dialog.style.left = 'auto';
        break;
      case 'bottom-right':
        dialog.style.bottom = 'var(--spacing-2xl)';
        dialog.style.right = 'var(--spacing-2xl)';
        dialog.style.left = 'auto';
        dialog.style.top = 'auto';
        break;
      default:
        dialog.style.top = '50%';
        dialog.style.left = '50%';
        dialog.style.transform = 'translate(-50%, -50%)';
        break;
    }
  }

  _setupListeners() {
    const closeBtn = this._dialog?.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    const header = this._dialog?.querySelector('.modal-header');
    if (header) {
      header.addEventListener('pointerdown', (e) => this._startDrag(e));
    }
  }

  _show() {
    this._previousFocus = document.activeElement;
    document.addEventListener('keydown', this._handleKeydown);

    if (this._dialog) {
      this._dialog.removeAttribute('hidden');
    }

    requestAnimationFrame(() => {
      const closeBtn = this._dialog?.querySelector('.modal-close');
      if (closeBtn) closeBtn.focus();
    });

    this.dispatchEvent(
      new CustomEvent('sp-modal-open', { bubbles: true })
    );
  }

  _hide() {
    this._removeDocumentListeners();

    if (this._dialog) {
      this._dialog.setAttribute('hidden', '');
      this._dialog.classList.remove('dragging');
    }
    this._dragState.dragging = false;

    if (this._previousFocus && this._previousFocus.focus) {
      this._previousFocus.focus();
      this._previousFocus = null;
    }

    this.dispatchEvent(
      new CustomEvent('sp-modal-close', { bubbles: true })
    );
  }

  _removeDocumentListeners() {
    document.removeEventListener('keydown', this._handleKeydown);
    document.removeEventListener('pointermove', this._handlePointerMove);
    document.removeEventListener('pointerup', this._handlePointerUp);
  }

  _handleKeydown(e) {
    if (e.key === 'Escape') {
      this.close();
    }
  }

  _startDrag(e) {
    if (e.target.closest('.modal-close')) return;
    if (!this._dialog) return;

    const rect = this._dialog.getBoundingClientRect();
    this._dragState = {
      dragging: true,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };

    if (!this._hasBeenDragged) {
      this._dialog.style.top = `${rect.top}px`;
      this._dialog.style.left = `${rect.left}px`;
      this._dialog.style.right = 'auto';
      this._dialog.style.bottom = 'auto';
      this._dialog.style.transform = 'none';
      this._hasBeenDragged = true;
    }

    this._dialog.classList.add('dragging');
    e.preventDefault();

    document.addEventListener('pointermove', this._handlePointerMove);
    document.addEventListener('pointerup', this._handlePointerUp);
  }

  _handlePointerMove(e) {
    if (!this._dragState.dragging || !this._dialog) return;
    this._dialog.style.left = `${e.clientX - this._dragState.offsetX}px`;
    this._dialog.style.top = `${e.clientY - this._dragState.offsetY}px`;
  }

  _handlePointerUp() {
    this._dragState.dragging = false;
    if (this._dialog) this._dialog.classList.remove('dragging');
    document.removeEventListener('pointermove', this._handlePointerMove);
    document.removeEventListener('pointerup', this._handlePointerUp);
  }

  open() {
    this.setAttribute('open', '');
  }

  close() {
    this.removeAttribute('open');
  }

  toggle() {
    if (this.prop('open')) {
      this.close();
    } else {
      this.open();
    }
  }
}

SPModal.componentStyles.replaceSync(`
  :host {
    display: contents;
  }

  .modal {
    position: fixed;
    z-index: var(--z-overlay);
    max-height: 80vh;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal[hidden] {
    display: none;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
    padding: var(--spacing-md) var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
    cursor: grab;
    user-select: none;
    flex-shrink: 0;
  }

  .modal-header:active {
    cursor: grabbing;
  }

  .modal.dragging .modal-header {
    cursor: grabbing;
  }

  .modal-title {
    font-family: var(--typography-mono);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .modal-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    background: none;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    flex-shrink: 0;
    transition: color var(--motion-duration-fast) var(--motion-easing-default),
                background-color var(--motion-duration-fast) var(--motion-easing-default);
  }

  .modal-close:hover {
    color: var(--color-text);
    background: var(--color-hover-bg);
  }

  .modal-close:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: -2px;
  }

  .modal-content {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: none;
    padding: var(--spacing-lg);
  }
`);

customElements.define('sp-modal', SPModal);
