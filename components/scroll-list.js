export const metadata = {
  name: 'ScrollList',
  description: 'Vertical list with hover/selected backgrounds inside a permanent tinted-rail scroll container',
  category: 'navigation',
};

export const propTypes = {
  items: { type: 'array', default: [] },
  selectedIndex: { type: 'number', default: -1 },
  height: { type: 'string', default: '320px' },
};

const sample = [
  'Resource', 'Sandbox', 'Session', 'Tool', 'Schema',
  'Adapter', 'Binding', 'Channel', 'Driver', 'Endpoint',
  'Filter', 'Gateway', 'Handler', 'Index', 'Job',
  'Kernel', 'Loader', 'Module', 'Namespace', 'Operator',
];

export const variants = [
  {
    name: 'default',
    description: 'Tall list with a selected row, content overflows so the rail is in use',
    props: { items: sample, selectedIndex: 2, height: '320px' },
  },
  {
    name: 'short',
    description: 'Content fits without overflow; rail still reserves space so layout never shifts',
    props: { items: sample.slice(0, 4), selectedIndex: 2, height: '320px' },
  },
  {
    name: 'no-selection',
    description: 'Hover-only state, no row pre-selected',
    props: { items: sample, selectedIndex: -1, height: '320px' },
  },
];

export function render(props = {}) {
  const items = props.items ?? propTypes.items.default;
  const selectedIndex = props.selectedIndex ?? propTypes.selectedIndex.default;
  const height = props.height ?? propTypes.height.default;

  const root = document.createElement('div');
  root.className = 'dk-scroll-list';
  root.setAttribute('role', 'listbox');
  root.style.height = height;

  items.forEach((item, i) => {
    const label = typeof item === 'string' ? item : (item.label ?? '');
    const disabled = typeof item === 'object' && item.disabled === true;
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'dk-scroll-list-item';
    row.setAttribute('role', 'option');
    row.textContent = label;
    if (i === selectedIndex) row.setAttribute('aria-selected', 'true');
    if (disabled) row.disabled = true;

    row.addEventListener('click', () => {
      if (disabled) return;
      root.querySelectorAll('[aria-selected="true"]').forEach((el) => {
        el.setAttribute('aria-selected', 'false');
      });
      row.setAttribute('aria-selected', 'true');
      root.dispatchEvent(new CustomEvent('scroll-list:select', {
        bubbles: true,
        detail: { label, index: i },
      }));
    });

    root.append(row);
  });

  return root;
}
