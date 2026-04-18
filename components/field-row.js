export const metadata = {
  name: 'FieldRow',
  description: 'Label + control row shell; hosts one control in the [data-slot="control"] slot',
  category: 'controls',
};

export const propTypes = {
  label: { type: 'string', default: 'Setting' },
  compact: { type: 'boolean', default: false },
  disabled: { type: 'boolean', default: false },
};

export const variants = [
  {
    name: 'text',
    description: 'Field row hosting a text input',
    props: { label: 'Name' },
    slots: {
      control: { component: 'TextInput', props: { value: 'Alice' } },
    },
  },
  {
    name: 'select',
    description: 'Field row hosting a select',
    props: { label: 'Sort order' },
    slots: {
      control: {
        component: 'Select',
        props: {
          options: [
            { value: 'asc', label: 'Ascending' },
            { value: 'desc', label: 'Descending' },
          ],
          value: 'asc',
        },
      },
    },
  },
  {
    name: 'checkbox',
    description: 'Field row hosting a checkbox',
    props: { label: 'Notifications' },
    slots: {
      control: { component: 'Checkbox', props: { checked: true } },
    },
  },
  {
    name: 'compact',
    description: 'Compact density',
    props: { label: 'Tight row', compact: true },
    slots: {
      control: { component: 'NumberInput', props: { value: 42 } },
    },
  },
  {
    name: 'disabled',
    description: 'Disabled state',
    props: { label: 'Read-only', disabled: true },
    slots: {
      control: { component: 'TextInput', props: { value: 'Locked', disabled: true } },
    },
  },
];

export function render(props = {}) {
  const label = props.label ?? propTypes.label.default;
  const compact = props.compact ?? propTypes.compact.default;
  const disabled = props.disabled ?? propTypes.disabled.default;

  const root = document.createElement('div');
  const classes = ['dk-field-row'];
  if (compact) classes.push('dk-field-row-compact');
  if (disabled) classes.push('dk-field-row-disabled');
  root.className = classes.join(' ');

  const labelEl = document.createElement('span');
  labelEl.className = 'dk-field-row-label';
  labelEl.textContent = label;

  const slot = document.createElement('span');
  slot.className = 'dk-field-row-control';
  slot.dataset.slot = 'control';

  root.append(labelEl, slot);
  return root;
}
