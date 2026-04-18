export const metadata = {
  name: 'Breadcrumb',
  description: 'Breadcrumb navigation with monospace separators',
  category: 'navigation',
};

export const propTypes = {
  items: { type: 'array', default: [] },
  separator: { type: 'string', default: '>' },
};

export const variants = [
  {
    name: 'default',
    description: 'Three-level path',
    props: {
      items: [
        { label: 'Home', href: '#' },
        { label: 'Docs', href: '#' },
        { label: 'Component Contract' },
      ],
    },
  },
  {
    name: 'two-level',
    description: 'Shallow path',
    props: {
      items: [
        { label: 'Projects', href: '#' },
        { label: 'Acme' },
      ],
    },
  },
];

export function render(props = {}) {
  const items = props.items ?? propTypes.items.default;
  const separator = props.separator ?? propTypes.separator.default;

  const root = document.createElement('nav');
  root.className = 'dk-breadcrumb';
  root.setAttribute('aria-label', 'Breadcrumb');

  items.forEach((item, i) => {
    const isLast = i === items.length - 1;
    const crumb = isLast
      ? document.createElement('span')
      : document.createElement('a');
    crumb.className = 'dk-breadcrumb-crumb';
    crumb.textContent = item.label ?? '';
    if (isLast) {
      crumb.classList.add('dk-breadcrumb-current');
      crumb.setAttribute('aria-current', 'page');
    } else {
      crumb.href = item.href ?? '#';
      crumb.addEventListener('click', (event) => {
        root.dispatchEvent(new CustomEvent('breadcrumb:navigate', {
          bubbles: true,
          detail: { label: item.label, href: item.href, index: i },
        }));
      });
    }
    root.append(crumb);

    if (!isLast) {
      const sep = document.createElement('span');
      sep.className = 'dk-breadcrumb-separator';
      sep.setAttribute('aria-hidden', 'true');
      sep.textContent = ` ${separator} `;
      root.append(sep);
    }
  });

  return root;
}
