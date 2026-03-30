import { SPElement } from './sp-element.js';

export class SPRange extends SPElement {
  static metadata = {
    name: 'SPRange',
    description: 'Range slider control with numeric event payloads',
    category: 'inputs',
  };

  static propTypes = {
    value: { type: 'number', default: 50 },
    min: { type: 'number', default: 0 },
    max: { type: 'number', default: 100 },
    step: { type: 'number', default: 1 },
    disabled: { type: 'boolean', default: false },
  };

  static variants = ['default', 'disabled'];

  static componentStyles = new CSSStyleSheet();

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;

    const input = this.shadowRoot?.querySelector('.range');
    const valueLabel = this.shadowRoot?.querySelector('.range-value');
    if (!input || !valueLabel) {
      this.render();
      return;
    }

    if (name === 'value') {
      const next = Number(newVal);
      const safe = Number.isFinite(next) ? next : 0;
      if (Number(input.value) !== safe) {
        input.value = String(safe);
      }
      valueLabel.textContent = String(safe);
      return;
    }

    if (name === 'min' || name === 'max' || name === 'step') {
      const next = Number(newVal);
      const safe = Number.isFinite(next) ? next : 0;
      input[name] = String(safe);
      return;
    }

    if (name === 'disabled') {
      input.disabled = newVal !== null && newVal !== 'false';
      return;
    }

    this.render();
  }

  render() {
    const value = this.prop('value');
    const min = this.prop('min');
    const max = this.prop('max');
    const step = this.prop('step');
    const disabled = this.prop('disabled');

    this.shadowRoot.innerHTML = `
      <span class="range-wrap">
        <input
          class="range"
          type="range"
          value="${Number.isFinite(value) ? value : 0}"
          min="${Number.isFinite(min) ? min : 0}"
          max="${Number.isFinite(max) ? max : 100}"
          step="${Number.isFinite(step) ? step : 1}"
          ${disabled ? 'disabled' : ''}
        />
        <span class="range-value">${Number.isFinite(value) ? value : 0}</span>
      </span>
    `;

    const input = this.shadowRoot.querySelector('.range');
    const valueLabel = this.shadowRoot.querySelector('.range-value');

    input.addEventListener('input', (event) => {
      const nextValue = Number(event.target.value);
      this.setAttribute('value', String(nextValue));
      valueLabel.textContent = String(nextValue);
      this.dispatchEvent(
        new CustomEvent('sp-input', {
          bubbles: true,
          detail: { value: nextValue },
        })
      );
    });

    input.addEventListener('change', (event) => {
      this.dispatchEvent(
        new CustomEvent('sp-change', {
          bubbles: true,
          detail: { value: Number(event.target.value) },
        })
      );
    });
  }
}

SPRange.componentStyles.replaceSync(`
  .range-wrap {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    min-width: 140px;
  }

  .range {
    width: 100px;
    accent-color: var(--color-link);
  }

  .range-value {
    min-width: 28px;
    text-align: right;
    font-family: var(--typography-mono);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
`);

customElements.define('sp-range', SPRange);
