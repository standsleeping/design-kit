export const metadata = {
  name: 'PageHeader',
  description: 'Plain page header (mono title + optional subtitle), borderless, gap-driven',
  category: 'display',
};

export const propTypes = {
  title: { type: 'string', default: '' },
  subtitle: { type: 'string', default: '' },
};

export const variants = [
  {
    name: 'title-and-subtitle',
    description: 'Title above a short contextual subtitle',
    props: {
      title: 'Component Preview',
      subtitle: 'Inventory of every component in the kit, rendered live.',
    },
  },
  {
    name: 'title-only',
    description: 'Title with no subtitle',
    props: { title: 'Settings' },
  },
];

/**
 * @param {{ title?: string, subtitle?: string }} [props]
 * @returns {HTMLElement}
 */
export function render(props = {}) {
  const title = props.title ?? propTypes.title.default;
  const subtitle = props.subtitle ?? propTypes.subtitle.default;

  const root = document.createElement('header');
  root.className = 'dk-page-header';

  if (title) {
    const t = document.createElement('div');
    t.className = 'dk-page-header-title';
    t.textContent = title;
    root.append(t);
  }

  if (subtitle) {
    const s = document.createElement('div');
    s.className = 'dk-page-header-subtitle';
    s.textContent = subtitle;
    root.append(s);
  }

  return root;
}
