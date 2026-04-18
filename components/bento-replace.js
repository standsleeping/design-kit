export const metadata = {
  name: 'BentoReplace',
  description: 'Replace policy — content swaps to a shorter form at container-width thresholds',
  category: 'bento',
};

export const propTypes = {
  full: { type: 'string', default: '' },
  short: { type: 'string', default: '' },
  icon: { type: 'string', default: '\u2192' },
};

const SAMPLE = { full: 'Continue to checkout', short: 'Checkout', icon: '\u2192' };

export const variants = [
  { name: 'icon-only',   description: '< 120px — icon only',            props: SAMPLE },
  { name: 'short-label', description: '120px+ — short label',            props: SAMPLE },
  { name: 'full-label',  description: '220px+ — full label',             props: SAMPLE },
];

export function render(props = {}) {
  const full = props.full ?? propTypes.full.default;
  const short = props.short ?? propTypes.short.default;
  const icon = props.icon ?? propTypes.icon.default;

  const root = document.createElement('div');
  root.className = 'dk-bento-replace';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'dk-bento-replace-btn';

  const iconEl = document.createElement('span');
  iconEl.className = 'dk-bento-replace-icon';
  iconEl.textContent = icon;

  const shortEl = document.createElement('span');
  shortEl.className = 'dk-bento-replace-short';
  shortEl.textContent = short;

  const fullEl = document.createElement('span');
  fullEl.className = 'dk-bento-replace-full';
  fullEl.textContent = full;

  btn.append(iconEl, shortEl, fullEl);
  root.append(btn);
  return root;
}
