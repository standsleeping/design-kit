export const metadata = {
  name: 'CollapsibleSection',
  description: 'Collapsible section shell with sticky header; hosts body in the [data-slot="content"] slot',
  category: 'layout',
};

export const propTypes = {
  title: { type: 'string', default: 'Section' },
  count: { type: 'number', default: 0 },
  expanded: { type: 'boolean', default: false },
};

export const variants = [
  {
    name: 'collapsed',
    description: 'Default collapsed state',
    props: { title: 'Details', expanded: false },
    slots: {
      content: { component: 'MenuItem', props: { label: 'Hidden until expanded' } },
    },
  },
  {
    name: 'expanded',
    description: 'Open showing its children',
    props: { title: 'Sections', expanded: true },
    slots: {
      content: [
        { component: 'MenuItem', props: { label: 'Overview' } },
        { component: 'MenuItem', props: { label: 'Details' } },
      ],
    },
  },
  {
    name: 'with-count',
    description: 'Count badge beside the title',
    props: { title: 'Filters', count: 7, expanded: true },
    slots: {
      content: { component: 'MenuItem', props: { label: 'Filter A' } },
    },
  },
];

export function render(props = {}) {
  const title = props.title ?? propTypes.title.default;
  const count = props.count ?? propTypes.count.default;
  let expanded = props.expanded ?? propTypes.expanded.default;

  const root = document.createElement('div');
  root.className = `dk-collapsible-section${expanded ? ' dk-collapsible-section-expanded' : ''}`;

  const header = document.createElement('button');
  header.type = 'button';
  header.className = 'dk-collapsible-section-header';
  header.setAttribute('aria-expanded', String(expanded));

  const icon = document.createElement('span');
  icon.className = 'dk-collapsible-section-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = expanded ? '\u25BC' : '\u25B6';

  const titleEl = document.createElement('span');
  titleEl.className = 'dk-collapsible-section-title';
  titleEl.textContent = title;

  header.append(icon, titleEl);

  if (count) {
    const countEl = document.createElement('span');
    countEl.className = 'dk-collapsible-section-count';
    countEl.textContent = String(count);
    header.append(countEl);
  }

  const content = document.createElement('div');
  content.className = 'dk-collapsible-section-content';
  content.dataset.slot = 'content';
  if (!expanded) content.hidden = true;

  root.append(header, content);

  header.addEventListener('click', () => {
    expanded = !expanded;
    root.classList.toggle('dk-collapsible-section-expanded', expanded);
    header.setAttribute('aria-expanded', String(expanded));
    icon.textContent = expanded ? '\u25BC' : '\u25B6';
    content.hidden = !expanded;
    root.dispatchEvent(new CustomEvent('collapsible-section:toggle', {
      bubbles: true,
      detail: { expanded },
    }));
  });

  return root;
}
