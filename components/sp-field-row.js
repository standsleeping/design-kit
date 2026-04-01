import { SPElement } from './sp-element.js';

export class SPFieldRow extends SPElement {
  static metadata = {
    name: 'SPFieldRow',
    description: 'Label/control row shell for settings and form controls',
    category: 'controls',
  };

  static propTypes = {
    label: { type: 'string', default: 'Setting' },
    compact: { type: 'boolean', default: false },
    disabled: { type: 'boolean', default: false },
  };

  static variants = ['default', 'compact', 'disabled'];

  static componentStyles = new CSSStyleSheet();

  render() {
    const label = this.prop('label');
    const compact = this.prop('compact');
    const disabled = this.prop('disabled');

    this.shadowRoot.innerHTML = `
      <div class="field-row ${compact ? 'field-row-compact' : ''} ${disabled ? 'field-row-disabled' : ''}">
        <span class="field-row-label">${label}</span>
        <span class="field-row-control"><slot></slot></span>
      </div>
    `;
  }
}

SPFieldRow.componentStyles.replaceSync(`
  .field-row {
    min-height: 44px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-sm) var(--spacing-md);
    border-bottom: var(--field-row-border, 1px solid var(--color-border));
  }

  .field-row-compact {
    min-height: 36px;
    padding-top: var(--spacing-xs);
    padding-bottom: var(--spacing-xs);
  }

  .field-row-disabled {
    opacity: 0.65;
  }

  .field-row-label {
    color: var(--color-text-muted);
    font-family: var(--typography-mono);
    font-size: var(--font-size-xs);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .field-row-control {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  ::slotted(*) {
    max-width: 220px;
  }
`);

customElements.define('sp-field-row', SPFieldRow);
