export const metadata = {
  name: 'BentoRedistribute',
  description: 'Redistribute policy — items rebalance across available space via flex-wrap',
  category: 'bento',
};

export const propTypes = {
  items: { type: 'array', default: [] },
};

const SAMPLE_NARROW = ['alpha', 'beta', 'gamma', 'delta'];
const SAMPLE_WIDE = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa'];

export const variants = [
  { name: 'narrow', description: 'Few items — stack compactly', props: { items: SAMPLE_NARROW } },
  { name: 'wide',   description: 'Many items — fan out',         props: { items: SAMPLE_WIDE } },
];

export function render(props = {}) {
  const items = props.items ?? propTypes.items.default;

  const root = document.createElement('div');
  root.className = 'dk-bento-redistribute';

  const tags = document.createElement('div');
  tags.className = 'dk-bento-redistribute-tags';

  for (const item of items) {
    const tag = document.createElement('span');
    tag.className = 'dk-bento-redistribute-tag';
    tag.textContent = item;
    tags.append(tag);
  }

  root.append(tags);
  return root;
}
