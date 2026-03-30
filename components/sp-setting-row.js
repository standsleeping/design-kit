import { SPElement } from './sp-element.js';
import './sp-field-row.js';
import './sp-text-input.js';
import './sp-select.js';
import './sp-range.js';
import './sp-checkbox.js';
import './sp-number-input.js';
import './sp-checkbox-number.js';

export class SPSettingRow extends SPElement {
  static metadata = {
    name: 'SPSettingRow',
    description: 'Composable setting row that maps control types to design-kit primitives',
    category: 'controls',
  };

  static propTypes = {
    name: { type: 'string', default: '' },
    label: { type: 'string', default: 'Setting' },
    'control-type': { type: 'string', default: 'text' },
    type: { type: 'string', default: 'text' },
    value: { type: 'string', default: '' },
    options: { type: 'array', default: [] },
    placeholder: { type: 'string', default: '' },
    checked: { type: 'boolean', default: false },
    min: { type: 'number', default: 0 },
    max: { type: 'number', default: 100 },
    step: { type: 'number', default: 1 },
    compact: { type: 'boolean', default: false },
    disabled: { type: 'boolean', default: false },
  };

  static variants = ['text', 'select', 'range', 'checkbox-number', 'disabled'];

  static componentStyles = new CSSStyleSheet();

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;

    const structural = new Set([
      'label',
      'control-type',
      'type',
      'options',
      'placeholder',
      'compact',
      'disabled',
    ]);
    if (structural.has(name)) {
      this.render();
      return;
    }

    const control = this.shadowRoot?.querySelector('sp-field-row > *');
    if (!control) {
      this.render();
      return;
    }

    if (name === 'value') {
      if (newVal === null || newVal === undefined) {
        control.removeAttribute?.('value');
      } else {
        control.setAttribute?.('value', String(newVal));
      }
      return;
    }

    if (name === 'checked') {
      if (newVal !== null && newVal !== 'false') {
        control.setAttribute?.('checked', '');
      } else {
        control.removeAttribute?.('checked');
      }
      return;
    }

    if (name === 'name' || name === 'min' || name === 'max' || name === 'step') {
      if (newVal === null || newVal === undefined) {
        control.removeAttribute?.(name);
      } else {
        control.setAttribute?.(name, String(newVal));
      }
      return;
    }

    this.render();
  }

  _normalizedDetail(partial = {}) {
    const controlType = this.prop('control-type');
    const attrValue = this.prop('value');
    const attrChecked = this.prop('checked');
    return {
      name: this.prop('name') || '',
      controlType,
      value: partial.value !== undefined ? partial.value : attrValue,
      checked: partial.checked !== undefined ? partial.checked : attrChecked,
    };
  }

  _emitNormalized(eventName, partial = {}) {
    this.dispatchEvent(
      new CustomEvent(eventName, {
        bubbles: true,
        detail: this._normalizedDetail(partial),
      })
    );
  }

  _buildControl() {
    const controlType = this.prop('control-type');
    const disabled = this.prop('disabled');
    const value = this.prop('value');
    const placeholder = this.prop('placeholder');
    const min = this.prop('min');
    const max = this.prop('max');
    const step = this.prop('step');
    const checked = this.prop('checked');

    if (controlType === 'select') {
      const select = document.createElement('sp-select');
      const options = this.prop('options');
      select.setAttribute('value', value ?? '');
      select.setAttribute(
        'options',
        Array.isArray(options) ? JSON.stringify(options) : '[]'
      );
      if (disabled) select.setAttribute('disabled', '');
      return select;
    }

    if (controlType === 'range') {
      const range = document.createElement('sp-range');
      const numeric = Number(value);
      range.setAttribute('value', Number.isFinite(numeric) ? String(numeric) : '0');
      range.setAttribute('min', String(min));
      range.setAttribute('max', String(max));
      range.setAttribute('step', String(step));
      if (disabled) range.setAttribute('disabled', '');
      return range;
    }

    if (controlType === 'checkbox-number') {
      const compound = document.createElement('sp-checkbox-number');
      const numeric = Number(value);
      compound.setAttribute('value', Number.isFinite(numeric) ? String(numeric) : '0');
      compound.setAttribute('min', String(min));
      compound.setAttribute('max', String(max));
      compound.setAttribute('step', String(step));
      if (checked) compound.setAttribute('checked', '');
      if (disabled) compound.setAttribute('disabled', '');
      return compound;
    }

    if (controlType === 'checkbox') {
      const checkbox = document.createElement('sp-checkbox');
      if (checked) checkbox.setAttribute('checked', '');
      if (disabled) checkbox.setAttribute('disabled', '');
      return checkbox;
    }

    if (controlType === 'number') {
      const input = document.createElement('sp-number-input');
      const numeric = Number(value);
      input.setAttribute('value', Number.isFinite(numeric) ? String(numeric) : '0');
      input.setAttribute('min', String(min));
      input.setAttribute('max', String(max));
      input.setAttribute('step', String(step));
      input.setAttribute('placeholder', placeholder ?? '');
      if (disabled) input.setAttribute('disabled', '');
      return input;
    }

    const input = document.createElement('sp-text-input');
    const inputType = this.prop('type') || 'text';
    input.setAttribute('type', inputType);
    input.setAttribute('value', value ?? '');
    input.setAttribute('placeholder', placeholder ?? '');
    if (disabled) input.setAttribute('disabled', '');
    return input;
  }

  render() {
    const label = this.prop('label');
    const compact = this.prop('compact');
    const disabled = this.prop('disabled');

    this.shadowRoot.innerHTML = `
      <sp-field-row
        label="${label ?? ''}"
        ${compact ? 'compact' : ''}
        ${disabled ? 'disabled' : ''}
      ></sp-field-row>
    `;

    const row = this.shadowRoot.querySelector('sp-field-row');
    const control = this._buildControl();
    row.appendChild(control);

    if (control.tagName !== 'INPUT') {
      control.addEventListener('sp-input', (event) => {
        const detail = event.detail ?? {};
        if (detail.value !== undefined) {
          this.setAttribute('value', String(detail.value));
        }
        if (detail.checked !== undefined) {
          if (detail.checked) this.setAttribute('checked', '');
          else this.removeAttribute('checked');
        }
        this._emitNormalized('sp-input', detail);
      });
      control.addEventListener('sp-change', (event) => {
        const detail = event.detail ?? {};
        if (detail.value !== undefined) {
          this.setAttribute('value', String(detail.value));
        }
        if (detail.checked !== undefined) {
          if (detail.checked) this.setAttribute('checked', '');
          else this.removeAttribute('checked');
        }
        this._emitNormalized('sp-change', detail);
      });
    }
  }
}

SPSettingRow.componentStyles.replaceSync(`
  :host { display: block; }
`);

customElements.define('sp-setting-row', SPSettingRow);
