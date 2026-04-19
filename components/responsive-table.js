export const metadata = {
  name: 'ResponsiveTable',
  description: 'Mobile-first table with column-priority hiding, card-stack fallback, sticky headers, horizontal scroll affordances, and configurable width strategy',
  category: 'data-display',
};

export const propTypes = {
  caption: { type: 'string', default: '' },
  columns: { type: 'array', default: [] },
  rows: { type: 'array', default: [] },
  widthStrategy: { type: 'enum', default: 'auto', options: ['auto', 'proportional', 'floor'] },
  narrowMode: { type: 'enum', default: 'hide', options: ['hide', 'stack'] },
  stickyHeader: { type: 'boolean', default: false },
  scroll: { type: 'enum', default: 'affordance', options: ['affordance', 'plain', 'off'] },
  breakpoints: { type: 'object', default: { narrow: 360, medium: 600 } },
  emptyMessage: { type: 'string', default: 'No rows' },
  rowKey: { type: 'string', default: 'id' },
  clampLines: { type: 'number', default: 0 },
};

const DEFAULT_COLUMNS = [
  { key: 'name',   label: 'Name',   priority: 1, primary: true },
  { key: 'role',   label: 'Role',   priority: 2 },
  { key: 'status', label: 'Status', priority: 3 },
  { key: 'note',   label: 'Note',   priority: 4 },
];

const SAMPLE_ROWS = [
  { id: 'a1', name: 'Authentication',  role: 'Service',  status: 'Healthy',     note: 'p99 latency 18 ms' },
  { id: 'b2', name: 'Billing pipeline', role: 'Worker',  status: 'Degraded',    note: 'Backlog growing slowly' },
  { id: 'c3', name: 'Ingest worker',    role: 'Worker',  status: 'Healthy',     note: 'Lag under threshold' },
  { id: 'd4', name: 'Search index',     role: 'Service', status: 'Maintenance', note: 'Reindex in progress' },
];

export const variants = [
  {
    name: 'default',
    description: 'Auto-width, column-priority hiding on narrow widths',
    props: { columns: DEFAULT_COLUMNS, rows: SAMPLE_ROWS, caption: 'Service overview' },
  },
  {
    name: 'sticky-header',
    description: 'Header stays visible while scrolling the host page',
    props: { columns: DEFAULT_COLUMNS, rows: [...SAMPLE_ROWS, ...SAMPLE_ROWS, ...SAMPLE_ROWS], stickyHeader: true },
  },
  {
    name: 'stack-narrow',
    description: 'Card-stack fallback at narrow widths instead of hiding columns',
    props: { columns: DEFAULT_COLUMNS, rows: SAMPLE_ROWS, narrowMode: 'stack' },
  },
  {
    name: 'proportional',
    description: 'Fixed table-layout with explicit column widths',
    props: {
      caption: 'Lean syntax reference',
      widthStrategy: 'proportional',
      columns: [
        { key: 'syntax',  label: 'Syntax',  priority: 1, primary: true, width: '45%', nowrap: true },
        { key: 'meaning', label: 'Meaning', priority: 1, width: '55%' },
      ],
      rows: [
        { id: 's1', syntax: '(e : T)',          meaning: 'Type ascription on expression e' },
        { id: 's2', syntax: 'fun x => x + 1',   meaning: 'Anonymous function (lambda)' },
        { id: 's3', syntax: 'def f : Nat := 0', meaning: 'Definition with explicit type' },
      ],
    },
  },
  {
    name: 'floor',
    description: 'min-width floor (in ch) for the primary column; rest auto',
    props: {
      widthStrategy: 'floor',
      columns: [
        { key: 'name',   label: 'Name',   priority: 1, primary: true, minCh: 24 },
        { key: 'count',  label: 'Count',  priority: 2, align: 'right' },
        { key: 'status', label: 'Status', priority: 3 },
      ],
      rows: SAMPLE_ROWS.map((r) => ({ id: r.id, name: r.name, count: 42, status: r.status })),
    },
  },
  {
    name: 'wide-many-columns',
    description: 'Eight columns triggering horizontal scroll with edge fades',
    props: {
      columns: [
        { key: 'name',   label: 'Name',    priority: 1, primary: true, nowrap: true },
        { key: 'region', label: 'Region',  priority: 2 },
        { key: 'cpu',    label: 'CPU',     priority: 3, align: 'right' },
        { key: 'mem',    label: 'Memory',  priority: 3, align: 'right' },
        { key: 'rps',    label: 'RPS',     priority: 4, align: 'right' },
        { key: 'p50',    label: 'p50',     priority: 5, align: 'right' },
        { key: 'p99',    label: 'p99',     priority: 5, align: 'right' },
        { key: 'errors', label: 'Errors',  priority: 6, align: 'right' },
      ],
      rows: SAMPLE_ROWS.map((r, i) => ({
        id: r.id, name: r.name, region: 'us-east-1',
        cpu: `${30 + i * 7}%`, mem: `${48 + i * 4}%`, rps: 1200 + i * 300,
        p50: `${12 + i}ms`, p99: `${80 + i * 9}ms`, errors: i,
      })),
    },
  },
  {
    name: 'clamped',
    description: 'Two-line clamp on every cell — preserves uniform row height with long values',
    props: {
      clampLines: 2,
      columns: DEFAULT_COLUMNS,
      rows: [
        { id: 'l1', name: 'Authentication',  role: 'Service', status: 'Healthy',  note: 'Token rotation completed at 14:02; downstream caches refreshed and p99 latency held at 18 ms across all regions.' },
        { id: 'l2', name: 'Billing pipeline', role: 'Worker', status: 'Degraded', note: 'Invoice batch backlog growing slowly; suspect a slow downstream credit-check API. Investigation tracked in INC-4421.' },
        { id: 'l3', name: 'Search index',     role: 'Service', status: 'Maintenance', note: 'Full reindex in progress; serving stale results until 16:00 UTC.' },
      ],
    },
  },
  {
    name: 'empty',
    description: 'Empty state',
    props: { columns: DEFAULT_COLUMNS, rows: [] },
  },
];

