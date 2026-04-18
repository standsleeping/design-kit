import { SPElement } from './sp-element.js';

export class SPIconButton extends SPElement {
  static metadata = {
    name: 'SPIconButton',
    description: 'Icon-only button with size variants',
    category: 'actions',
  };

  static propTypes = {
    size: { type: 'string', default: 'default' },
    label: { type: 'string', default: '' },
    disabled: { type: 'boolean', default: false },
  };

  static variants = ['sm', 'default', 'touch'];

  static componentStyles = new CSSStyleSheet();

  render() {
    const size = this.prop('size');
    const label = this.prop('label');
    const disabled = this.prop('disabled');

    this.shadowRoot.innerHTML = `
      <button
        class="icon-btn icon-btn-${size}"
        aria-label="${label}"
        ${disabled ? 'disabled' : ''}
      ><slot></slot></button>
    `;
  }
}

SPIconButton.componentStyles.replaceSync(`
  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    flex-shrink: 0;
    color: var(--color-text-muted);
    transition: color 0.15s ease, background-color 0.15s ease;
  }

  .icon-btn:hover {
    background: var(--color-hover-bg);
  }

  .icon-btn:active {
    background: var(--color-active-bg);
  }

  .icon-btn:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .icon-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .icon-btn-sm {
    width: 24px;
    height: 24px;
    font-size: var(--font-size-xs);
    border-radius: var(--radius-sm);
  }

  .icon-btn-sm:hover { color: var(--color-text); }

  .icon-btn-default {
    width: 32px;
    height: 32px;
    font-size: var(--font-size-sm);
    border-radius: var(--radius-md);
  }

  .icon-btn-default:hover { color: var(--color-text); }

  .icon-btn-touch {
    width: 40px;
    height: 40px;
    font-size: var(--font-size-base);
    border-radius: var(--radius-md);
  }

  .icon-btn-touch:hover { color: var(--color-text); }
`);

customElements.define('sp-icon-button', SPIconButton);
