export const metadata = {
  name: 'ReadingPositionNav',
  description: 'Fixed overlay showing the reader\'s current section and item as they scroll; returns { node, cleanup } for scroll listeners',
  category: 'navigation',
};

export const propTypes = {
  sectionSelector: { type: 'string', default: 'h2' },
  itemSelector: { type: 'string', default: '[id]' },
  itemLabel: { type: 'string', default: '' },
  threshold: { type: 'number', default: 0.25 },
  section: { type: 'string', default: '' },
  item: { type: 'string', default: '' },
};

export const variants = [
  {
    name: 'static-labels',
    description: 'Preview with explicit section and item labels',
    props: { section: 'Operational Principle', item: 'Sentence 4' },
  },
  {
    name: 'section-only',
    description: 'Only a section label set',
    props: { section: 'Concept Actions' },
  },
  {
    name: 'live-scroll',
    description: 'Tracks h2 + [id] elements on the host page (empty in storybook — nothing to observe)',
    props: {},
  },
];

function formatSection(el) {
  const explicit = el.getAttribute('data-nav-label');
  if (explicit) return explicit;
  return (el.textContent || '').trim();
}

function formatItem(el, itemLabel) {
  const explicit = el.getAttribute('data-nav-label');
  if (explicit) return explicit;
  if (itemLabel) {
    const id = el.id || '';
    const match = id.match(/(\d+)$/);
    if (match) return `${itemLabel} ${match[1]}`;
  }
  return (el.textContent || '').trim();
}

function findCurrent(elements, threshold) {
  let current = null;
  for (const el of elements) {
    if (el.getBoundingClientRect().top <= threshold) {
      current = el;
    }
  }
  return current;
}

export function render(props = {}) {
  const sectionSelector = props.sectionSelector ?? propTypes.sectionSelector.default;
  const itemSelector = props.itemSelector ?? propTypes.itemSelector.default;
  const itemLabel = props.itemLabel ?? propTypes.itemLabel.default;
  const threshold = props.threshold ?? propTypes.threshold.default;
  const staticSection = props.section ?? propTypes.section.default;
  const staticItem = props.item ?? propTypes.item.default;

  const root = document.createElement('nav');
  root.className = 'dk-reading-position-nav';
  root.setAttribute('aria-hidden', 'true');

  const sectionEl = document.createElement('div');
  sectionEl.className = 'dk-reading-position-nav-section';
  root.append(sectionEl);

  const itemEl = document.createElement('div');
  itemEl.className = 'dk-reading-position-nav-item';
  root.append(itemEl);

  const useStatic = staticSection || staticItem;

  if (useStatic) {
    sectionEl.textContent = staticSection;
    itemEl.textContent = staticItem;
    return { node: root, cleanup: () => {} };
  }

  const sections = Array.from(document.querySelectorAll(sectionSelector));
  const items = Array.from(document.querySelectorAll(itemSelector));

  const update = () => {
    const px = window.innerHeight * threshold;
    const currentSection = findCurrent(sections, px);
    const currentItem = findCurrent(items, px);
    const sectionText = currentSection ? formatSection(currentSection) : '';
    const itemText = currentItem ? formatItem(currentItem, itemLabel) : '';
    if (sectionEl.textContent !== sectionText) sectionEl.textContent = sectionText;
    if (itemEl.textContent !== itemText) itemEl.textContent = itemText;
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });

  const cleanup = () => {
    window.removeEventListener('scroll', update);
    window.removeEventListener('resize', update);
  };

  return { node: root, cleanup };
}