function defaults() {
  const out = {};
  for (const [k, v] of Object.entries(propTypes)) out[k] = v.default;
  return out;
}

function modeFor(width, breakpoints) {
  const narrow = breakpoints?.narrow ?? 360;
  const medium = breakpoints?.medium ?? 600;
  if (width < narrow) return 'narrow';
  if (width < medium) return 'medium';
  return 'wide';
}

function visibleColumns(columns, mode) {
  return columns.filter((c) => {
    const hb = c.hideBelow;
    if (hb === 'wide' && mode !== 'wide') return false;
    if (hb === 'medium' && mode === 'narrow') return false;
    if (mode === 'narrow' && (c.priority ?? 1) > 1) return false;
    if (mode === 'medium' && (c.priority ?? 1) > 3) return false;
    return true;
  });
}

function alignClass(align) {
  if (align === 'right') return ' dk-table-align-right';
  if (align === 'center') return ' dk-table-align-center';
  return '';
}

function buildColgroup(columns, widthStrategy) {
  if (widthStrategy !== 'proportional') return null;
  const colgroup = document.createElement('colgroup');
  for (const c of columns) {
    const col = document.createElement('col');
    if (c.width) col.style.width = String(c.width);
    colgroup.append(col);
  }
  return colgroup;
}

function applyFloor(td, column) {
  if (typeof column.minCh === 'number') {
    td.style.minWidth = `${column.minCh}ch`;
  }
}

