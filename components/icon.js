import { iconNames, iconMeta, icon as buildIcon } from './icons.js';

export const metadata = {
  name: 'Icon',
  description: 'Curated Radix icon. Sizes via 1em (font-size on the parent); color via currentColor.',
  category: 'foundations',
};

export const propTypes = {
  name: { type: 'enum', default: iconNames[0] ?? 'check', options: iconNames },
};

const FALLBACK_NAMES = ['check', 'chevron-down', 'cross-1', 'plus', 'magnifying-glass'];

const variantNames = iconNames.length ? iconNames : FALLBACK_NAMES;

export const variants = variantNames.map((name) => {
  const meta = iconMeta[name];
  return {
    name,
    description: meta ? `${meta.category} - ${meta.guidance}` : name,
    props: { name },
  };
});

export function render(props = {}) {
  const name = props.name ?? propTypes.name.default;
  const root = document.createElement('span');
  root.className = 'dk-icon-host';
  root.style.fontSize = '24px';
  root.style.color = 'var(--color-text)';
  root.style.display = 'inline-flex';
  root.style.alignItems = 'center';
  root.style.gap = 'var(--spacing-md)';

  const svg = buildIcon(name);
  if (svg) {
    root.append(svg);
  } else {
    const fallback = document.createElement('span');
    fallback.textContent = '?';
    root.append(fallback);
  }

  const label = document.createElement('span');
  label.style.fontFamily = 'var(--typography-mono)';
  label.style.fontSize = 'var(--font-size-xs)';
  label.style.color = 'var(--color-text-muted)';
  label.textContent = name;
  root.append(label);

  return root;
}
