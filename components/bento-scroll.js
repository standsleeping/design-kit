export const metadata = {
  name: 'BentoScroll',
  description: 'Scroll policy — overflowing content becomes scrollable; hosts children in [data-slot="content"]',
  category: 'bento',
};

export const propTypes = {
  text: { type: 'string', default: '' },
};

const SHORT_TEXT = 'line 1\nline 2\nline 3';
const LONG_TEXT = Array.from({ length: 40 }, (_, i) => `line ${i + 1}`).join('\n');

export const variants = [
  { name: 'fits',      description: 'Content fits',    props: { text: SHORT_TEXT } },
  { name: 'overflows', description: 'Content scrolls', props: { text: LONG_TEXT } },
];

export function render(props = {}) {
  const text = props.text ?? propTypes.text.default;

  const root = document.createElement('div');
  root.className = 'dk-bento-scroll';

  const scroller = document.createElement('div');
  scroller.className = 'dk-bento-scroll-container';
  scroller.dataset.slot = 'content';

  if (text) {
    const pre = document.createElement('pre');
    pre.className = 'dk-bento-scroll-pre';
    pre.textContent = text;
    scroller.append(pre);
  }

  root.append(scroller);
  return root;
}
