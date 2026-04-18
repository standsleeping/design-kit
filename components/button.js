import { SPElement } from './sp-element.js';

export class SPButton extends SPElement {
  static metadata = {
    name: 'SPButton',
    description: 'Button with variant styling',
    category: 'actions',
  };

  static propTypes = {
    variant: { type: 'string', default: 'default' },
    disabled: { type: 'boolean', default: false },
    type: { type: 'string', default: 'button' },
  };

  static variants = ['default', 'primary'];

  static componentStyles = new CSSStyleSheet();

  render() {
    const variant = this.prop('variant');
    const disabled = this.prop('disabled');
    const type = this.prop('type');

    this.shadowRoot.innerHTML = `
      <button
        class="btn ${variant === 'primary' ? 'btn-primary' : ''}"
        type="${type}"
        ${disabled ? 'disabled' : ''}
      ><slot></slot></button>
    `;
  }
}

SPButton.componentStyles.replaceSync(`
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) var(--spacing-xl);
    font-family: var(--typography-body);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    line-height: var(--font-line-height-base);
    color: var(--color-text);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .btn:hover {
    background: var(--color-hover-bg);
    border-color: var(--color-border);
  }

  .btn:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    color: var(--color-white);
    background: var(--color-purple-600);
    border-color: var(--color-purple-600);
  }

  .btn-primary:hover {
    background: var(--color-purple-700);
    border-color: var(--color-purple-700);
  }
`);

customElements.define('sp-button', SPButton);
