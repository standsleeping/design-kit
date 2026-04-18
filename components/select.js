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

function normalizeOptions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((opt) => {
      if (typeof opt === 'string') return { value: opt, label: opt };
      if (opt && typeof opt === 'object') {
        const value = opt.value ?? opt.label ?? '';
        const label = opt.label ?? opt.value ?? '';
        return { value: String(value), label: String(label) };
      }
      return null;
    })
    .filter(Boolean);
}

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
    root.dispatchEvent(new CustomEvent('select:change', {
      bubbles: true,
      detail: { value: event.target.value },
    }));
  });

  return root;
}
