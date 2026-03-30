import { SPElement } from './sp-element.js';

export class SPAdaptiveMetricsList extends SPElement {
  static metadata = {
    name: 'SPAdaptiveMetricsList',
    description:
      'Responsive metrics list that progressively hides lower-priority columns',
    category: 'display',
  };

  static propTypes = {
    title: { type: 'string', default: 'Items' },
    items: { type: 'array', default: [] },
    columns: { type: 'array', default: [] },
    'selected-id': { type: 'string', default: '' },
    'sort-column': { type: 'string', default: '' },
    'sort-direction': { type: 'string', default: 'desc' },
    sortable: { type: 'boolean', default: true },
    'outlier-thresholds': { type: 'object', default: null },
    'show-sort-readout': { type: 'boolean', default: true },
  };

  static variants = ['wide', 'medium', 'narrow', 'sorted'];

  static componentStyles = new CSSStyleSheet();

  constructor() {
    super();
    this._width = 0;
    this._resizeObserver = null;
  }

  connectedCallback() {
    this.render();
    this._setupObserver();
  }

  disconnectedCallback() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
  }

  _setupObserver() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
    this._resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width ?? 0;
      if (Math.abs(width - this._width) > 4) {
        this._width = width;
        this.render();
      }
    });
    this._resizeObserver.observe(this);
  }

  _getColumns() {
    const columns = this.prop('columns');
    if (Array.isArray(columns) && columns.length > 0) {
      return columns;
    }
    return [
      { key: 'metricA', label: 'A', priority: 1 },
      { key: 'metricB', label: 'B', priority: 2 },
      { key: 'metricC', label: 'C', priority: 3 },
    ];
  }

  _mode() {
    const width = this._width || this.clientWidth || 999;
    if (width < 360) return 'narrow';
    if (width < 520) return 'medium';
    return 'wide';
  }

  _visibleColumns(columns) {
    const width = this._width || this.clientWidth || 999;
    const mode = this._mode();

    return columns.filter((column) => {
      if (typeof column.minWidth === 'number' && width < column.minWidth) {
        return false;
      }
      if (column.hideBelow) {
        const hideBelow = String(column.hideBelow);
        if (hideBelow === 'wide' && mode !== 'wide') return false;
        if (hideBelow === 'medium' && mode === 'narrow') return false;
      }
      if (mode === 'narrow') {
        return (column.priority ?? 1) <= 1;
      }
      if (mode === 'medium') {
        return (column.priority ?? 1) <= 2;
      }
      return true;
    });
  }

  _sortedItems(items, sortColumn, sortDirection) {
    if (!sortColumn) {
      return items;
    }
    const direction = sortDirection === 'asc' ? 1 : -1;
    return [...items].sort((a, b) => {
      const av = a?.[sortColumn];
      const bv = b?.[sortColumn];
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return (av - bv) * direction;
      }
      return String(av).localeCompare(String(bv)) * direction;
    });
  }

  _nextSortDirection(columnKey, sortColumn, sortDirection) {
    if (sortColumn !== columnKey) return 'desc';
    return sortDirection === 'desc' ? 'asc' : 'desc';
  }

  _formatMetric(value) {
    if (value === null || value === undefined || value === 0) return '—';
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
  }

  _buildHeaderCell(column, sortColumn, sortDirection, sortable) {
    const label = column.label ?? column.key;
    const sortableColumn = sortable && column.sortable !== false;
    const isSorted = sortColumn === column.key;

    if (!sortableColumn) {
      const span = document.createElement('span');
      span.className = 'aml-metric-header';
      span.textContent = label;
      return span;
    }

    const sortDirectionLabel = sortDirection === 'asc' ? 'ascending' : 'descending';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `aml-metric-header aml-header-button${isSorted ? ' aml-header-button-sorted' : ''}`;
    button.textContent = isSorted
      ? `${label}${sortDirection === 'asc' ? '↑' : '↓'}`
      : label;
    button.setAttribute(
      'aria-label',
      isSorted
        ? `Sort by ${label}. Currently ${sortDirectionLabel}. Press Enter or Space to toggle.`
        : `Sort by ${label}. Press Enter or Space to sort descending.`
    );
    button.addEventListener('click', () => {
      const nextDirection = this._nextSortDirection(
        column.key,
        sortColumn,
        sortDirection
      );
      this.setAttribute('sort-column', column.key);
      this.setAttribute('sort-direction', nextDirection);
      this.dispatchEvent(
        new CustomEvent('sp-sort', {
          bubbles: true,
          detail: { column: column.key, direction: nextDirection },
        })
      );
    });
    return button;
  }

  _buildHeader(visible, sortColumn, sortDirection, sortable, title) {
    const header = document.createElement('div');
    header.className = 'aml-header aml-row-grid';
    const titleEl = document.createElement('span');
    titleEl.className = 'aml-title';
    titleEl.textContent = title;
    header.appendChild(titleEl);
    visible.forEach((column) => {
      header.appendChild(this._buildHeaderCell(column, sortColumn, sortDirection, sortable));
    });
    return header;
  }

  _buildSortReadout(sortable, showSortReadout, sortedColumn, sortDirection) {
    if (!sortable || !showSortReadout) return null;
    const sortDirectionLabel = sortDirection === 'asc' ? 'ascending' : 'descending';
    const el = document.createElement('div');
    el.className = 'aml-sort-readout';
    el.textContent = sortedColumn
      ? `Sorted by ${sortedColumn.label ?? sortedColumn.key} (${sortDirectionLabel}). Press Enter or Space on headers to toggle.`
      : 'Sortable headers: use Enter or Space to sort.';
    return el;
  }

  _buildRow(item, visible, selectedId, outlierThresholds) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'aml-row aml-row-grid';
    const rowId = item?.id ? String(item.id) : '';
    if (rowId && rowId === selectedId) {
      row.classList.add('aml-row-selected');
    }

    const name = document.createElement('span');
    name.className = 'aml-name';
    name.textContent = item?.name ?? '';
    row.appendChild(name);

    visible.forEach((column) => {
      const value = item?.[column.key];
      const text = this._formatMetric(value);
      const cell = document.createElement('span');
      cell.className = `aml-metric${text === '—' ? ' aml-metric-empty' : ''}`;
      if (
        outlierThresholds &&
        typeof outlierThresholds[column.key] === 'number' &&
        typeof value === 'number' &&
        value >= outlierThresholds[column.key]
      ) {
        cell.classList.add('aml-metric-outlier');
      }
      cell.textContent = text;
      row.appendChild(cell);
    });

    row.addEventListener('click', () => {
      if (rowId) {
        this.setAttribute('selected-id', rowId);
      }
      this.dispatchEvent(
        new CustomEvent('sp-select-row', {
          bubbles: true,
          detail: { id: rowId, item },
        })
      );
    });

    return row;
  }

  _buildBody(sortedItems, visible, selectedId, outlierThresholds) {
    const body = document.createElement('div');
    body.className = 'aml-body';

    if (sortedItems.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'aml-empty';
      empty.textContent = 'No items';
      body.appendChild(empty);
    } else {
      sortedItems.forEach((item) => {
        body.appendChild(this._buildRow(item, visible, selectedId, outlierThresholds));
      });
    }

    return body;
  }

  render() {
    const title = this.prop('title');
    const items = Array.isArray(this.prop('items')) ? this.prop('items') : [];
    const selectedId = this.prop('selected-id');
    const sortColumn = this.prop('sort-column');
    const sortDirection = this.prop('sort-direction');
    const sortable = this.prop('sortable');
    const outlierThresholds = this.prop('outlier-thresholds');
    const showSortReadout = this.prop('show-sort-readout');
    const columns = this._getColumns();
    const visible = this._visibleColumns(columns);
    const sortedItems = this._sortedItems(items, sortColumn, sortDirection);
    const sortedColumn = columns.find((column) => column.key === sortColumn);

    this.shadowRoot.innerHTML = '<div class="aml"></div>';
    const root = this.shadowRoot.querySelector('.aml');
    root.style.setProperty('--aml-columns', Math.max(1, visible.length));

    root.appendChild(this._buildHeader(visible, sortColumn, sortDirection, sortable, title));

    const sortInfo = this._buildSortReadout(sortable, showSortReadout, sortedColumn, sortDirection);
    if (sortInfo) root.appendChild(sortInfo);

    root.appendChild(this._buildBody(sortedItems, visible, selectedId, outlierThresholds));
  }
}

