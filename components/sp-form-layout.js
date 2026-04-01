import { SPElement } from './sp-element.js';

export class SPFormLayout extends SPElement {
  static metadata = {
    name: 'SPFormLayout',
    description:
      'Grid form layout for structured data entry in the machine-legibility tradition',
    category: 'layout',
  };

  static propTypes = {
    columns: { type: 'number', default: 2 },
    label: { type: 'string', default: '' },
  };

  static variants = ['two-column', 'three-column', 'with-label', 'single-column'];

  static componentStyles = new CSSStyleSheet();

  render() {
    const columns = this.prop('columns');
    const label = this.prop('label');

    const labelHtml = label
      ? `<div class="form-label">${label}</div>`
      : '';

    this.shadowRoot.innerHTML = `
      <div class="form-layout" style="--form-columns: ${columns}">
        ${labelHtml}
        <slot></slot>
      </div>
    `;
  }
}

SPFormLayout.componentStyles.replaceSync(`
  .form-layout {
    display: grid;
    grid-template-columns: repeat(var(--form-columns, 2), 1fr);
    gap: 1px;
    border: var(--border-width-thin) solid var(--color-border);
    background: var(--color-border);
    font-family: var(--typography-mono);
    --field-row-border: none;
  }

  .form-label {
    font-family: var(--typography-mono);
    font-size: var(--font-size-2xs);
    text-transform: uppercase;
    letter-spacing: var(--font-letter-spacing-wide);
    color: var(--color-text-muted);
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--color-bg);
    grid-column: 1 / -1;
    border-bottom: var(--border-width-thin) solid var(--color-border);
  }

  ::slotted(*) {
    background: var(--color-bg);
    padding: var(--spacing-sm) var(--spacing-md);
    min-height: 44px;
  }

  ::slotted([span="2"]) { grid-column: span 2; }
  ::slotted([span="3"]) { grid-column: span 3; }
  ::slotted([span="4"]) { grid-column: span 4; }

  ::slotted([section-header]) {
    grid-column: 1 / -1;
    font-family: var(--typography-mono);
    font-size: var(--font-size-2xs);
    text-transform: uppercase;
    letter-spacing: var(--font-letter-spacing-wide);
    color: var(--color-text-muted);
    padding: var(--spacing-xs) var(--spacing-sm);
    display: flex;
    align-items: center;
    border-top: var(--border-width-medium) solid var(--color-gray-400);
  }
`);

customElements.define('sp-form-layout', SPFormLayout);
