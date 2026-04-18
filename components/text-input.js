export const metadata = {
  name: 'TextInput',
  description: 'Typed text input with normalized input/change payloads',
  category: 'inputs',
};

export const propTypes = {
  type: { type: 'enum', default: 'text', options: ['text', 'search', 'email', 'password', 'url', 'tel'] },
  value: { type: 'string', default: '' },
  placeholder: { type: 'string', default: '' },
  disabled: { type: 'boolean', default: false },
};

export const variants = [
  { name: 'text', description: 'Empty text field', props: { placeholder: 'Enter a name' } },
  { name: 'filled', description: 'Pre-filled value', props: { value: 'Alice Johnson' } },
  { name: 'search', description: 'Search input', props: { type: 'search', placeholder: 'Search components…' } },
  { name: 'password', description: 'Password masked', props: { type: 'password', value: 'hunter2' } },
  { name: 'disabled', description: 'Disabled state', props: { value: 'Read-only', disabled: true } },
];

export function render(props = {}) {
  const type = props.type ?? propTypes.type.default;
  const value = props.value ?? propTypes.value.default;
  const placeholder = props.placeholder ?? propTypes.placeholder.default;
  const disabled = props.disabled ?? propTypes.disabled.default;

  const root = document.createElement('input');
  root.className = 'dk-text-input';
  root.type = type;
  root.value = value;
  root.placeholder = placeholder;
  root.disabled = disabled;

  root.addEventListener('input', (event) => {
    root.dispatchEvent(new CustomEvent('text-input:input', {
      bubbles: true,
      detail: { value: event.target.value },
    }));
  });

  root.addEventListener('change', (event) => {
    root.dispatchEvent(new CustomEvent('text-input:change', {
      bubbles: true,
      detail: { value: event.target.value },
    }));
  });

  return root;
}
