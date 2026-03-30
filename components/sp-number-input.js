import { SPElement } from './sp-element.js';

export class SPNumberInput extends SPElement {
  static metadata = {
    name: 'SPNumberInput',
    description: 'Number input wrapper with normalized value events',
    category: 'inputs',
  };

  static propTypes = {
    value: { type: 'number', default: 0 },
    min: { type: 'number', default: 0 },
    max: { type: 'number', default: 100 },
    step: { type: 'number', default: 1 },
    placeholder: { type: 'string', default: '' },
    disabled: { type: 'boolean', default: false },
  };

  static variants = ['default', 'bounded', 'disabled'];

  static componentStyles = new CSSStyleSheet();

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;

    const input = this.shadowRoot?.querySelector('.number-input');
    if (!input) {
      this.render();
      return;
    }

    if (name === 'value') {
      const next = Number(newVal);
      const safe = Number.isFinite(next) ? next : 0;
      if (Number(input.value) !== safe) {
        input.value = String(safe);
      }
      return;
    }

    if (name === 'min' || name === 'max' || name === 'step') {
      const next = Number(newVal);
      const safe = Number.isFinite(next) ? next : 0;
      input[name] = String(safe);
      return;
    }

    if (name === 'placeholder') {
      input.placeholder = newVal ?? '';
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
    const placeholder = this.prop('placeholder');
    const disabled = this.prop('disabled');

    this.shadowRoot.innerHTML = `
      <input
        class="number-input"
        type="number"
        value="${Number.isFinite(value) ? value : 0}"
        min="${Number.isFinite(min) ? min : 0}"
        max="${Number.isFinite(max) ? max : 100}"
        step="${Number.isFinite(step) ? step : 1}"
        placeholder="${placeholder ?? ''}"
        ${disabled ? 'disabled' : ''}
      />
    `;

    const input = this.shadowRoot.querySelector('.number-input');
    input.addEventListener('input', (event) => {
      const nextValue = Number(event.target.value);
      this.setAttribute('value', String(nextValue));
      this.dispatchEvent(
        new CustomEvent('sp-input', {
          bubbles: true,
          detail: { value: nextValue },
        })
      );
    });

    input.addEventListener('change', (event) => {
      const nextValue = Number(event.target.value);
      this.setAttribute('value', String(nextValue));
      this.dispatchEvent(
        new CustomEvent('sp-change', {
          bubbles: true,
          detail: { value: nextValue },
        })
      );
    });
  }
}

SPNumberInput.componentStyles.replaceSync(`
  .number-input {
    width: 72px;
    font-family: var(--typography-mono);
    font-size: var(--font-size-xs);
    color: var(--color-text);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-xs) var(--spacing-sm);
    outline: none;
  }

  .number-input:hover {
    border-color: var(--color-text-muted);
  }

  .number-input:focus-visible {
    border-color: var(--color-focus-ring);
    box-shadow: 0 0 0 2px var(--color-focus-ring-light);
  }

  .number-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: var(--color-code-bg);
  }
`);

customElements.define('sp-number-input', SPNumberInput);
