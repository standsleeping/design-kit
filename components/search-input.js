export const metadata = {
  name: 'SearchInput',
  description: 'Minimal search input for filtering',
  category: 'inputs',
};

export const propTypes = {
  value: { type: 'string', default: '' },
  placeholder: { type: 'string', default: 'Filter' },
  required: { type: 'boolean', default: false },
  pattern: { type: 'string', default: '' },
  minlength: { type: 'number', default: 0 },
  maxlength: { type: 'number', default: 0 },
  disabled: { type: 'boolean', default: false },
};

export const variants = [
  { name: 'empty', description: 'Empty search field', props: { placeholder: 'Filter' } },
  { name: 'with-value', description: 'Pre-filled query', props: { value: 'layout' } },
  { name: 'disabled', description: 'Disabled state', props: { value: 'frozen', disabled: true } },
];

/**
 * @param {{ value?: string, placeholder?: string, required?: boolean, pattern?: string, minlength?: number, maxlength?: number, disabled?: boolean }} [props]
 * @returns {HTMLInputElement}
 */
export function render(props = {}) {
  const value = props.value ?? propTypes.value.default;
  const placeholder = props.placeholder ?? propTypes.placeholder.default;
  const required = props.required ?? propTypes.required.default;
  const pattern = props.pattern ?? propTypes.pattern.default;
  const minlength = props.minlength ?? propTypes.minlength.default;
  const maxlength = props.maxlength ?? propTypes.maxlength.default;
  const disabled = props.disabled ?? propTypes.disabled.default;

  const root = document.createElement('input');
  root.className = 'dk-search-input';
  root.type = 'search';
  root.value = value;
  root.placeholder = placeholder;
  root.disabled = disabled;
  if (required) root.required = true;
  if (pattern) root.setAttribute('pattern', pattern);
  if (minlength > 0) root.minLength = minlength;
  if (maxlength > 0) root.maxLength = maxlength;

  root.addEventListener('input', (event) => {
    const target = /** @type {HTMLInputElement} */ (event.target);
    root.dispatchEvent(new CustomEvent('search-input:input', {
      bubbles: true,
      detail: { value: target.value },
    }));
  });

  root.addEventListener('change', (event) => {
    const target = /** @type {HTMLInputElement} */ (event.target);
    root.dispatchEvent(new CustomEvent('search-input:change', {
      bubbles: true,
      detail: { value: target.value },
    }));
  });

  return root;
}
