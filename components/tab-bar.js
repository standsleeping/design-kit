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

export function render(props = {}) {
  const tabs = props.tabs ?? propTypes.tabs.default;
  let active = props.active ?? propTypes.active.default;

  const root = document.createElement('div');
  root.className = 'dk-tab-bar';
  root.setAttribute('role', 'tablist');

  const buttons = [];
  tabs.forEach((tab, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `dk-tab-bar-tab${tab.id === active ? ' dk-tab-bar-tab-active' : ''}`;
    btn.dataset.tab = tab.id;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', String(tab.id === active));
    btn.textContent = tab.label ?? tab.id;
    btn.addEventListener('click', () => {
      if (tab.id === active) return;
      active = tab.id;
      for (const b of buttons) {
        const isActive = b.dataset.tab === active;
        b.classList.toggle('dk-tab-bar-tab-active', isActive);
        b.setAttribute('aria-selected', String(isActive));
      }
      root.dispatchEvent(new CustomEvent('tab-bar:change', {
        bubbles: true,
        detail: { tab: active },
      }));
    });
    buttons.push(btn);
    root.append(btn);

    if (i < tabs.length - 1) {
      const sep = document.createElement('span');
      sep.className = 'dk-tab-bar-separator';
      sep.setAttribute('aria-hidden', 'true');
      sep.textContent = '\u00B7';
      root.append(sep);
    }
  });

  return root;
}
