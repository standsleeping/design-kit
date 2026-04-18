export const metadata = {
  name: 'BentoReveal',
  description: 'Reveal policy — supplementary content appears as container width grows; inverse of shed',
  category: 'bento',
};

export const propTypes = {
  primary: { type: 'string', default: '' },
  secondary: { type: 'string', default: '' },
  tertiary: { type: 'string', default: '' },
};

const SAMPLE = { primary: '99.8%', secondary: 'Uptime', tertiary: '+0.3 vs last week' };

export const variants = [
  { name: 'primary-only', description: '< 140px — primary value only',     props: SAMPLE },
  { name: 'with-label',   description: '140px+ — secondary label appears', props: SAMPLE },
  { name: 'full',         description: '260px+ — tertiary context joins',   props: SAMPLE },
];

export function render(props = {}) {
  const primary = props.primary ?? propTypes.primary.default;
  const secondary = props.secondary ?? propTypes.secondary.default;
  const tertiary = props.tertiary ?? propTypes.tertiary.default;

  const root = document.createElement('div');
  root.className = 'dk-bento-reveal';

  const content = document.createElement('div');
  content.className = 'dk-bento-reveal-content';

  const primaryEl = document.createElement('div');
  primaryEl.className = 'dk-bento-reveal-primary';
  primaryEl.textContent = primary;

  const secondaryEl = document.createElement('div');
  secondaryEl.className = 'dk-bento-reveal-secondary';
  secondaryEl.textContent = secondary;

  const tertiaryEl = document.createElement('div');
  tertiaryEl.className = 'dk-bento-reveal-tertiary';
  tertiaryEl.textContent = tertiary;

  content.append(primaryEl, secondaryEl, tertiaryEl);
  root.append(content);
  return root;
}
