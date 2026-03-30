import { SPElement } from './sp-element.js';

export class SPMetricsCard extends SPElement {
  static metadata = {
    name: 'SPMetricsCard',
    description: 'Inline metrics strip with loading, error, and empty states',
    category: 'display',
  };

  static propTypes = {
    metrics: { type: 'array', default: [] },
    loading: { type: 'boolean', default: false },
    error: { type: 'string', default: '' },
  };

  static variants = ['with-data', 'loading', 'error', 'empty'];

  static componentStyles = new CSSStyleSheet();

  render() {
    const metrics = this.prop('metrics');
    const loading = this.prop('loading');
    const error = this.prop('error');

    if (loading) {
      this.shadowRoot.innerHTML = `<div class="metrics-card metrics-card-muted">Loading metrics...</div>`;
      return;
    }

    if (error) {
      this.shadowRoot.innerHTML = `<div class="metrics-card metrics-card-error">${error}</div>`;
      return;
    }

    if (!Array.isArray(metrics) || metrics.length === 0) {
      this.shadowRoot.innerHTML = `<div class="metrics-card metrics-card-muted">No metrics configured</div>`;
      return;
    }

    const parts = metrics
      .map((metric) => {
        const label = metric?.label ?? '';
        const value = _formatMetricValue(metric?.value);
        return `
          <span class="metric-item">
            <span class="metric-value">${value}</span>
            <span class="metric-label">${label}</span>
          </span>
        `;
      })
      .join('<span class="metric-separator" aria-hidden="true">·</span>');

    this.shadowRoot.innerHTML = `<div class="metrics-card">${parts}</div>`;
  }
}

function _formatMetricValue(value) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
}

SPMetricsCard.componentStyles.replaceSync(`
  .metrics-card {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg);
    font-family: var(--typography-mono);
    font-size: var(--font-size-xs);
    color: var(--color-text);
  }

  .metrics-card-muted {
    color: var(--color-text-muted);
  }

  .metrics-card-error {
    color: var(--color-red-700);
  }

  .metric-item {
    display: inline-flex;
    align-items: baseline;
    gap: var(--spacing-xs);
    white-space: nowrap;
  }

  .metric-value {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
  }

  .metric-label {
    color: var(--color-text-muted);
  }

  .metric-separator {
    color: var(--color-gray-300);
    user-select: none;
  }
`);

customElements.define('sp-metrics-card', SPMetricsCard);
