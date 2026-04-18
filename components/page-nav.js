export const metadata = {
  name: 'PageNav',
  description: 'Previous/next page navigation links anchored left and right',
  category: 'navigation',
};

export const propTypes = {
  prev: { type: 'object', default: null },
  next: { type: 'object', default: null },
};

export const variants = [
  {
    name: 'both',
    description: 'Both previous and next present',
    props: {
      prev: { label: 'Operational principle', href: '#prev', subtitle: 'Section 3.2' },
      next: { label: 'Actions', href: '#next', subtitle: 'Section 3.4' },
    },
  },
  {
    name: 'only-next',
    description: 'First page in a series — next only',
    props: {
      next: { label: 'Getting started', href: '#next', subtitle: 'Chapter 1' },
    },
  },
  {
    name: 'only-prev',
    description: 'Last page in a series — previous only',
    props: {
      prev: { label: 'Summary', href: '#prev', subtitle: 'Chapter 8' },
    },
  },
  {
    name: 'no-subtitle',
    description: 'Label only, no subtitle',
    props: {
      prev: { label: 'Genericity review', href: '#prev' },
      next: { label: 'Naming review', href: '#next' },
    },
  },
];

function renderLink(link, direction) {
  if (!link || !link.label || !link.href) {
    const placeholder = document.createElement('span');
    placeholder.className = 'dk-page-nav-link dk-page-nav-link-placeholder';
    return placeholder;
  }
  const anchor = document.createElement('a');
  anchor.className = `dk-page-nav-link dk-page-nav-link-${direction}`;
  anchor.href = link.href;

  const dir = document.createElement('span');
  dir.className = 'dk-page-nav-direction';
  dir.textContent = direction === 'prev' ? '< Previous' : 'Next >';

  const label = document.createElement('span');
  label.className = 'dk-page-nav-label';
  label.textContent = link.label;

  anchor.append(dir, label);

  if (link.subtitle) {
    const subtitle = document.createElement('span');
    subtitle.className = 'dk-page-nav-subtitle';
    subtitle.textContent = link.subtitle;
    anchor.append(subtitle);
  }

  return anchor;
}

export function render(props = {}) {
  const prev = props.prev ?? propTypes.prev.default;
  const next = props.next ?? propTypes.next.default;

  const root = document.createElement('nav');
  root.className = 'dk-page-nav';
  root.setAttribute('aria-label', 'Page navigation');
  root.append(renderLink(prev, 'prev'), renderLink(next, 'next'));
  return root;
}
