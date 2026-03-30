import { SPElement } from './sp-element.js';
import './sp-checkbox.js';
import './sp-number-input.js';

export class SPCheckboxNumber extends SPElement {
  static metadata = {
    name: 'SPCheckboxNumber',
    description: 'Compound control combining checkbox enablement with numeric input',
    category: 'inputs',
  };

  static propTypes = {
    checked: { type: 'boolean', default: false },
    value: { type: 'number', default: 90 },
    min: { type: 'number', default: 0 },
    max: { type: 'number', default: 100 },
    step: { type: 'number', default: 1 },
    disabled: { type: 'boolean', default: false },
  };

  static variants = ['enabled', 'disabled', 'unchecked'];

  static componentStyles = new CSSStyleSheet();

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;

    const numberInput = this.shadowRoot?.querySelector('sp-number-input');
    const checkbox = this.shadowRoot?.querySelector('sp-checkbox');
    if (!numberInput || !checkbox) {
      this.render();
      return;
    }

    const checked = this.hasAttribute('checked');
    const disabled = this.hasAttribute('disabled');
    const numberDisabled = disabled || !checked;

    if (name === 'value') {
      const next = Number(newVal);
      const safe = Number.isFinite(next) ? next : 0;
      numberInput.setAttribute('value', String(safe));
      return;
    }

    if (name === 'min' || name === 'max' || name === 'step') {
      const next = Number(newVal);
      const safe = Number.isFinite(next) ? next : 0;
      numberInput.setAttribute(name, String(safe));
      return;
    }

    if (name === 'checked' || name === 'disabled') {
      if (checked) checkbox.setAttribute('checked', '');
      else checkbox.removeAttribute('checked');
      if (disabled) checkbox.setAttribute('disabled', '');
      else checkbox.removeAttribute('disabled');
      if (numberDisabled) numberInput.setAttribute('disabled', '');
      else numberInput.removeAttribute('disabled');
      return;
    }

    this.render();
  }

  render() {
    const checked = this.prop('checked');
    const value = this.prop('value');
    const min = this.prop('min');
    const max = this.prop('max');
    const step = this.prop('step');
    const disabled = this.prop('disabled');
    const numberDisabled = disabled || !checked;

    this.shadowRoot.innerHTML = `
      <span class="compound">
        <sp-number-input
          value="${Number.isFinite(value) ? value : 0}"
          min="${Number.isFinite(min) ? min : 0}"
          max="${Number.isFinite(max) ? max : 100}"
          step="${Number.isFinite(step) ? step : 1}"
          ${numberDisabled ? 'disabled' : ''}
        ></sp-number-input>
        <sp-checkbox
          ${checked ? 'checked' : ''}
          ${disabled ? 'disabled' : ''}
        ></sp-checkbox>
      </span>
    `;

    const numberInput = this.shadowRoot.querySelector('sp-number-input');
    const checkbox = this.shadowRoot.querySelector('sp-checkbox');

    numberInput.addEventListener('sp-input', (event) => {
      const nextValue = Number(event.detail?.value);
      this.setAttribute('value', String(nextValue));
      this.dispatchEvent(
        new CustomEvent('sp-input', {
          bubbles: true,
          detail: { checked: this.hasAttribute('checked'), value: nextValue },
        })
      );
    });

    numberInput.addEventListener('sp-change', (event) => {
      const nextValue = Number(event.detail?.value);
      this.setAttribute('value', String(nextValue));
      this.dispatchEvent(
        new CustomEvent('sp-change', {
          bubbles: true,
          detail: { checked: this.hasAttribute('checked'), value: nextValue },
        })
      );
    });

    checkbox.addEventListener('sp-change', (event) => {
      const nextChecked = Boolean(event.detail?.checked);
      if (nextChecked) {
        this.setAttribute('checked', '');
      } else {
        this.removeAttribute('checked');
      }
      if (disabled || !nextChecked) {
        numberInput.setAttribute('disabled', '');
      } else {
        numberInput.removeAttribute('disabled');
      }
      this.dispatchEvent(
        new CustomEvent('sp-change', {
          bubbles: true,
          detail: { checked: nextChecked, value: Number(this.prop('value')) },
        })
      );
    });
  }
}

SPCheckboxNumber.componentStyles.replaceSync(`
  .compound {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
  }
`);

customElements.define('sp-checkbox-number', SPCheckboxNumber);
