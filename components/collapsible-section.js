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

/**
 * @param {{ title?: string, count?: number, expanded?: boolean }} [props]
 * @returns {HTMLDetailsElement}
 */
export function render(props = {}) {
  const title = props.title ?? propTypes.title.default;
  const count = props.count ?? propTypes.count.default;
  const expanded = props.expanded ?? propTypes.expanded.default;

  const root = document.createElement('details');
  root.className = 'dk-collapsible-section';
  root.open = expanded;

  const header = document.createElement('summary');
  header.className = 'dk-collapsible-section-header';

  const icon = document.createElement('span');
  icon.className = 'dk-collapsible-section-icon';
  icon.setAttribute('aria-hidden', 'true');

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

  root.append(header, content);

  return root;
}
