export const metadata = {
  name: 'FormLayout',
  description: 'Grid form layout shell; hosts rows in the [data-slot="rows"] slot',
  category: 'layout',
};

export const propTypes = {
  columns: { type: 'number', default: 2 },
  label: { type: 'string', default: '' },
};

export const variants = [
  {
    name: 'two-column',
    description: 'Two-column form',
    props: { columns: 2 },
    slots: {
      rows: [
        {
          component: 'FieldRow',
          props: { label: 'Name' },
          slots: { control: { component: 'TextInput', props: { value: 'Alice' } } },
        },
        {
          component: 'FieldRow',
          props: { label: 'Email' },
          slots: { control: { component: 'TextInput', props: { type: 'email', value: 'alice@example.com' } } },
        },
        {
          component: 'FieldRow',
          props: { label: 'Role' },
          slots: {
            control: {
              component: 'Select',
              props: { options: ['Admin', 'Editor', 'Viewer'], value: 'Editor' },
            },
          },
        },
        {
          component: 'FieldRow',
          props: { label: 'Notifications' },
          slots: { control: { component: 'Checkbox', props: { checked: true } } },
        },
      ],
    },
  },
  {
    name: 'with-label',
    description: 'Labeled form section',
    props: { columns: 2, label: 'Profile' },
    slots: {
      rows: [
        {
          component: 'FieldRow',
          props: { label: 'Display name' },
          slots: { control: { component: 'TextInput', props: { value: 'alice' } } },
        },
        {
          component: 'FieldRow',
          props: { label: 'Quota' },
          slots: { control: { component: 'Range', props: { value: 70 } } },
        },
      ],
    },
  },
  {
    name: 'single-column',
    description: 'Single-column form',
    props: { columns: 1 },
    slots: {
      rows: [
        {
          component: 'FieldRow',
          props: { label: 'Search' },
          slots: { control: { component: 'TextInput', props: { type: 'search', placeholder: 'Find…' } } },
        },
      ],
    },
  },
];

export function render(props = {}) {
  const columns = props.columns ?? propTypes.columns.default;
  const label = props.label ?? propTypes.label.default;

  const root = document.createElement('div');
  root.className = 'dk-form-layout';
  root.style.setProperty('--dk-form-columns', String(columns));

  if (label) {
    const labelEl = document.createElement('div');
    labelEl.className = 'dk-form-layout-label';
    labelEl.textContent = label;
    root.append(labelEl);
  }

  const rowsSlot = document.createElement('div');
  rowsSlot.className = 'dk-form-layout-rows';
  rowsSlot.dataset.slot = 'rows';
  root.append(rowsSlot);

  return root;
}
