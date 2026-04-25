export const metadata = {
  name: 'ResponsiveTable',
  description: 'Mobile-first table with column-priority hiding, card-stack fallback, sticky headers, horizontal scroll affordances, annotation-aware cells (sentences + sidenotes + presence dots), and configurable width strategy',
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
  rowClickable: { type: 'boolean', default: true },
  initialMode: { type: 'enum', default: 'wide', options: ['narrow', 'medium', 'wide'] },
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

const ANNOTATION_COLUMNS = [
  { key: 'term',     label: 'Term',     priority: 1, primary: true, nowrap: true },
  { key: 'gloss',    label: 'Gloss',    priority: 1, type: 'sentences' },
  {
    key: 'scope',
    label: 'Scope',
    priority: 2,
    type: 'presence',
    categories: [
      { key: 'lexical',  label: 'Lexical' },
      { key: 'syntactic', label: 'Syntactic' },
      { key: 'semantic', label: 'Semantic' },
      { key: 'runtime',  label: 'Runtime' },
    ],
  },
];

const ANNOTATION_ROWS = [
  {
    id: 'bind',
    term: 'Binding',
    gloss: [
      { text: 'A binding associates a name with a value.' },
      {
        text: 'In Lean, `let x := 2` introduces a binding whose scope is the expression that follows.',
        sidenote: {
          label: 'Let-bindings',
          body: { html: '<p>Let-bindings are non-recursive by default. For recursive definitions use <code>let rec</code> or a top-level <code>def</code>.</p>' },
        },
      },
      {
        text: 'Bindings shadow earlier ones with the same name.',
        sidenote: {
          label: 'Shadowing',
          body: { html: '<p>Shadowing is legal but can obscure the source of a name. Lean will warn if the shadow is unused.</p>' },
        },
      },
    ],
    scope: ['lexical', 'semantic'],
  },
  {
    id: 'prop',
    term: 'Proposition',
    gloss: [
      { text: 'A proposition is a type whose inhabitants are proofs.' },
      {
        text: 'Propositions live in the universe `Prop`, which is definitionally proof-irrelevant.',
        sidenote: {
          label: 'Proof irrelevance',
          body: { html: '<p>Any two proofs of the same proposition are definitionally equal. This lets the compiler erase proofs at runtime without changing program meaning.</p>' },
        },
      },
    ],
    scope: ['semantic'],
  },
  {
    id: 'tactic',
    term: 'Tactic',
    gloss: [
      {
        text: 'A tactic is an imperative step that incrementally constructs a proof term.',
        sidenote: {
          label: 'Tactic vs. term mode',
          body: { html: '<p>Term mode writes the proof directly; tactic mode scripts its construction. Both produce the same proof term once elaborated.</p>' },
        },
      },
      { text: 'Tactics run in a monad that tracks the current goal and hypotheses.' },
    ],
    scope: ['syntactic', 'semantic', 'runtime'],
  },
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
    name: 'annotated',
    description: 'Sentence-per-line cells with sidenote references (inline disclosure when wide, bottom-sheet popup when narrow) and presence-dot membership indicators',
    props: {
      caption: 'Lean vocabulary',
      columns: ANNOTATION_COLUMNS,
      rows: ANNOTATION_ROWS,
      rowClickable: false,
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

function sidenoteRef(note, ctx) {
  const index = ctx.sidenoteIndex++;
  const id = `${ctx.tableId}-sn-${index}`;
  ctx.sidenoteStore.set(id, note);
  const ref = document.createElement('button');
  ref.type = 'button';
  ref.className = 'dk-sn-ref';
  ref.dataset.snId = id;
  ref.dataset.testid = 'sidenote-ref';
  ref.setAttribute('aria-label', `Sidenote ${index + 1}`);
  ref.setAttribute('aria-expanded', 'false');
  ref.textContent = String(index + 1);
  return ref;
}

function renderTextContent(td, value, column, ctx, isStacked) {
  let text;
  let sidenote = null;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    text = value.text ?? '';
    sidenote = value.sidenote ?? null;
  } else {
    text = value === null || value === undefined || value === '' ? '—' : String(value);
  }

  if (ctx.clampLines > 0 && !isStacked) {
    const inner = document.createElement('span');
    inner.className = 'dk-table-cell';
    inner.textContent = text;
    td.append(inner);
    if (sidenote) td.append(sidenoteRef(sidenote, ctx));
    return;
  }
  td.append(document.createTextNode(text));
  if (sidenote) td.append(sidenoteRef(sidenote, ctx));
}

function renderSentencesContent(td, value, ctx) {
  const sentences = Array.isArray(value) ? value : [];
  if (sentences.length === 0) {
    td.textContent = '—';
    return;
  }
  const list = document.createElement('ol');
  list.className = 'dk-sentences';
  for (const s of sentences) {
    const li = document.createElement('li');
    li.className = 'dk-sentence';
    const text = typeof s === 'string' ? s : (s?.text ?? '');
    li.append(document.createTextNode(text));
    if (s && typeof s === 'object' && s.sidenote) {
      li.append(' ');
      li.append(sidenoteRef(s.sidenote, ctx));
    }
    list.append(li);
  }
  td.append(list);
}

function renderPresenceContent(td, column, value) {
  const categories = Array.isArray(column.categories) ? column.categories : [];
  const present = new Set(Array.isArray(value) ? value : []);
  if (categories.length === 0) {
    td.textContent = '—';
    return;
  }
  const wrap = document.createElement('span');
  wrap.className = 'dk-presence';
  wrap.setAttribute('role', 'list');
  for (const cat of categories) {
    const dot = document.createElement('span');
    const isPresent = present.has(cat.key);
    dot.className = isPresent ? 'dk-presence-dot dk-presence-dot-on' : 'dk-presence-dot';
    dot.dataset.testid = 'presence-dot';
    dot.dataset.category = cat.key;
    dot.dataset.present = String(isPresent);
    dot.setAttribute('role', 'listitem');
    dot.setAttribute('title', `${cat.label}: ${isPresent ? 'present' : 'absent'}`);
    dot.setAttribute('aria-label', `${cat.label}: ${isPresent ? 'present' : 'absent'}`);
    wrap.append(dot);
  }
  td.append(wrap);
}

let tableInstanceCounter = 0;

export function render(props = {}) {
  const p = { ...defaults(), ...props };
  const columns = Array.isArray(p.columns) && p.columns.length > 0 ? p.columns : DEFAULT_COLUMNS;
  const rows = Array.isArray(p.rows) ? p.rows : [];
  const tableId = `dk-rt-${++tableInstanceCounter}`;

  let mode = p.initialMode;
  let containerWidth = 0;

  const wrap = document.createElement('div');
  wrap.className = 'dk-table-wrap';
  wrap.dataset.dkTable = tableId;

  const scrollHost = document.createElement('div');
  if (p.scroll === 'off') {
    scrollHost.className = 'dk-table-scroll-host';
  } else {
    scrollHost.className = 'dk-table-scroll';
  }
  wrap.append(scrollHost);

  const sidenoteStore = new Map();
  // Sidenote overlay state — tagged variant. Only one of these shapes is ever live:
  //   { kind: 'closed' }
  //   { kind: 'inline', id, ref, panel }
  //   { kind: 'popup',  id, ref, popup, backdrop }
  // Extraction candidate: when a second component needs annotations, lift the
  // overlay (state + open/close/toggle + keydown) into components/sidenote-overlay.js.
  let sidenoteState = { kind: 'closed' };

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

  // Body contract: Node (trusted by construction), { html: string } (trusted markup,
  // explicit opt-in), { text: string } or bare string (treated as plain text — safe default).
  const appendNoteBody = (container, body) => {
    if (body instanceof Node) {
      container.append(body);
    } else if (body && typeof body === 'object' && typeof body.html === 'string') {
      container.innerHTML = body.html;
    } else if (body && typeof body === 'object' && typeof body.text === 'string') {
      container.textContent = body.text;
    } else if (typeof body === 'string') {
      container.textContent = body;
    }
  };

  const closeSidenote = () => {
    if (sidenoteState.kind === 'closed') return;
    const ref = sidenoteState.ref;
    if (sidenoteState.kind === 'inline') {
      sidenoteState.panel.remove();
    } else {
      const { popup, backdrop } = sidenoteState;
      popup.classList.remove('dk-sn-visible');
      backdrop.classList.remove('dk-sn-visible');
      const done = () => {
        popup.remove();
        backdrop.remove();
      };
      popup.addEventListener('transitionend', done, { once: true });
    }
    ref.setAttribute('aria-expanded', 'false');
    sidenoteState = { kind: 'closed' };
  };

  const buildSidenoteBody = (note) => {
    const body = document.createElement('div');
    body.className = 'dk-sn-body';
    if (note.label) {
      const label = document.createElement('span');
      label.className = 'dk-sn-label';
      label.textContent = note.label;
      body.append(label);
    }
    const content = document.createElement('div');
    content.className = 'dk-sn-content';
    appendNoteBody(content, note.body);
    body.append(content);
    return body;
  };

  const openInline = (id, ref, note) => {
    const host = ref.closest('.dk-sentence') ?? ref.parentElement;
    if (!host) return;
    const panel = document.createElement('div');
    panel.className = 'dk-sn-inline';
    panel.dataset.testid = 'sidenote-inline';
    panel.append(buildSidenoteBody(note));
    host.append(panel);
    sidenoteState = { kind: 'inline', id, ref, panel };
  };

  const openPopup = (id, ref, note) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'dk-sn-backdrop';
    backdrop.dataset.testid = 'sidenote-backdrop';
    backdrop.addEventListener('click', closeSidenote);

    const popup = document.createElement('div');
    popup.className = 'dk-sn-popup';
    popup.dataset.testid = 'sidenote-popup';
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-label', note.label || 'Sidenote');

    const header = document.createElement('div');
    header.className = 'dk-sn-popup-header';
    const label = document.createElement('span');
    label.className = 'dk-sn-label';
    label.textContent = note.label || 'Sidenote';
    header.append(label);
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'dk-sn-close';
    close.dataset.testid = 'sidenote-close';
    close.setAttribute('aria-label', 'Close sidenote');
    close.textContent = '×';
    close.addEventListener('click', closeSidenote);
    header.append(close);
    popup.append(header);

    const content = document.createElement('div');
    content.className = 'dk-sn-popup-body';
    appendNoteBody(content, note.body);
    popup.append(content);

    document.body.append(backdrop);
    document.body.append(popup);
    sidenoteState = { kind: 'popup', id, ref, popup, backdrop };

    requestAnimationFrame(() => {
      backdrop.classList.add('dk-sn-visible');
      popup.classList.add('dk-sn-visible');
      close.focus();
    });
  };

  const toggleSidenote = (ref) => {
    const id = ref.dataset.snId;
    if (!id) return;
    if (sidenoteState.kind !== 'closed' && sidenoteState.id === id) {
      closeSidenote();
      return;
    }
    closeSidenote();
    const note = sidenoteStore.get(id);
    if (!note) return;
    ref.setAttribute('aria-expanded', 'true');
    if (mode === 'wide') openInline(id, ref, note);
    else openPopup(id, ref, note);
  };

  const onScrollHostClick = (e) => {
    const ref = e.target.closest('.dk-sn-ref');
    if (!ref || !scrollHost.contains(ref)) return;
    e.preventDefault();
    e.stopPropagation();
    toggleSidenote(ref);
  };

  const onDocKeydown = (e) => {
    if (e.key === 'Escape' && sidenoteState.kind !== 'closed') {
      e.preventDefault();
      const ref = sidenoteState.ref;
      closeSidenote();
      ref?.focus();
    }
  };

  const rebuild = () => {
    closeSidenote();
    sidenoteStore.clear();
    scrollHost.innerHTML = '';

    const stacked = p.narrowMode === 'stack' && mode === 'narrow';
    if (stacked || p.scroll === 'off') {
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
    const ctx = {
      tableId,
      sidenoteIndex: 0,
      sidenoteStore,
      clampLines: p.clampLines,
    };

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
        if (p.rowClickable) {
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
        }

        for (const c of cols) {
          const td = document.createElement('td');
          td.className = `dk-table-td${alignClass(c.align)}`;
          if (c.nowrap) td.classList.add('dk-table-nowrap');
          if (stacked) {
            td.setAttribute('data-label', c.label ?? c.key);
            if (c.primary) td.setAttribute('data-primary', 'true');
          }
          if (p.widthStrategy === 'floor') applyFloor(td, c);

          const value = row?.[c.key];
          const type = c.type ?? 'text';
          if (type === 'sentences') renderSentencesContent(td, value, ctx);
          else if (type === 'presence') renderPresenceContent(td, c, value);
          else renderTextContent(td, value, c, ctx, stacked);

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
  scrollHost.addEventListener('click', onScrollHostClick);
  document.addEventListener('keydown', onDocKeydown);

  const cleanup = () => {
    closeSidenote();
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    scrollHost.removeEventListener('scroll', onScroll);
    scrollHost.removeEventListener('click', onScrollHostClick);
    document.removeEventListener('keydown', onDocKeydown);
  };

  return { node: wrap, cleanup };
}
