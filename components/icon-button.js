export const metadata = {
  name: 'IconButton',
  description: 'Icon-only button with size variants',
  category: 'actions',
};

export const propTypes = {
  icon: { type: 'string', default: '◆' },
  label: { type: 'string', default: '' },
  size: { type: 'enum', default: 'default', options: ['sm', 'default', 'touch'] },
  disabled: { type: 'boolean', default: false },
};

export const variants = [
  { name: 'sm', description: 'Small (24px)', props: { icon: '×', label: 'Close', size: 'sm' } },
  { name: 'default', description: 'Default (32px)', props: { icon: '⋯', label: 'More options' } },
  { name: 'touch', description: 'Touch target (40px)', props: { icon: '☰', label: 'Open menu', size: 'touch' } },
  { name: 'disabled', description: 'Disabled state', props: { icon: '↓', label: 'Download', disabled: true } },
];

export function render(props = {}) {
  const icon = props.icon ?? propTypes.icon.default;
  const label = props.label ?? propTypes.label.default;
  const size = props.size ?? propTypes.size.default;
  const disabled = props.disabled ?? propTypes.disabled.default;

  const root = document.createElement('button');
  root.type = 'button';
  root.className = `dk-icon-button dk-icon-button-${size}`;
  root.disabled = disabled;
  if (label) root.setAttribute('aria-label', label);
  root.textContent = icon;

  root.addEventListener('click', () => {
    if (disabled) return;
    root.dispatchEvent(new CustomEvent('icon-button:click', {
      bubbles: true,
      detail: { label, size },
    }));
  });

  return root;
}
