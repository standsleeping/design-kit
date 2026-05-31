export const metadata = {
  name: 'ExpandableCard',
  description: 'Expandable card shell with title, count badge, and optional disabled state; hosts body in [data-slot="content"]',
  category: 'layout',
};

export const propTypes = {
  title: { type: 'string', default: 'Section' },
  count: { type: 'number', default: 0 },
  expanded: { type: 'boolean', default: false },
  disabled: { type: 'boolean', default: false },
};

export const variants = [
  {
    name: 'collapsed',
    description: 'Default collapsed state',
    props: { title: 'Filters', count: 3 },
    slots: {
      content: { component: 'MenuItem', props: { label: 'Hidden until expanded' } },
    },
  },
  {
    name: 'expanded',
    description: 'Open showing its children',
    props: { title: 'Sections', count: 5, expanded: true },
    slots: {
      content: [
        { component: 'MenuItem', props: { label: 'Overview' } },
        { component: 'MenuItem', props: { label: 'Details' } },
      ],
    },
  },
  {
    name: 'disabled',
    description: 'Card is unavailable',
    props: { title: 'Archived', count: 12, disabled: true },
    slots: {
      content: { component: 'MenuItem', props: { label: 'Inert content' } },
    },
  },
];

/**
 * @param {{ title?: string, count?: number, expanded?: boolean, disabled?: boolean }} [props]
 * @returns {HTMLDetailsElement}
 */
export function render(props = {}) {
  const title = props.title ?? propTypes.title.default;
  const count = props.count ?? propTypes.count.default;
  const expanded = props.expanded ?? propTypes.expanded.default;
  const disabled = props.disabled ?? propTypes.disabled.default;

  const root = document.createElement('details');
  root.className = disabled ? 'dk-expandable-card dk-expandable-card-disabled' : 'dk-expandable-card';
  root.open = expanded;

  const header = document.createElement('summary');
  header.className = 'dk-expandable-card-header';

  const icon = document.createElement('span');
  icon.className = 'dk-expandable-card-icon';
  icon.setAttribute('aria-hidden', 'true');
  if (disabled) icon.textContent = '—';

  const titleEl = document.createElement('span');
  titleEl.className = 'dk-expandable-card-title';
  titleEl.textContent = title;

  const countEl = document.createElement('span');
  countEl.className = 'dk-expandable-card-count';
  countEl.textContent = String(count);

  header.append(icon, titleEl, countEl);

  const content = document.createElement('div');
  content.className = 'dk-expandable-card-content';
  content.dataset.slot = 'content';

  root.append(header, content);

  // <details> has no native disabled state; cancel the summary toggle when disabled.
  if (disabled) header.addEventListener('click', (event) => event.preventDefault());

  return root;
}
