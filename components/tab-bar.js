export const metadata = {
  name: 'TabBar',
  description: 'Horizontal tab bar with dot separators and an underline on the active tab',
  category: 'navigation',
};

export const propTypes = {
  tabs: { type: 'array', default: [] },
  active: { type: 'string', default: '' },
};

export const variants = [
  {
    name: 'three-tabs',
    description: 'Three tabs, first active',
    props: {
      active: 'overview',
      tabs: [
        { id: 'overview', label: 'Overview' },
        { id: 'api', label: 'API' },
        { id: 'examples', label: 'Examples' },
      ],
    },
  },
  {
    name: 'five-tabs',
    description: 'Five tabs, middle active',
    props: {
      active: 'roadmap',
      tabs: [
        { id: 'summary', label: 'Summary' },
        { id: 'details', label: 'Details' },
        { id: 'roadmap', label: 'Roadmap' },
        { id: 'history', label: 'History' },
        { id: 'notes', label: 'Notes' },
      ],
    },
  },
  {
    name: 'two-tabs',
    description: 'Minimal two-tab switch',
    props: {
      active: 'json',
      tabs: [
        { id: 'json', label: 'JSON' },
        { id: 'yaml', label: 'YAML' },
      ],
    },
  },
];

let groupCounter = 0;

/**
 * @typedef {{ id: string, label?: string }} Tab
 * @param {{ tabs?: Tab[], active?: string }} [props]
 * @returns {HTMLDivElement}
 */
export function render(props = {}) {
  const tabs = props.tabs ?? propTypes.tabs.default;
  const active = props.active ?? propTypes.active.default;
  const group = `dk-tab-bar-${groupCounter++}`;

  const root = document.createElement('div');
  root.className = 'dk-tab-bar';
  root.setAttribute('role', 'radiogroup');

  tabs.forEach((tab, i) => {
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = group;
    input.id = `${group}-${i}`;
    input.className = 'dk-tab-bar-input';
    input.value = tab.id;
    input.checked = tab.id === active;

    const label = document.createElement('label');
    label.className = 'dk-tab-bar-tab';
    label.htmlFor = input.id;
    label.textContent = tab.label ?? tab.id;

    root.append(input, label);

    if (i < tabs.length - 1) {
      const sep = document.createElement('span');
      sep.className = 'dk-tab-bar-separator';
      sep.setAttribute('aria-hidden', 'true');
      sep.textContent = '·';
      root.append(sep);
    }
  });

  return root;
}
