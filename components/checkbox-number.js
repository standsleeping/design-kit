import { render as renderCheckbox } from './checkbox.js';
import { render as renderNumberInput } from './number-input.js';

export const metadata = {
  name: 'CheckboxNumber',
  description: 'Compound control: checkbox enables an adjacent numeric input',
  category: 'inputs',
};

export const propTypes = {
  checked: { type: 'boolean', default: false },
  value: { type: 'number', default: 90 },
  min: { type: 'number', default: 0 },
  max: { type: 'number', default: 100 },
  step: { type: 'number', default: 1 },
  disabled: { type: 'boolean', default: false },
};

export const variants = [
  { name: 'enabled', description: 'Checked, value editable', props: { checked: true, value: 90 } },
  { name: 'unchecked', description: 'Unchecked, number disabled', props: { checked: false, value: 50 } },
  { name: 'disabled', description: 'Whole control disabled', props: { checked: true, value: 25, disabled: true } },
];

export function render(props = {}) {
  let checked = props.checked ?? propTypes.checked.default;
  let value = Number.isFinite(props.value) ? props.value : propTypes.value.default;
  const min = props.min ?? propTypes.min.default;
  const max = props.max ?? propTypes.max.default;
  const step = props.step ?? propTypes.step.default;
  const disabled = props.disabled ?? propTypes.disabled.default;

  const root = document.createElement('span');
  root.className = 'dk-checkbox-number';

  const number = renderNumberInput({ value, min, max, step, disabled: disabled || !checked });
  const checkbox = renderCheckbox({ checked, disabled });

  checkbox.addEventListener('checkbox:change', (event) => {
    checked = Boolean(event.detail?.checked);
    number.disabled = disabled || !checked;
    root.dispatchEvent(new CustomEvent('checkbox-number:change', {
      bubbles: true,
      detail: { checked, value },
    }));
  });

  number.addEventListener('number-input:input', (event) => {
    const next = event.detail?.value;
    if (next !== null) value = next;
    root.dispatchEvent(new CustomEvent('checkbox-number:input', {
      bubbles: true,
      detail: { checked, value },
    }));
  });

  number.addEventListener('number-input:change', (event) => {
    const next = event.detail?.value;
    if (next !== null) value = next;
    root.dispatchEvent(new CustomEvent('checkbox-number:change', {
      bubbles: true,
      detail: { checked, value },
    }));
  });

  root.append(number, checkbox);
  return root;
}
