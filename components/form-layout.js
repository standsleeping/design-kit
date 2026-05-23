export const metadata = {
  name: 'FormLayout',
  description: 'Grid form layout shell; hosts rows in the [data-slot="rows"] slot',
  category: 'layout',
};

export const propTypes = {
  label: { type: 'string', default: '' },
};

export const variants = [
  {
    name: 'two-column',
    description: 'Two-column form',
    props: {},
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
    props: { label: 'Profile' },
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
    props: {},
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
  {
    name: 'narrow-box',
    description: 'Narrow container — columns collapse to one via auto-fit (drag the width control narrow)',
    props: {},
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
      ],
    },
  },
];

/**
 * @param {{ label?: string }} [props]
 * @returns {HTMLDivElement}
 */
export function render(props = {}) {
  const label = props.label ?? propTypes.label.default;

  const root = document.createElement('div');
  root.className = 'dk-form-layout';

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
