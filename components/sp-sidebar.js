import { SPElement } from './sp-element.js';

export class SPSidebar extends SPElement {
  static metadata = {
    name: 'SPSidebar',
    description: 'Collapsible, resizable sidebar panel',
    category: 'layout',
  };

  static propTypes = {
    side: { type: 'string', default: 'left' },
    width: { type: 'number', default: 280 },
    'min-width': { type: 'number', default: 200 },
    'max-width': { type: 'number', default: 500 },
    collapsed: { type: 'boolean', default: false },
    resizable: { type: 'boolean', default: false },
  };

  static variants = [];
  static componentStyles = new CSSStyleSheet();

  // CSS handles collapsed/expanded — no need to re-render the DOM
  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'collapsed') {
      if (newVal === null || newVal === 'false') {
        this.style.width = `${this.prop('width')}px`;
      }
    } else if (name === 'width' && !this.prop('collapsed')) {
      this.style.width = `${newVal}px`;
    }
  }

  connectedCallback() {
    this.render();
    if (!this.prop('collapsed')) {
      this.style.width = `${this.prop('width')}px`;
    }
    if (this.prop('resizable')) {
      this._setupResize();
    }
  }

  render() {
    const resizable = this.prop('resizable');
    const resizerHtml = resizable ? '<div class="resizer"></div>' : '';

    this.shadowRoot.innerHTML = `
      <div class="sidebar">
        <div class="sidebar-header"><slot name="header"></slot></div>
        <div class="sidebar-main"><slot></slot></div>
        <div class="sidebar-footer"><slot name="footer"></slot></div>
        ${resizerHtml}
      </div>
    `;
  }

  _setupResize() {
    const resizer = this.shadowRoot.querySelector('.resizer');
    if (!resizer) return;

    resizer.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = this.offsetWidth;
      const side = this.prop('side');
      const minW = this.prop('min-width');
      const maxW = this.prop('max-width');

      resizer.setPointerCapture(e.pointerId);

      const onMove = (moveEvent) => {
        const delta =
          side === 'left'
            ? moveEvent.clientX - startX
            : startX - moveEvent.clientX;
        const newWidth = Math.max(minW, Math.min(maxW, startWidth + delta));
        this.style.width = `${newWidth}px`;
      };

      const onUp = (upEvent) => {
        resizer.releasePointerCapture(upEvent.pointerId);
        resizer.removeEventListener('pointermove', onMove);
        resizer.removeEventListener('pointerup', onUp);
        this.dispatchEvent(
          new CustomEvent('sp-resize', {
            bubbles: true,
            detail: { width: this.offsetWidth },
          })
        );
      };

      resizer.addEventListener('pointermove', onMove);
      resizer.addEventListener('pointerup', onUp);
    });
  }

  toggle() {
    const wasCollapsed = this.prop('collapsed');
    if (wasCollapsed) {
      this.removeAttribute('collapsed');
    } else {
      this.setAttribute('collapsed', '');
    }
    this.dispatchEvent(
      new CustomEvent('sp-collapse', {
        bubbles: true,
        detail: { collapsed: !wasCollapsed },
      })
    );
  }
}

SPSidebar.componentStyles.replaceSync(`
  :host {
    display: flex;
    flex-shrink: 0;
    overflow: hidden;
    transition: width 0.2s ease-out;
  }

  :host([collapsed]) {
    width: 0 !important;
    transition: width 0.15s ease-in;
  }

  .sidebar {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-width: 0;
    border-right: 1px solid var(--color-border);
  }

  :host([side="right"]) .sidebar {
    border-right: none;
    border-left: 1px solid var(--color-border);
  }

  .sidebar-header { flex-shrink: 0; }

  .sidebar-main {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }

  .sidebar-footer { flex-shrink: 0; }

  .resizer {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 8px;
    cursor: ew-resize;
    z-index: 2;
  }

  :host(:not([side="right"])) .resizer { right: -4px; }
  :host([side="right"]) .resizer { left: -4px; }

  .resizer:hover {
    background: var(--color-focus-ring-light);
  }
`);

customElements.define('sp-sidebar', SPSidebar);
