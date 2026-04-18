export const metadata = {
  name: 'AdaptiveMetricsList',
  description: 'Responsive metrics list that progressively hides lower-priority columns based on container width',
  category: 'display',
};

export const propTypes = {
  title: { type: 'string', default: 'Items' },
  items: { type: 'array', default: [] },
  columns: { type: 'array', default: [] },
  selectedId: { type: 'string', default: '' },
  sortColumn: { type: 'string', default: '' },
  sortDirection: { type: 'enum', default: 'desc', options: ['asc', 'desc'] },
  sortable: { type: 'boolean', default: true },
  outlierThresholds: { type: 'object', default: null },
  showSortReadout: { type: 'boolean', default: true },
};

const DEFAULT_COLUMNS = [
  { key: 'metricA', label: 'A', priority: 1 },
  { key: 'metricB', label: 'B', priority: 2 },
  { key: 'metricC', label: 'C', priority: 3 },
];

const SAMPLE_ITEMS = [
  { id: 'one',   name: 'Authentication',  metricA: 4821, metricB: 12.4, metricC: 0.92 },
  { id: 'two',   name: 'Billing pipeline', metricA: 1203, metricB: 48.0, metricC: 0.45 },
  { id: 'three', name: 'Ingest worker',    metricA: 9042, metricB: 3.1,  metricC: 0.98 },
  { id: 'four',  name: 'Search index',     metricA: 612,  metricB: 88.2, metricC: 0.12 },
];

export const variants = [
  {
    name: 'wide',
    description: 'Three columns at wide container widths',
    props: { items: SAMPLE_ITEMS },
  },
  {
    name: 'sorted',
    description: 'Sorted descending by metricB',
    props: { items: SAMPLE_ITEMS, sortColumn: 'metricB', sortDirection: 'desc' },
  },
  {
    name: 'with-outliers',
    description: 'Highlights values above per-column thresholds',
    props: {
      items: SAMPLE_ITEMS,
      outlierThresholds: { metricA: 5000, metricB: 40 },
    },
  },
  {
    name: 'empty',
    description: 'No items to show',
    props: { items: [] },
  },
];

function mode(width) {
  if (width < 360) return 'narrow';
  if (width < 520) return 'medium';
  return 'wide';
}

function visibleColumns(columns, width) {
  const m = mode(width);
  return columns.filter((column) => {
    if (typeof column.minWidth === 'number' && width < column.minWidth) return false;
    if (column.hideBelow) {
      const hb = String(column.hideBelow);
      if (hb === 'wide' && m !== 'wide') return false;
      if (hb === 'medium' && m === 'narrow') return false;
    }
    if (m === 'narrow') return (column.priority ?? 1) <= 1;
    if (m === 'medium') return (column.priority ?? 1) <= 2;
    return true;
  });
}

function sortedItems(items, sortColumn, sortDirection) {
  if (!sortColumn) return items;
  const direction = sortDirection === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const av = a?.[sortColumn];
    const bv = b?.[sortColumn];
    if (av === bv) return 0;
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * direction;
    return String(av).localeCompare(String(bv)) * direction;
  });
}

function nextSortDirection(columnKey, sortColumn, sortDirection) {
  if (sortColumn !== columnKey) return 'desc';
  return sortDirection === 'desc' ? 'asc' : 'desc';
}

function formatMetric(value) {
  if (value === null || value === undefined || value === 0) return '\u2014';
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
}

