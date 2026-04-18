export const metadata = {
  name: 'Button',
  description: 'Button with variant styling',
  category: 'actions',
};

export const propTypes = {
  label: { type: 'string', default: 'Button' },
  variant: { type: 'enum', default: 'default', options: ['default', 'primary'] },
  disabled: { type: 'boolean', default: false },
  type: { type: 'enum', default: 'button', options: ['button', 'submit', 'reset'] },
};

export const variants = [
  { name: 'default', description: 'Default button', props: { label: 'Cancel' } },
  { name: 'primary', description: 'Primary action', props: { label: 'Save Changes', variant: 'primary' } },
  { name: 'disabled', description: 'Disabled default', props: { label: 'Unavailable', disabled: true } },
  { name: 'primary-disabled', description: 'Disabled primary', props: { label: 'Saving…', variant: 'primary', disabled: true } },
];

export function render(props = {}) {
  const label = props.label ?? propTypes.label.default;
  const variant = props.variant ?? propTypes.variant.default;
  const disabled = props.disabled ?? propTypes.disabled.default;
  const type = props.type ?? propTypes.type.default;

  const root = document.createElement('button');
  root.type = type;
  root.disabled = disabled;
  root.className = `dk-button${variant === 'primary' ? ' dk-button-primary' : ''}`;
  root.textContent = label;

  root.addEventListener('click', () => {
    if (disabled) return;
    root.dispatchEvent(new CustomEvent('button:click', {
      bubbles: true,
      detail: { label, variant },
    }));
  });

  return root;
}
