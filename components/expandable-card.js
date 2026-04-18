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

export function render(props = {}) {
  const title = props.title ?? propTypes.title.default;
  const count = props.count ?? propTypes.count.default;
  let expanded = props.expanded ?? propTypes.expanded.default;
  const disabled = props.disabled ?? propTypes.disabled.default;

  const root = document.createElement('div');
  const classes = ['dk-expandable-card'];
  if (expanded) classes.push('dk-expandable-card-expanded');
  if (disabled) classes.push('dk-expandable-card-disabled');
  root.className = classes.join(' ');

  const header = document.createElement('button');
  header.type = 'button';
  header.className = 'dk-expandable-card-header';
  header.setAttribute('aria-expanded', String(expanded));
  header.disabled = disabled;

  const icon = document.createElement('span');
  icon.className = 'dk-expandable-card-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = disabled ? '\u2014' : expanded ? '\u25BE' : '\u25B8';

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
  if (!expanded) content.hidden = true;

  root.append(header, content);

  header.addEventListener('click', () => {
    if (disabled) return;
    expanded = !expanded;
    root.classList.toggle('dk-expandable-card-expanded', expanded);
    icon.textContent = expanded ? '\u25BE' : '\u25B8';
    header.setAttribute('aria-expanded', String(expanded));
    content.hidden = !expanded;
    root.dispatchEvent(new CustomEvent('expandable-card:toggle', {
      bubbles: true,
      detail: { expanded },
    }));
  });

  return root;
}
