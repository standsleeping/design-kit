export const metadata = {
  name: 'BentoShed',
  description: 'Priority-shedding policy — lower-priority elements hide first as container shrinks',
  category: 'bento',
};

export const propTypes = {
  heading: { type: 'string', default: '' },
  description: { type: 'string', default: '' },
  meta: { type: 'string', default: '' },
};

const SAMPLE = {
  heading: 'Ingest pipeline',
  description: 'Handles inbound event normalization, dedupe, and forwarding to downstream processors.',
  meta: 'Service \u00B7 Critical \u00B7 Team DATA',
};

export const variants = [
  { name: 'heading-only',     description: 'Narrowest — heading visible only', props: SAMPLE },
  { name: 'with-description', description: 'Medium — description appears',      props: SAMPLE },
  { name: 'full',             description: 'Wide — meta strip joins',           props: SAMPLE },
];

export function render(props = {}) {
  const heading = props.heading ?? propTypes.heading.default;
  const description = props.description ?? propTypes.description.default;
  const meta = props.meta ?? propTypes.meta.default;

  const root = document.createElement('div');
  root.className = 'dk-bento-shed';

  const metaEl = document.createElement('div');
  metaEl.className = 'dk-bento-shed-meta';
  metaEl.textContent = meta;

  const headingEl = document.createElement('div');
  headingEl.className = 'dk-bento-shed-heading';
  headingEl.textContent = heading;

  const descEl = document.createElement('div');
  descEl.className = 'dk-bento-shed-description';
  descEl.textContent = description;

  root.append(metaEl, headingEl, descEl);
  return root;
}