export function render(props = {}) {
  const title = props.title ?? propTypes.title.default;
  const items = Array.isArray(props.items) ? props.items : propTypes.items.default;
  const rawColumns = Array.isArray(props.columns) && props.columns.length > 0 ? props.columns : DEFAULT_COLUMNS;
  const sortable = props.sortable ?? propTypes.sortable.default;
  const outlierThresholds = props.outlierThresholds ?? propTypes.outlierThresholds.default;
  const showSortReadout = props.showSortReadout ?? propTypes.showSortReadout.default;

  let sortColumn = props.sortColumn ?? propTypes.sortColumn.default;
  let sortDirection = props.sortDirection ?? propTypes.sortDirection.default;
  let selectedId = props.selectedId ?? propTypes.selectedId.default;
  let width = 0;

  const root = document.createElement('div');
  root.className = 'dk-aml';

  const rebuild = () => {
    root.innerHTML = '';
    const effectiveWidth = width || root.clientWidth || 999;
    const visible = visibleColumns(rawColumns, effectiveWidth);
    root.style.setProperty('--dk-aml-columns', String(Math.max(1, visible.length)));

    const header = document.createElement('div');
    header.className = 'dk-aml-header dk-aml-row-grid';

    const titleEl = document.createElement('span');
    titleEl.className = 'dk-aml-title';
    titleEl.textContent = title;
    header.append(titleEl);

    for (const column of visible) {
      const label = column.label ?? column.key;
      const sortableCol = sortable && column.sortable !== false;
      if (!sortableCol) {
        const span = document.createElement('span');
        span.className = 'dk-aml-metric-header';
        span.textContent = label;
        header.append(span);
      } else {
        const isSorted = sortColumn === column.key;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `dk-aml-metric-header dk-aml-header-button${isSorted ? ' dk-aml-header-button-sorted' : ''}`;
        btn.textContent = isSorted ? `${label}${sortDirection === 'asc' ? '\u2191' : '\u2193'}` : label;
        btn.setAttribute('aria-label', isSorted
          ? `Sort by ${label}. Currently ${sortDirection === 'asc' ? 'ascending' : 'descending'}. Press Enter or Space to toggle.`
          : `Sort by ${label}. Press Enter or Space to sort descending.`);
        btn.addEventListener('click', () => {
          const nextDir = nextSortDirection(column.key, sortColumn, sortDirection);
          sortColumn = column.key;
          sortDirection = nextDir;
          rebuild();
          root.dispatchEvent(new CustomEvent('adaptive-metrics-list:sort', {
            bubbles: true,
            detail: { column: sortColumn, direction: sortDirection },
          }));
        });
        header.append(btn);
      }
    }

    root.append(header);

    if (sortable && showSortReadout) {
      const readout = document.createElement('div');
      readout.className = 'dk-aml-sort-readout';
      const sortedColumn = rawColumns.find((c) => c.key === sortColumn);
      const dirLabel = sortDirection === 'asc' ? 'ascending' : 'descending';
      readout.textContent = sortedColumn
        ? `Sorted by ${sortedColumn.label ?? sortedColumn.key} (${dirLabel}). Press Enter or Space on headers to toggle.`
        : 'Sortable headers: use Enter or Space to sort.';
      root.append(readout);
    }

    const body = document.createElement('div');
    body.className = 'dk-aml-body';
    const sorted = sortedItems(items, sortColumn, sortDirection);

    if (sorted.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'dk-aml-empty';
      empty.textContent = 'No items';
      body.append(empty);
    } else {
      for (const item of sorted) {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'dk-aml-row dk-aml-row-grid';
        const rowId = item?.id ? String(item.id) : '';
        if (rowId && rowId === selectedId) row.classList.add('dk-aml-row-selected');

        const name = document.createElement('span');
        name.className = 'dk-aml-name';
        name.textContent = item?.name ?? '';
        row.append(name);

        for (const column of visible) {
          const value = item?.[column.key];
          const text = formatMetric(value);
          const cell = document.createElement('span');
          cell.className = `dk-aml-metric${text === '\u2014' ? ' dk-aml-metric-empty' : ''}`;
          if (outlierThresholds
              && typeof outlierThresholds[column.key] === 'number'
              && typeof value === 'number'
              && value >= outlierThresholds[column.key]) {
            cell.classList.add('dk-aml-metric-outlier');
          }
          cell.textContent = text;
          row.append(cell);
        }

        row.addEventListener('click', () => {
          selectedId = rowId;
          rebuild();
          root.dispatchEvent(new CustomEvent('adaptive-metrics-list:select-row', {
            bubbles: true,
            detail: { id: rowId, item },
          }));
        });

        body.append(row);
      }
    }

    root.append(body);
  };

  rebuild();

  let observer = null;
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? 0;
      if (Math.abs(w - width) > 4) {
        width = w;
        rebuild();
      }
    });
    observer.observe(root);
  }

  const cleanup = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  };

  return { node: root, cleanup };
}
