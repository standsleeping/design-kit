export const metadata = {
  name: 'BentoTruncate',
  description: 'Truncation policy — text clips with ellipsis; allowed line count widens with container width',
  category: 'bento',
};

export const propTypes = {
  text: { type: 'string', default: '' },
};

const LONG_TEXT = 'The truncation policy clips trailing text with an ellipsis when the container is too narrow, widening to multiple lines as inline space grows. Line count steps at 200px and 350px, mapping line-clamp to the container rather than the viewport.';

export const variants = [
  { name: 'narrow', description: 'Single-line clamp', props: { text: LONG_TEXT } },
  { name: 'medium', description: 'Two-line clamp', props: { text: LONG_TEXT } },
  { name: 'wide',   description: 'Five-line clamp', props: { text: LONG_TEXT } },
];

export function render(props = {}) {
  const text = props.text ?? propTypes.text.default;
  const root = document.createElement('div');
  root.className = 'dk-bento-truncate';
  const p = document.createElement('p');
  p.className = 'dk-bento-truncate-text';
  p.textContent = text;
  root.append(p);
  return root;
}
