export const metadata = {
  name: 'Container',
  description: 'Layout container shell with preset configurations; hosts children in the [data-slot="content"] slot',
  category: 'layout',
};

export const propTypes = {
  preset: { type: 'enum', default: 'standard', options: ['standard', 'centered'] },
  padding: { type: 'string', default: '' },
  gap: { type: 'string', default: '' },
};

export const variants = [
  {
    name: 'standard',
    description: 'Full-width flow container',
    props: { preset: 'standard' },
    slots: {
      content: [
        { component: 'MenuItem', props: { label: 'First item' } },
        { component: 'MenuItem', props: { label: 'Second item' } },
        { component: 'MenuItem', props: { label: 'Third item' } },
      ],
    },
  },
  {
    name: 'centered',
    description: 'Centered reading-width container',
    props: { preset: 'centered' },
    slots: {
      content: [
        { component: 'MenuItem', props: { label: 'Centered item' } },
      ],
    },
  },
];

export function render(props = {}) {
  const preset = props.preset ?? propTypes.preset.default;
  const padding = props.padding ?? propTypes.padding.default;
  const gap = props.gap ?? propTypes.gap.default;

  const root = document.createElement('div');
  root.className = `dk-container dk-container-${preset}`;
  if (padding) root.style.padding = padding;
  if (gap) root.style.gap = gap;

  const slot = document.createElement('div');
  slot.className = 'dk-container-content';
  slot.dataset.slot = 'content';
  root.append(slot);

  return root;
}
