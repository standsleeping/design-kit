export const metadata = {
  name: 'BentoDefer',
  description: 'Defer policy — content hides behind a disclosure control at small sizes',
  category: 'bento',
};

export const propTypes = {
  text: { type: 'string', default: '' },
};

const LONG_TEXT = 'When the container is narrow, this text is clamped to just a few lines and a "Read more" control appears. As the container grows, the clamp releases step by step; at 450px+ the full text shows without gating.';

export const variants = [
  { name: 'clamped-short',  description: 'Tightest — 2 lines + disclosure', props: { text: LONG_TEXT } },
  { name: 'clamped-medium', description: 'Medium — 3 lines + disclosure',    props: { text: LONG_TEXT } },
  { name: 'full',           description: 'Wide — full text, no disclosure',  props: { text: LONG_TEXT } },
];

export function render(props = {}) {
  const text = props.text ?? propTypes.text.default;

  const root = document.createElement('div');
  root.className = 'dk-bento-defer';

  const content = document.createElement('div');
  content.className = 'dk-bento-defer-content';

  const p = document.createElement('p');
  p.className = 'dk-bento-defer-text';
  p.textContent = text;

  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'dk-bento-defer-more';
  more.textContent = 'Read more \u2192';

  content.append(p, more);
  root.append(content);
  return root;
}
