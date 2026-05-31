export const metadata = {
  name: 'NumberInput',
  description: 'Number input with normalized numeric event payloads',
  category: 'inputs',
};

export const propTypes = {
  value: { type: 'number', default: 0 },
  min: { type: 'number', default: 0 },
  max: { type: 'number', default: 100 },
  step: { type: 'number', default: 1 },
  placeholder: { type: 'string', default: '' },
  required: { type: 'boolean', default: false },
  disabled: { type: 'boolean', default: false },
};

export const variants = [
  { name: 'default', description: 'Zero-initialized, 0–100', props: {} },
  { name: 'bounded', description: 'Custom range and step', props: { value: 42, min: 0, max: 50, step: 2 } },
  { name: 'placeholder', description: 'Empty with placeholder', props: { value: NaN, placeholder: '— —' } },
  { name: 'required', description: 'Required field (native :user-invalid when empty)', props: { value: NaN, placeholder: 'Required', required: true } },
  { name: 'disabled', description: 'Disabled state', props: { value: 7, disabled: true } },
];

/**
 * @param {{ value?: number, min?: number, max?: number, step?: number, placeholder?: string, required?: boolean, disabled?: boolean }} [props]
 * @returns {HTMLInputElement}
 */
export function render(props = {}) {
  const rawValue = props.value;
  const value = Number.isFinite(rawValue) ? rawValue : propTypes.value.default;
  const min = props.min ?? propTypes.min.default;
  const max = props.max ?? propTypes.max.default;
  const step = props.step ?? propTypes.step.default;
  const placeholder = props.placeholder ?? propTypes.placeholder.default;
  const required = props.required ?? propTypes.required.default;
  const disabled = props.disabled ?? propTypes.disabled.default;

  const root = document.createElement('input');
  root.className = 'dk-number-input';
  root.type = 'number';
  root.min = String(min);
  root.max = String(max);
  root.step = String(step);
  root.placeholder = placeholder;
  root.disabled = disabled;
  if (required) root.required = true;
  if (Number.isFinite(rawValue)) root.value = String(rawValue);

  root.addEventListener('input', (event) => {
    const target = /** @type {HTMLInputElement} */ (event.target);
    const numeric = Number(target.value);
    root.dispatchEvent(new CustomEvent('number-input:input', {
      bubbles: true,
      detail: { value: Number.isFinite(numeric) ? numeric : null, raw: target.value },
    }));
  });

  root.addEventListener('change', (event) => {
    const target = /** @type {HTMLInputElement} */ (event.target);
    const numeric = Number(target.value);
    root.dispatchEvent(new CustomEvent('number-input:change', {
      bubbles: true,
      detail: { value: Number.isFinite(numeric) ? numeric : null, raw: target.value },
    }));
  });

  return root;
}
