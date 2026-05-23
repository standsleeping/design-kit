export const metadata = {
  name: 'Topbar',
  description: 'Chrome strip: fixed-height bar with optional title, used as the top or bottom rail of any content region (AppShell main, Sidebar slot, page-local main-wrap, icon rail). All strips that share --layout-chrome-bar-h on the same y-axis form a peer rail.',
  category: 'layout',
};

export const propTypes = {
  side: { type: 'enum', default: 'top', options: ['top', 'bottom'] },
  title: { type: 'string', default: '' },
  subtitle: { type: 'string', default: '' },
  titleStyle: { type: 'enum', default: 'default', options: ['default', 'eyebrow'] },
};

export const variants = [
  {
    name: 'titled',
    description: 'Default top bar with a title (mono semibold, full text size)',
    props: { title: 'Workspace' },
  },
  {
    name: 'titled-with-subtitle',
    description: 'Title + supplementary subtitle (e.g. session metadata)',
    props: { title: 'Session', subtitle: 'scroll, click, switch tabs' },
  },
  {
    name: 'eyebrow',
    description: '2xs uppercase muted title: for "this strip names a region" use',
    props: { title: 'Lorem ipsum', titleStyle: 'eyebrow' },
  },
  {
    name: 'empty',
    description: 'Empty placeholder strip: e.g. the icon-rail header above its destinations',
    props: {},
  },
  {
    name: 'bottom',
    description: 'Bottom rail variant: border swaps from bottom to top so it separates the strip from content above',
    props: { side: 'bottom' },
  },
];

/**
 * @param {{ side?: 'top' | 'bottom', title?: string, subtitle?: string, titleStyle?: 'default' | 'eyebrow' }} [props]
 * @returns {HTMLElement}
 */
export function render(props = {}) {
  const side = props.side ?? propTypes.side.default;
  const title = props.title ?? propTypes.title.default;
  const subtitle = props.subtitle ?? propTypes.subtitle.default;
  const titleStyle = props.titleStyle ?? propTypes.titleStyle.default;

  const root = document.createElement(side === 'bottom' ? 'footer' : 'header');
  root.className = 'dk-topbar';
  if (side === 'bottom') root.classList.add('dk-topbar-bottom');

  if (title) {
    const titleEl = document.createElement('span');
    titleEl.className = 'dk-topbar-title';
    if (titleStyle === 'eyebrow') titleEl.classList.add('dk-topbar-title-eyebrow');
    titleEl.textContent = title;
    root.append(titleEl);
  }

  if (subtitle) {
    const subEl = document.createElement('span');
    subEl.className = 'dk-topbar-subtitle';
    subEl.textContent = subtitle;
    root.append(subEl);
  }

  return root;
}
