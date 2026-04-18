export const metadata = {
  name: 'Toc',
  description: 'Right-rail "On this page" table of contents with active-section tracking via IntersectionObserver',
  category: 'navigation',
};

export const propTypes = {
  items: { type: 'array', default: [] },
  label: { type: 'string', default: 'On this page' },
};

export const variants = [
  {
    name: 'flat',
    description: 'Flat list of sections',
    props: {
      items: [
        { href: '#intro', label: 'Introduction', level: 0 },
        { href: '#usage', label: 'Usage', level: 0 },
        { href: '#api', label: 'API', level: 0 },
        { href: '#faq', label: 'FAQ', level: 0 },
      ],
    },
  },
  {
    name: 'nested',
    description: 'Two levels of headings',
    props: {
      items: [
        { href: '#overview', label: 'Overview', level: 0 },
        { href: '#install', label: 'Install', level: 0 },
        { href: '#install-cli', label: 'CLI', level: 1 },
        { href: '#install-lib', label: 'Library', level: 1 },
        { href: '#api', label: 'API reference', level: 0 },
        { href: '#api-render', label: 'render()', level: 1 },
        { href: '#api-propTypes', label: 'propTypes', level: 1 },
      ],
    },
  },
  {
    name: 'custom-label',
    description: 'Alternate heading label',
    props: {
      label: 'Contents',
      items: [
        { href: '#part-1', label: 'Part 1', level: 0 },
        { href: '#part-2', label: 'Part 2', level: 0 },
      ],
    },
  },
];

export function render(props = {}) {
  const items = props.items ?? propTypes.items.default;
  const label = props.label ?? propTypes.label.default;

  const root = document.createElement('nav');
  root.className = 'dk-toc';
  root.setAttribute('aria-label', label);

  const labelEl = document.createElement('div');
  labelEl.className = 'dk-toc-label';
  labelEl.textContent = label;
  root.append(labelEl);

  const listEl = document.createElement('ul');
  listEl.className = 'dk-toc-list';
  root.append(listEl);

  const itemEls = new Map();
  let activeId = '';

  for (const item of items) {
    const li = document.createElement('li');
    li.className = `dk-toc-item dk-toc-item-level-${item.level ?? 0}`;

    const link = document.createElement('a');
    link.className = 'dk-toc-link';
    link.href = item.href ?? '#';
    link.textContent = item.label ?? '';
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });

    li.append(link);
    listEl.append(li);

    const id = (item.href ?? '').replace(/^#/, '');
    if (id) itemEls.set(id, li);
  }

  const setActive = (id) => {
    if (id === activeId) return;
    activeId = id;
    for (const [itemId, li] of itemEls) {
      li.classList.toggle('dk-toc-item-active', itemId === id);
    }
    root.dispatchEvent(new CustomEvent('toc:change', {
      bubbles: true,
      detail: { activeId: id },
    }));
  };

  let observer = null;
  const ids = Array.from(itemEls.keys());
  if (ids.length > 0 && typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
          break;
        }
      }
    }, {
      rootMargin: '-10% 0px -80% 0px',
      threshold: 0,
    });
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
  }

  const cleanup = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  };

  return { node: root, cleanup };
}
