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
  {
    name: 'narrow-box-long-labels',
    description: 'Five tabs with long labels in a narrow box — ellipsis degrades gracefully',
    props: {
      active: 'notifications',
      tabs: [
        { id: 'home', label: 'Home Feed' },
        { id: 'notifications', label: 'Notifications' },
        { id: 'messages', label: 'Messages' },
        { id: 'bookmarks', label: 'Bookmarks' },
        { id: 'settings', label: 'Settings' },
      ],
    },
  },
];

let groupCounter = 0;

/**
 * @typedef {{ id: string, label?: string }} BottomTab
 * @param {{ tabs?: BottomTab[], active?: string }} [props]
 * @returns {HTMLElement}
 */
export function render(props = {}) {
  const tabs = props.tabs ?? propTypes.tabs.default;
  const active = props.active ?? propTypes.active.default;
  const group = `dk-bottom-tab-bar-${groupCounter++}`;

  const root = document.createElement('nav');
  root.className = 'dk-bottom-tab-bar';
  root.setAttribute('role', 'radiogroup');

  tabs.forEach((tab, i) => {
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = group;
    input.id = `${group}-${i}`;
    input.className = 'dk-bottom-tab-bar-input';
    input.value = tab.id;
    input.checked = tab.id === active;

    const label = document.createElement('label');
    label.className = 'dk-bottom-tab-bar-tab';
    label.htmlFor = input.id;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'dk-bottom-tab-bar-label';
    labelSpan.textContent = tab.label ?? tab.id;
    label.append(labelSpan);

    root.append(input, label);
  });

  return root;
}
