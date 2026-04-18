export const metadata = {
  name: 'MetricsCard',
  description: 'Inline metrics strip with loading, error, and empty states',
  category: 'display',
};

export const propTypes = {
  metrics: { type: 'array', default: [] },
  loading: { type: 'boolean', default: false },
  error: { type: 'string', default: '' },
};

export const variants = [
  {
    name: 'with-data',
    description: 'Three metrics with values',
    props: {
      metrics: [
        { label: 'Requests', value: 1284 },
        { label: 'P95', value: '42ms' },
        { label: 'Errors', value: 0 },
      ],
    },
  },
  {
    name: 'loading',
    description: 'Loading placeholder',
    props: { loading: true },
  },
  {
    name: 'error',
    description: 'Error message',
    props: { error: 'Failed to fetch metrics.' },
  },
  {
    name: 'empty',
    description: 'No metrics configured',
    props: { metrics: [] },
  },
];

function formatValue(value) {
  if (value === null || value === undefined) return '\u2014';
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
}

export function render(props = {}) {
  const metrics = props.metrics ?? propTypes.metrics.default;
  const loading = props.loading ?? propTypes.loading.default;
  const error = props.error ?? propTypes.error.default;

  const root = document.createElement('div');
  root.className = 'dk-metrics-card';

  if (loading) {
    root.classList.add('dk-metrics-card-muted');
    root.textContent = 'Loading metrics...';
    return root;
  }

  if (error) {
    root.classList.add('dk-metrics-card-error');
    root.textContent = error;
    return root;
  }

  if (!Array.isArray(metrics) || metrics.length === 0) {
    root.classList.add('dk-metrics-card-muted');
    root.textContent = 'No metrics configured';
    return root;
  }

  metrics.forEach((metric, i) => {
    const item = document.createElement('span');
    item.className = 'dk-metrics-card-item';

    const value = document.createElement('span');
    value.className = 'dk-metrics-card-value';
    value.textContent = formatValue(metric?.value);

    const label = document.createElement('span');
    label.className = 'dk-metrics-card-label';
    label.textContent = metric?.label ?? '';

    item.append(value, label);
    root.append(item);

    if (i < metrics.length - 1) {
      const sep = document.createElement('span');
      sep.className = 'dk-metrics-card-separator';
      sep.setAttribute('aria-hidden', 'true');
      sep.textContent = '\u00B7';
      root.append(sep);
    }
  });

  return root;
}
