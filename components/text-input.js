export const metadata = {
  name: 'TextInput',
  description: 'Typed text input with normalized input/change payloads',
  category: 'inputs',
};

export const propTypes = {
  type: { type: 'enum', default: 'text', options: ['text', 'search', 'email', 'password', 'url', 'tel'] },
  value: { type: 'string', default: '' },
  placeholder: { type: 'string', default: '' },
  required: { type: 'boolean', default: false },
  pattern: { type: 'string', default: '' },
  minlength: { type: 'number', default: 0 },
  maxlength: { type: 'number', default: 0 },
  disabled: { type: 'boolean', default: false },
};

export const variants = [
  { name: 'text', description: 'Empty text field', props: { placeholder: 'Enter a name' } },
  { name: 'filled', description: 'Pre-filled value', props: { value: 'Alice Johnson' } },
  { name: 'search', description: 'Search input', props: { type: 'search', placeholder: 'Search components…' } },
  { name: 'required', description: 'Required field (native :user-invalid when empty)', props: { placeholder: 'Required', required: true } },
  { name: 'password', description: 'Password masked', props: { type: 'password', value: 'hunter2' } },
  { name: 'disabled', description: 'Disabled state', props: { value: 'Read-only', disabled: true } },
];

/**
 * @param {{ type?: 'text' | 'search' | 'email' | 'password' | 'url' | 'tel', value?: string, placeholder?: string, required?: boolean, pattern?: string, minlength?: number, maxlength?: number, disabled?: boolean }} [props]
 * @returns {HTMLInputElement}
 */
export function render(props = {}) {
  const type = props.type ?? propTypes.type.default;
  const value = props.value ?? propTypes.value.default;
  const placeholder = props.placeholder ?? propTypes.placeholder.default;
  const required = props.required ?? propTypes.required.default;
  const pattern = props.pattern ?? propTypes.pattern.default;
  const minlength = props.minlength ?? propTypes.minlength.default;
  const maxlength = props.maxlength ?? propTypes.maxlength.default;
  const disabled = props.disabled ?? propTypes.disabled.default;

  const root = document.createElement('input');
  root.className = 'dk-text-input';
  root.type = type;
  root.value = value;
  root.placeholder = placeholder;
  root.disabled = disabled;
  if (required) root.required = true;
  if (pattern) root.setAttribute('pattern', pattern);
  if (minlength > 0) root.minLength = minlength;
  if (maxlength > 0) root.maxLength = maxlength;

  root.addEventListener('input', (event) => {
    const target = /** @type {HTMLInputElement} */ (event.target);
    root.dispatchEvent(new CustomEvent('text-input:input', {
      bubbles: true,
      detail: { value: target.value },
    }));
  });

  root.addEventListener('change', (event) => {
    const target = /** @type {HTMLInputElement} */ (event.target);
    root.dispatchEvent(new CustomEvent('text-input:change', {
      bubbles: true,
      detail: { value: target.value },
    }));
  });

  return root;
}
