export const metadata = {
  name: 'TitleBlock',
  description: 'Document identity block in the standards-manual tradition; optional [data-slot="supplementary"] below',
  category: 'display',
};

export const propTypes = {
  docTitle: { type: 'string', default: '' },
  identifier: { type: 'string', default: '' },
  revision: { type: 'string', default: '' },
  date: { type: 'string', default: '' },
  author: { type: 'string', default: '' },
  status: { type: 'string', default: '' },
};

export const variants = [
  {
    name: 'full',
    description: 'All metadata fields present',
    props: {
      docTitle: 'Component Preview Unification',
      identifier: 'DK-PLAN-042',
      revision: 'R3',
      date: '2026-04-16',
      author: 'standsleeping',
      status: 'draft',
    },
  },
  {
    name: 'minimal',
    description: 'Title only',
    props: { docTitle: 'Untitled Document' },
  },
  {
    name: 'with-status',
    description: 'Title plus status chip',
    props: { docTitle: 'Release Notes 4.6', status: 'published' },
  },
];

export function render(props = {}) {
  const docTitle = props.docTitle ?? propTypes.docTitle.default;
  const identifier = props.identifier ?? propTypes.identifier.default;
  const revision = props.revision ?? propTypes.revision.default;
  const date = props.date ?? propTypes.date.default;
  const author = props.author ?? propTypes.author.default;
  const status = props.status ?? propTypes.status.default;

  const root = document.createElement('div');
  root.className = 'dk-title-block-wrapper';

  const block = document.createElement('div');
  block.className = 'dk-title-block';
  root.append(block);

  if (docTitle) {
    const titleField = document.createElement('div');
    titleField.className = 'dk-title-block-field dk-title-block-title';

    const label = document.createElement('div');
    label.className = 'dk-title-block-label';
    label.textContent = 'TITLE';

    const value = document.createElement('div');
    value.className = 'dk-title-block-value';
    value.textContent = docTitle;

    titleField.append(label, value);
    block.append(titleField);
  }

  const metaFields = [
    identifier ? { label: 'ID', value: identifier } : null,
    revision ? { label: 'REV', value: revision } : null,
    date ? { label: 'DATE', value: date } : null,
    author ? { label: 'AUTHOR', value: author } : null,
    status ? { label: 'STATUS', value: status } : null,
  ].filter(Boolean);

  if (metaFields.length > 0) {
    const meta = document.createElement('div');
    meta.className = 'dk-title-block-meta';
    for (const field of metaFields) {
      const wrap = document.createElement('div');
      wrap.className = 'dk-title-block-field';

      const label = document.createElement('div');
      label.className = 'dk-title-block-label';
      label.textContent = field.label;

      const value = document.createElement('div');
      value.className = 'dk-title-block-value';
      value.textContent = field.value;

      wrap.append(label, value);
      meta.append(wrap);
    }
    block.append(meta);
  }

  const supplementary = document.createElement('div');
  supplementary.className = 'dk-title-block-supplementary';
  supplementary.dataset.slot = 'supplementary';
  root.append(supplementary);

  return root;
}
