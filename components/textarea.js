export const metadata = {
  name: 'Textarea',
  description: 'Multi-line text input; mono font, square 8px padding, inset focus; resize: vertical',
  category: 'input',
};

export const propTypes = {
  value: { type: 'string', default: '' },
  placeholder: { type: 'string', default: '' },
  rows: { type: 'number', default: 4 },
  size: { type: 'string', default: 'default' },
  required: { type: 'boolean', default: false },
  pattern: { type: 'string', default: '' },
  minlength: { type: 'number', default: 0 },
  maxlength: { type: 'number', default: 0 },
  disabled: { type: 'boolean', default: false },
};

export const variants = [
  {
    name: 'default',
    description: 'Default-tier textarea, 4 lines',
    props: { placeholder: 'Multi-line input', rows: 4 },
  },
  {
    name: 'with-value',
    description: 'Pre-filled with JSON',
    props: { value: '{\n  "key": "value"\n}', rows: 4 },
  },
  {
    name: 'compact',
    description: 'Compact (sm) size variant',
    props: { placeholder: 'Compact', size: 'sm', rows: 3 },
  },
  {
    name: 'required',
    description: 'Required field (native :user-invalid when empty)',
    props: { placeholder: 'Required', required: true, rows: 4 },
  },
  {
    name: 'disabled',
    description: 'Disabled',
    props: { value: 'Read only', disabled: true, rows: 3 },
  },
];

/**
 * @param {{ value?: string, placeholder?: string, rows?: number, size?: string, required?: boolean, pattern?: string, minlength?: number, maxlength?: number, disabled?: boolean }} [props]
 * @returns {HTMLTextAreaElement}
 */
export function render(props = {}) {
  const value = props.value ?? propTypes.value.default;
  const placeholder = props.placeholder ?? propTypes.placeholder.default;
  const rows = props.rows ?? propTypes.rows.default;
  const size = props.size ?? propTypes.size.default;
  const required = props.required ?? propTypes.required.default;
  const pattern = props.pattern ?? propTypes.pattern.default;
  const minlength = props.minlength ?? propTypes.minlength.default;
  const maxlength = props.maxlength ?? propTypes.maxlength.default;
  const disabled = props.disabled ?? propTypes.disabled.default;

  const ta = document.createElement('textarea');
  ta.className = 'dk-textarea';
  if (size === 'sm') ta.classList.add('dk-textarea-sm');
  ta.rows = rows;
  if (placeholder) ta.placeholder = placeholder;
  if (value) ta.value = value;
  if (required) ta.required = true;
  if (pattern) ta.setAttribute('pattern', pattern);
  if (minlength > 0) ta.minLength = minlength;
  if (maxlength > 0) ta.maxLength = maxlength;
  if (disabled) ta.disabled = true;
  return ta;
}
