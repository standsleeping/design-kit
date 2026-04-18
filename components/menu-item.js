export const metadata = {
  name: 'MenuItem',
  description: 'Selectable navigation row with optional icon',
  category: 'navigation',
};

export const propTypes = {
  label: { type: 'string', default: 'Item' },
  icon: { type: 'string', default: '' },
  selected: { type: 'boolean', default: false },
  disabled: { type: 'boolean', default: false },
};

export const variants = [
  { name: 'default', description: 'Default state', props: { label: 'Menu Item' } },
  { name: 'selected', description: 'Currently selected item', props: { label: 'Selected Item', selected: true } },
  { name: 'disabled', description: 'Disabled/inactive item', props: { label: 'Disabled Item', disabled: true } },
  { name: 'with-icon', description: 'Menu item with leading icon', props: { label: 'Dashboard', icon: '▸' } },
];

export function render(props = {}) {
  const label = props.label ?? propTypes.label.default;
  const icon = props.icon ?? propTypes.icon.default;
  const selected = props.selected ?? propTypes.selected.default;
  const disabled = props.disabled ?? propTypes.disabled.default;

  const root = document.createElement('button');
  root.type = 'button';
  root.className = `dk-menu-item${selected ? ' dk-menu-item-selected' : ''}`;
  root.disabled = disabled;

  if (icon) {
    const iconEl = document.createElement('span');
    iconEl.className = 'dk-menu-item-icon';
    iconEl.setAttribute('aria-hidden', 'true');
    iconEl.textContent = icon;
    root.append(iconEl);
  }

  const labelEl = document.createElement('span');
  labelEl.className = 'dk-menu-item-label';
  labelEl.textContent = label;
  root.append(labelEl);

  root.addEventListener('click', () => {
    if (disabled) return;
    root.dispatchEvent(new CustomEvent('menu-item:select', {
      bubbles: true,
      detail: { label },
    }));
  });

  return root;
}
