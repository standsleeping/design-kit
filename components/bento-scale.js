export const metadata = {
  name: 'BentoScale',
  description: 'Scale policy — font size tracks container width in discrete steps',
  category: 'bento',
};

export const propTypes = {
  text: { type: 'string', default: '' },
};

export const variants = [
  { name: 'xs',  description: '< 180px', props: { text: 'HEADLINE' } },
  { name: 'base',description: '180px+',  props: { text: 'HEADLINE' } },
  { name: 'xl',  description: '280px+',  props: { text: 'HEADLINE' } },
  { name: '2xl', description: '450px+',  props: { text: 'HEADLINE' } },
  { name: '3xl', description: '650px+',  props: { text: 'HEADLINE' } },
];

export function render(props = {}) {
  const text = props.text ?? propTypes.text.default;
  const root = document.createElement('div');
  root.className = 'dk-bento-scale';
  const heading = document.createElement('div');
  heading.className = 'dk-bento-scale-heading';
  heading.textContent = text;
  root.append(heading);
  return root;
}
