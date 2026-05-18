import { icon as buildIcon } from './system/icons.js';

export const metadata = {
  name: 'IconButton',
  description: 'Icon-only button with size variants. Pass a Radix icon name (e.g. "cross-1") or any string for a literal glyph.',
  category: 'actions',
};

export const propTypes = {
  icon: { type: 'string', default: 'cross-1' },
  label: { type: 'string', default: '' },
  size: { type: 'enum', default: 'default', options: ['sm', 'default', 'touch'] },
  disabled: { type: 'boolean', default: false },
};

export const variants = [
  { name: 'sm', description: 'Small (24px)', props: { icon: 'cross-1', label: 'Close', size: 'sm' } },
  { name: 'default', description: 'Default (32px)', props: { icon: 'dots-horizontal', label: 'More options' } },
  { name: 'touch', description: 'Touch target (40px)', props: { icon: 'hamburger-menu', label: 'Open menu', size: 'touch' } },
  { name: 'disabled', description: 'Disabled state', props: { icon: 'arrow-down', label: 'Download', disabled: true } },
  { name: 'unicode-fallback', description: 'Bare-string fallback when no Radix name matches', props: { icon: '◆', label: 'Mark', size: 'sm' } },
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
  const svg = buildIcon(icon);
  if (svg) {
    root.append(svg);
  } else {
    root.textContent = icon;
  }

  root.addEventListener('click', () => {
    if (disabled) return;
    root.dispatchEvent(new CustomEvent('icon-button:click', {
      bubbles: true,
      detail: { label, size },
    }));
  });

  return root;
}