export function render(props = {}) {
  const p = { ...defaults(), ...props };
  const columns = Array.isArray(p.columns) && p.columns.length > 0 ? p.columns : DEFAULT_COLUMNS;
  const rows = Array.isArray(p.rows) ? p.rows : [];

  let mode = 'wide';
  let containerWidth = 0;

  const wrap = document.createElement('div');
  wrap.className = 'dk-table-wrap';

  const scrollHost = document.createElement('div');
  if (p.scroll === 'off') {
    scrollHost.className = 'dk-table-scroll-host';
  } else {
    scrollHost.className = 'dk-table-scroll';
  }
  wrap.append(scrollHost);

  const updateOverflowAffordances = () => {
    if (p.scroll !== 'affordance') {
      wrap.removeAttribute('data-overflow-left');
      wrap.removeAttribute('data-overflow-right');
      return;
    }
    const el = scrollHost;
    const max = el.scrollWidth - el.clientWidth;
    const left = el.scrollLeft > 1;
    const right = max > 1 && el.scrollLeft < max - 1;
    wrap.setAttribute('data-overflow-left', String(left));
    wrap.setAttribute('data-overflow-right', String(right));
  };

  const rebuild = () => {
    scrollHost.innerHTML = '';
    const stacked = p.narrowMode === 'stack' && mode === 'narrow';
    if (stacked) {
      scrollHost.className = 'dk-table-scroll-host';
    } else if (p.scroll === 'off') {
      scrollHost.className = 'dk-table-scroll-host';
    } else {
      scrollHost.className = 'dk-table-scroll';
    }
    const cols = stacked ? columns : visibleColumns(columns, mode);

    const table = document.createElement('table');
    table.className = 'dk-table';
    if (p.widthStrategy === 'proportional') table.classList.add('dk-table-fixed');
    if (p.stickyHeader && !stacked) table.classList.add('dk-table-sticky');
    if (stacked) table.classList.add('dk-table-stacked');
    if (p.clampLines > 0 && !stacked) {
      table.classList.add('dk-table-clamped');
      table.style.setProperty('--dk-table-clamp', String(p.clampLines));
    }

    if (p.caption) {
      const caption = document.createElement('caption');
      caption.textContent = p.caption;
      table.append(caption);
    }

    const colgroup = buildColgroup(cols, p.widthStrategy);
    if (colgroup) table.append(colgroup);

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    for (const c of cols) {
      const th = document.createElement('th');
      th.textContent = c.label ?? c.key;
      th.className = `dk-table-th${alignClass(c.align)}`;
      if (c.nowrap) th.classList.add('dk-table-nowrap');
      headRow.append(th);
    }
    thead.append(headRow);
    table.append(thead);

    const tbody = document.createElement('tbody');

    if (rows.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = Math.max(1, cols.length);
      td.className = 'dk-table-empty';
      td.textContent = p.emptyMessage;
      tr.append(td);
      tbody.append(tr);
    } else {
      rows.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.classList.add('dk-table-clickable');
        tr.tabIndex = 0;
        const dispatch = () => {
          tr.dispatchEvent(new CustomEvent('responsive-table:row-click', {
            bubbles: true,
            detail: { row, index, key: row?.[p.rowKey] ?? null },
          }));
        };
        tr.addEventListener('click', dispatch);
        tr.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            dispatch();
          }
        });

        for (const c of cols) {
          const td = document.createElement('td');
          const value = row?.[c.key];
          const text = value === null || value === undefined || value === '' ? '\u2014' : String(value);
          if (p.clampLines > 0 && !stacked) {
            const inner = document.createElement('span');
            inner.className = 'dk-table-cell';
            inner.textContent = text;
            td.append(inner);
          } else {
            td.textContent = text;
          }
          td.className = `dk-table-td${alignClass(c.align)}`;
          if (c.nowrap) td.classList.add('dk-table-nowrap');
          if (stacked) {
            td.setAttribute('data-label', c.label ?? c.key);
            if (c.primary) td.setAttribute('data-primary', 'true');
          }
          if (p.widthStrategy === 'floor') applyFloor(td, c);
          tr.append(td);
        }
        tbody.append(tr);
      });
    }

    table.append(tbody);
    scrollHost.append(table);
    requestAnimationFrame(updateOverflowAffordances);
  };

  rebuild();

  let observer = null;
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? 0;
      const next = modeFor(w, p.breakpoints);
      const widthChanged = Math.abs(w - containerWidth) > 4;
      containerWidth = w;
      if (next !== mode) {
        mode = next;
        rebuild();
      } else if (widthChanged) {
        updateOverflowAffordances();
      }
    });
    observer.observe(wrap);
  }

  const onScroll = () => updateOverflowAffordances();
  scrollHost.addEventListener('scroll', onScroll, { passive: true });

  const cleanup = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    scrollHost.removeEventListener('scroll', onScroll);
  };

  return { node: wrap, cleanup };
}