SPAdaptiveMetricsList.componentStyles.replaceSync(`
  .aml {
    display: block;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    overflow: hidden;
    background: var(--color-bg);
    font-family: var(--typography-mono);
    font-size: var(--font-size-xs);
  }

  .aml-header {
    border-bottom: 1px solid var(--color-border);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: var(--font-letter-spacing-wide);
    font-size: var(--font-size-xs);
    background: var(--color-code-bg);
  }

  .aml-sort-readout {
    padding: var(--spacing-xs) var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
    font-family: var(--typography-mono);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    background: var(--color-code-bg);
  }

  .aml-row-grid {
    display: grid;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    grid-template-columns: minmax(120px, 1fr) repeat(var(--aml-columns, 1), minmax(28px, auto));
  }

  .aml-row {
    width: 100%;
    border: none;
    background: transparent;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-text);
    text-align: left;
  }

  .aml-row:last-child {
    border-bottom: none;
  }

  .aml-row:hover {
    background: var(--color-hover-bg);
  }

  .aml-row:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: -2px;
  }

  .aml-row-selected {
    background: var(--color-focus-ring-light);
  }

  .aml-title,
  .aml-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .aml-metric-header,
  .aml-metric {
    text-align: right;
    min-width: 24px;
  }

  .aml-header-button {
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    text-transform: inherit;
    letter-spacing: inherit;
    text-align: right;
    padding: 0;
    cursor: pointer;
  }

  .aml-header-button:hover {
    color: var(--color-text);
  }

  .aml-header-button:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .aml-header-button-sorted {
    color: var(--color-link);
  }

  .aml-metric-empty {
    color: var(--color-text-muted);
  }

  .aml-metric-outlier {
    color: var(--color-orange-700);
    font-weight: var(--font-weight-semibold);
  }

  .aml-empty {
    padding: var(--spacing-md);
    color: var(--color-text-muted);
  }
`);

customElements.define('sp-adaptive-metrics-list', SPAdaptiveMetricsList);
