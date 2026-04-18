export const metadata = {
  name: 'BentoCompress',
  description: 'Compression policy — spacing and density tighten; all content stays visible',
  category: 'bento',
};

export const propTypes = {
  items: { type: 'array', default: [] },
};

const SAMPLE = ['Draft', 'Review', 'Ready', 'Shipped', 'Archived'];

export const variants = [
  { name: 'tight',    description: '< 200px — tightest padding and type',  props: { items: SAMPLE } },
  { name: 'normal',   description: '200px+ — comfortable density',          props: { items: SAMPLE } },
  { name: 'spacious', description: '400px+ — maximum breathing room',       props: { items: SAMPLE } },
];

export function render(props = {}) {
  const items = props.items ?? propTypes.items.default;

  const root = document.createElement('div');
  root.className = 'dk-bento-compress';

  const list = document.createElement('div');
  list.className = 'dk-bento-compress-items';

  items.forEach((item, i) => {
    const span = document.createElement('span');
    span.className = 'dk-bento-compress-item';
    span.textContent = item;
    list.append(span);
    if (i < items.length - 1) {
      const sep = document.createElement('span');
      sep.className = 'dk-bento-compress-separator';
      sep.setAttribute('aria-hidden', 'true');
      sep.textContent = '\u00B7';
      list.append(sep);
    }
  });

  root.append(list);
  return root;
}
