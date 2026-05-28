export const metadata = {
  name: 'Panel',
  description: 'Non-collapsible bordered container with a labeled header (label + optional meta peer pair) and a content body',
  category: 'display',
};

export const propTypes = {
  label: { type: 'string', default: '' },
  meta: { type: 'string', default: '' },
  body: { type: 'string', default: '' },
};

export const variants = [
  {
    name: 'label-and-meta',
    description: 'Header with label on the left and meta on the right',
    props: {
      label: 'rem',
      meta: 'gap: 16px (fixed)',
      body: 'Prose body content.',
    },
  },
  {
    name: 'label-only',
    description: 'Header with label, no meta',
    props: {
      label: 'Notes',
      body: 'Free-form notes content.',
    },
  },
];

/**
 * @param {{ label?: string, meta?: string, body?: string }} [props]
 * @returns {HTMLDivElement}
 */
export function render(props = {}) {
  const label = props.label ?? propTypes.label.default;
  const meta = props.meta ?? propTypes.meta.default;
  const body = props.body ?? propTypes.body.default;

  const root = document.createElement('div');
  root.className = 'dk-panel';

  const header = document.createElement('div');
  header.className = 'dk-panel-header';
  if (label) {
    const l = document.createElement('span');
    l.className = 'dk-panel-label';
    l.textContent = label;
    header.append(l);
  }
  if (meta) {
    const m = document.createElement('span');
    m.className = 'dk-panel-meta';
    m.textContent = meta;
    header.append(m);
  }
  root.append(header);

  const bodyEl = document.createElement('div');
  bodyEl.className = 'dk-panel-body';
  bodyEl.textContent = body;
  root.append(bodyEl);

  return root;
}
