import { SPElement } from './sp-element.js';

export class SPMenuItem extends SPElement {
  static metadata = {
    name: 'SPMenuItem',
    description: 'Selectable navigation row with optional icon',
    category: 'navigation',
  };

  static propTypes = {
    label: { type: 'string', default: 'Item' },
    icon: { type: 'string', default: '' },
    selected: { type: 'boolean', default: false },
    disabled: { type: 'boolean', default: false },
  };

  static variants = ['default', 'selected', 'disabled'];

  static componentStyles = new CSSStyleSheet();

  render() {
    const label = this.prop('label');
    const icon = this.prop('icon');
    const selected = this.prop('selected');
    const disabled = this.prop('disabled');

    this.shadowRoot.innerHTML = `
      <button
        type="button"
        class="menu-item ${selected ? 'menu-item-selected' : ''}"
        ${disabled ? 'disabled' : ''}
      >
        ${icon ? `<span class="menu-item-icon" aria-hidden="true">${icon}</span>` : ''}
        <span class="menu-item-label">${label}</span>
      </button>
    `;

    const button = this.shadowRoot.querySelector('.menu-item');
    button.addEventListener('click', () => {
      if (disabled) return;
      this.dispatchEvent(
        new CustomEvent('sp-select', {
          bubbles: true,
          detail: { label },
        })
      );
    });
  }
}

SPMenuItem.componentStyles.replaceSync(`
  .menu-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-text-muted);
    font-family: var(--typography-mono);
    font-size: var(--font-size-xs);
    text-align: left;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  }

  .menu-item:hover {
    background: var(--color-hover-bg);
    color: var(--color-text);
  }

  .menu-item:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .menu-item-selected {
    border-color: var(--color-link);
    color: var(--color-link);
    background: var(--color-focus-ring-light);
  }

  .menu-item:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .menu-item-icon {
    color: var(--color-text-muted);
    width: 1.25em;
    text-align: center;
    flex-shrink: 0;
  }

  .menu-item-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`);

customElements.define('sp-menu-item', SPMenuItem);
