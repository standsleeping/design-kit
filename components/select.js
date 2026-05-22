export const metadata = {
  name: 'Select',
  description: 'Select control with normalized option schema',
  category: 'inputs',
};

export const propTypes = {
  value: { type: 'string', default: '' },
  options: { type: 'array', default: [] },
  disabled: { type: 'boolean', default: false },
};

export const variants = [
  {
    name: 'basic',
    description: 'Simple string options',
    props: {
      options: ['Alice', 'Bob', 'Carol'],
      value: 'Bob',
    },
  },
  {
    name: 'labeled',
    description: '{value, label} option shape',
    props: {
      options: [
        { value: 'asc', label: 'Ascending' },
        { value: 'desc', label: 'Descending' },
        { value: 'none', label: 'No sort' },
      ],
      value: 'asc',
    },
  },
  {
    name: 'disabled',
    description: 'Disabled state',
    props: {
      options: ['Option A', 'Option B'],
      value: 'Option A',
      disabled: true,
    },
  },
];

/**
 * @param {unknown} raw
 * @returns {Array<{ value: string, label: string }>}
 */
function normalizeOptions(raw) {
  if (!Array.isArray(raw)) return [];
  /** @type {Array<{ value: string, label: string }>} */
  const result = [];
  for (const opt of raw) {
    if (typeof opt === 'string') {
      result.push({ value: opt, label: opt });
    } else if (opt && typeof opt === 'object') {
      const o = /** @type {Record<string, unknown>} */ (opt);
      const value = String(o['value'] ?? o['label'] ?? '');
      const label = String(o['label'] ?? o['value'] ?? '');
      result.push({ value, label });
    }
  }
  return result;
}

/**
 * @param {{ value?: string, options?: unknown, disabled?: boolean }} [props]
 * @returns {HTMLSelectElement}
 */
export function render(props = {}) {
  const value = props.value ?? propTypes.value.default;
  const disabled = props.disabled ?? propTypes.disabled.default;
  const options = normalizeOptions(props.options ?? propTypes.options.default);

  const root = document.createElement('select');
  root.className = 'dk-select';
  root.disabled = disabled;

  for (const option of options) {
    const opt = document.createElement('option');
    opt.value = option.value;
    opt.textContent = option.label;
    if (option.value === value) opt.selected = true;
    root.append(opt);
  }

  root.addEventListener('change', (event) => {
    const target = /** @type {HTMLSelectElement} */ (event.target);
    root.dispatchEvent(new CustomEvent('select:change', {
      bubbles: true,
      detail: { value: target.value },
    }));
  });

  return root;
}
