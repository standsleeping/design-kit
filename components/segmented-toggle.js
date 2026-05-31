export const metadata = {
  name: 'SegmentedToggle',
  description: 'Segmented toggle for mutually exclusive options',
  category: 'controls',
};

export const propTypes = {
  options: { type: 'array', default: [] },
  active: { type: 'string', default: '' },
};

export const variants = [
  {
    name: 'default',
    description: 'Three-option period selector',
    props: {
      options: [
        { id: 'months', label: 'Months' },
        { id: 'weeks', label: 'Weeks' },
        { id: 'days', label: 'Days' },
      ],
      active: 'months',
    },
  },
  {
    name: 'binary',
    description: 'Two-option toggle',
    props: {
      options: [
        { id: 'list', label: 'List' },
        { id: 'grid', label: 'Grid' },
      ],
      active: 'list',
    },
  },
  {
    name: 'narrow-box',
    description: 'Many long options in a narrow host — scrolls horizontally as a boundary scroller',
    props: {
      options: [
        { id: 'yesterday', label: 'Yesterday' },
        { id: 'last-7-days', label: 'Last 7 Days' },
        { id: 'last-30-days', label: 'Last 30 Days' },
        { id: 'last-quarter', label: 'Last Quarter' },
        { id: 'year-to-date', label: 'Year to Date' },
        { id: 'all-time', label: 'All Time' },
      ],
      active: 'last-30-days',
    },
  },
];

let groupCounter = 0;

/**
 * @typedef {{ id: string, label?: string }} SegmentedOption
 * @param {{ options?: SegmentedOption[], active?: string }} [props]
 * @returns {HTMLDivElement}
 */
export function render(props = {}) {
  const options = props.options ?? propTypes.options.default;
  const active = props.active ?? propTypes.active.default;
  const group = `dk-segmented-toggle-${groupCounter++}`;

  const root = document.createElement('div');
  root.className = 'dk-segmented-toggle';
  root.setAttribute('role', 'radiogroup');

  options.forEach((opt, i) => {
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = group;
    input.id = `${group}-${i}`;
    input.className = 'dk-segmented-toggle-input';
    input.value = opt.id;
    input.checked = opt.id === active;

    const label = document.createElement('label');
    label.className = 'dk-segmented-toggle-button';
    label.htmlFor = input.id;
    label.textContent = opt.label ?? opt.id;

    root.append(input, label);
  });

  return root;
}
