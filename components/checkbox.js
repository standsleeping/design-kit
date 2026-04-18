export const metadata = {
  name: 'Checkbox',
  description: 'Checkbox control with normalized change payload',
  category: 'inputs',
};

export const propTypes = {
  checked: { type: 'boolean', default: false },
  disabled: { type: 'boolean', default: false },
};

export const variants = [
  { name: 'unchecked', description: 'Unchecked state', props: {} },
  { name: 'checked', description: 'Checked state', props: { checked: true } },
  { name: 'disabled', description: 'Disabled unchecked', props: { disabled: true } },
  { name: 'disabled-checked', description: 'Disabled checked', props: { checked: true, disabled: true } },
];

export function render(props = {}) {
  const checked = props.checked ?? propTypes.checked.default;
  const disabled = props.disabled ?? propTypes.disabled.default;

  const root = document.createElement('input');
  root.type = 'checkbox';
  root.className = 'dk-checkbox';
  root.checked = checked;
  root.disabled = disabled;

  root.addEventListener('change', (event) => {
    root.dispatchEvent(new CustomEvent('checkbox:change', {
      bubbles: true,
      detail: { checked: event.target.checked },
    }));
  });

  return root;
}
