export const metadata = {
  name: 'BentoReflow',
  description: 'Reflow policy — axis changes from column to row at a container-width threshold',
  category: 'bento',
};

export const propTypes = {
  value: { type: 'string', default: '' },
  label: { type: 'string', default: '' },
};

export const variants = [
  { name: 'stacked', description: 'Column layout (< 220px)',  props: { value: '1,284', label: 'Requests' } },
  { name: 'inline',  description: 'Row layout (>= 220px)',     props: { value: '42ms', label: 'P95 latency' } },
];

export function render(props = {}) {
  const value = props.value ?? propTypes.value.default;
  const label = props.label ?? propTypes.label.default;

  const root = document.createElement('div');
  root.className = 'dk-bento-reflow';

  const metric = document.createElement('div');
  metric.className = 'dk-bento-reflow-metric';

  const valueEl = document.createElement('span');
  valueEl.className = 'dk-bento-reflow-value';
  valueEl.textContent = value;

  const labelEl = document.createElement('span');
  labelEl.className = 'dk-bento-reflow-label';
  labelEl.textContent = label;

  metric.append(valueEl, labelEl);
  root.append(metric);
  return root;
}
