export const metadata = {
  name: 'NavRow',
  description: 'Sidebar row with primary label, optional inline meta, and trailing meta that drops to its own left-flush line below 200px container width',
  category: 'navigation',
};

export const propTypes = {
  label: { type: 'string', default: 'item' },
  meta: { type: 'string', default: '' },
  trailing: { type: 'string', default: '' },
  href: { type: 'string', default: '#' },
};

export const variants = [
  {
    name: 'label-only',
    description: 'Plain row with no secondary content',
    props: { label: 'agents' },
  },
  {
    name: 'label-and-meta',
    description: 'Inline meta sits next to the label',
    props: { label: 'agents', meta: '(9)' },
  },
  {
    name: 'label-and-trailing',
    description: 'Trailing meta hugs the right edge; wraps to its own line below 200px',
    props: { label: 'agents', trailing: '5 · 12' },
  },
  {
    name: 'all-three',
    description: 'Label plus inline meta plus trailing meta: the full pattern',
    props: { label: 'agents', meta: '(9)', trailing: '5 · 12' },
  },
  {
    name: 'long-label',
    description: 'Long label demonstrates wrap behavior at typical sidebar widths',
    props: { label: 'dozen-problems', meta: '(0)', trailing: '0 · 3' },
  },
];

/**
 * @param {{ label?: string, meta?: string, trailing?: string, href?: string }} [props]
 * @returns {HTMLAnchorElement}
 */
export function render(props = {}) {
  const label = props.label ?? propTypes.label.default;
  const meta = props.meta ?? propTypes.meta.default;
  const trailing = props.trailing ?? propTypes.trailing.default;
  const href = props.href ?? propTypes.href.default;

  const root = document.createElement('a');
  root.className = 'dk-nav-row';
  root.href = href;

  const labelEl = document.createElement('span');
  labelEl.className = 'dk-nav-row-label';
  labelEl.textContent = label;
  root.append(labelEl);

  if (meta) {
    const metaEl = document.createElement('span');
    metaEl.className = 'dk-nav-row-meta';
    metaEl.textContent = meta;
    root.append(metaEl);
  }

  if (trailing) {
    const trailingEl = document.createElement('span');
    trailingEl.className = 'dk-nav-row-trailing';
    trailingEl.textContent = trailing;
    root.append(trailingEl);
  }

  root.addEventListener('click', (event) => {
    event.preventDefault();
    root.dispatchEvent(new CustomEvent('nav-row:select', {
      bubbles: true,
      detail: { label, meta, trailing },
    }));
  });

  return root;
}
