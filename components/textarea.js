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
  invalid: { type: 'boolean', default: false },
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
    name: 'invalid',
    description: 'Invalid state (danger border)',
    props: { value: '{ malformed', invalid: true, rows: 4 },
  },
  {
    name: 'disabled',
    description: 'Disabled',
    props: { value: 'Read only', disabled: true, rows: 3 },
  },
];

/**
 * @param {{ value?: string, placeholder?: string, rows?: number, size?: string, invalid?: boolean, disabled?: boolean }} [props]
 * @returns {HTMLTextAreaElement}
 */
export function render(props = {}) {
  const value = props.value ?? propTypes.value.default;
  const placeholder = props.placeholder ?? propTypes.placeholder.default;
  const rows = props.rows ?? propTypes.rows.default;
  const size = props.size ?? propTypes.size.default;
  const invalid = props.invalid ?? propTypes.invalid.default;
  const disabled = props.disabled ?? propTypes.disabled.default;

  const ta = document.createElement('textarea');
  ta.className = 'dk-textarea';
  if (size === 'sm') ta.classList.add('dk-textarea-sm');
  if (invalid) ta.classList.add('dk-textarea-invalid');
  ta.rows = rows;
  if (placeholder) ta.placeholder = placeholder;
  if (value) ta.value = value;
  if (disabled) ta.disabled = true;
  return ta;
}
