export const metadata = {
  name: 'BottomTabBar',
  description: 'Bottom navigation tab bar for narrow viewports',
  category: 'navigation',
};

export const propTypes = {
  tabs: { type: 'array', default: [] },
  active: { type: 'string', default: '' },
};

export const variants = [
  {
    name: 'three-tabs',
    description: 'Three primary destinations',
    props: {
      active: 'home',
      tabs: [
        { id: 'home', label: 'Home' },
        { id: 'search', label: 'Search' },
        { id: 'profile', label: 'Profile' },
      ],
    },
  },
  {
    name: 'four-tabs',
    description: 'Four destinations with second active',
    props: {
      active: 'inbox',
      tabs: [
        { id: 'feed', label: 'Feed' },
        { id: 'inbox', label: 'Inbox' },
        { id: 'groups', label: 'Groups' },
        { id: 'more', label: 'More' },
      ],
    },
  },
];

export function render(props = {}) {
  const tabs = props.tabs ?? propTypes.tabs.default;
  let active = props.active ?? propTypes.active.default;

  const root = document.createElement('nav');
  root.className = 'dk-bottom-tab-bar';
  root.setAttribute('role', 'tablist');

  const buttons = tabs.map((tab) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `dk-bottom-tab-bar-tab${tab.id === active ? ' dk-bottom-tab-bar-tab-active' : ''}`;
    btn.dataset.tab = tab.id;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', String(tab.id === active));
    btn.textContent = tab.label ?? tab.id;
    btn.addEventListener('click', () => {
      if (tab.id === active) return;
      active = tab.id;
      for (const b of buttons) {
        const isActive = b.dataset.tab === active;
        b.classList.toggle('dk-bottom-tab-bar-tab-active', isActive);
        b.setAttribute('aria-selected', String(isActive));
      }
      root.dispatchEvent(new CustomEvent('bottom-tab-bar:change', {
        bubbles: true,
        detail: { tab: active },
      }));
    });
    return btn;
  });

  for (const btn of buttons) root.append(btn);
  return root;
}
