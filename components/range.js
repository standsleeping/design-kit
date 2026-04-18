export const metadata = {
  name: 'Range',
  description: 'Range slider with inline value readout',
  category: 'inputs',
};

export const propTypes = {
  value: { type: 'number', default: 50 },
  min: { type: 'number', default: 0 },
  max: { type: 'number', default: 100 },
  step: { type: 'number', default: 1 },
  disabled: { type: 'boolean', default: false },
};

export const variants = [
  { name: 'default', description: 'Midpoint value', props: {} },
  { name: 'min', description: 'At minimum', props: { value: 0 } },
  { name: 'max', description: 'At maximum', props: { value: 100 } },
  { name: 'stepped', description: 'Step 10, value 70', props: { value: 70, step: 10 } },
  { name: 'disabled', description: 'Disabled state', props: { value: 30, disabled: true } },
];

export function render(props = {}) {
  const value = Number.isFinite(props.value) ? props.value : propTypes.value.default;
  const min = props.min ?? propTypes.min.default;
  const max = props.max ?? propTypes.max.default;
  const step = props.step ?? propTypes.step.default;
  const disabled = props.disabled ?? propTypes.disabled.default;

  const root = document.createElement('span');
  root.className = 'dk-range';

  const input = document.createElement('input');
  input.type = 'range';
  input.className = 'dk-range-input';
  input.value = String(value);
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.disabled = disabled;

  const readout = document.createElement('span');
  readout.className = 'dk-range-value';
  readout.textContent = String(value);

  root.append(input, readout);

  input.addEventListener('input', (event) => {
    const next = Number(event.target.value);
    readout.textContent = String(next);
    root.dispatchEvent(new CustomEvent('range:input', {
      bubbles: true,
      detail: { value: next },
    }));
  });

  input.addEventListener('change', (event) => {
    const next = Number(event.target.value);
    root.dispatchEvent(new CustomEvent('range:change', {
      bubbles: true,
      detail: { value: next },
    }));
  });

  return root;
}
