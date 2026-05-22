// Node-runnable tests for the application runtime (app-runtime.js). The
// reactive core is pure data — no DOM — so it tests cleanly in node:test; the
// bindings, `each`, and createApp run against mini-dom.mjs, a faithful minimal
// DOM. The wrapper pytest at tests/test_app_runtime_js.py invokes this file via
// `node --test`.
//
// Run directly:  node --test tests/static_js/app_runtime.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  signal,
  effect,
  derive,
  batch,
  onCleanup,
  createRoot,
  createScope,
  bindText,
  bindAttr,
  bindClass,
  bindShow,
  bindValue,
  each,
  createApp,
  dispatchOnEvent,
  localStorageEffect,
  urlSyncEffect,
} from '../../components/system/app-runtime.js';

import { install } from './mini-dom.mjs';

// ===========================================================================
// 1. Reactive core
// ===========================================================================

test('signal: read returns value, set updates, peek is untracked', () => {
  const s = signal(1);
  assert.equal(s(), 1);
  s.set(2);
  assert.equal(s(), 2);
  assert.equal(s.peek(), 2);
});

test('effect: runs once immediately, re-runs when a read dep changes', () => {
  const s = signal(0);
  let runs = 0;
  let seen;
  createRoot(() => {
    effect(() => {
      runs++;
      seen = s();
    });
  });
  assert.equal(runs, 1);
  assert.equal(seen, 0);
  s.set(5);
  assert.equal(runs, 2);
  assert.equal(seen, 5);
});

test('effect: unchanged set (Object.is) does not re-run', () => {
  const s = signal(3);
  let runs = 0;
  createRoot(() => effect(() => { runs++; s(); }));
  assert.equal(runs, 1);
  s.set(3); // same value
  assert.equal(runs, 1);
});

test('effect: dependencies are dynamic — only the deps read on the last run', () => {
  const a = signal(1);
  const b = signal(2);
  const useA = signal(true);
  let runs = 0;
  createRoot(() => {
    effect(() => {
      runs++;
      useA() ? a() : b();
    });
  });
  assert.equal(runs, 1); // subscribed to useA + a

  b.set(99); // not a dep yet
  assert.equal(runs, 1);

  a.set(5);
  assert.equal(runs, 2);

  useA.set(false); // re-run now subscribes b, drops a
  assert.equal(runs, 3);

  a.set(6); // no longer a dep
  assert.equal(runs, 3);

  b.set(100); // now a dep
  assert.equal(runs, 4);
});

test('derive: computes from signals and updates, exposes no .set', () => {
  const a = signal(2);
  const b = signal(3);
  let sum;
  createRoot(() => {
    const total = derive(() => a() + b());
    assert.equal(typeof total.set, 'undefined');
    effect(() => { sum = total(); });
  });
  assert.equal(sum, 5);
  a.set(10);
  assert.equal(sum, 13);
});

test('batch: coalesces multiple sets into one downstream pass', () => {
  const x = signal(0);
  const y = signal(0);
  let runs = 0;
  createRoot(() => effect(() => { runs++; x(); y(); }));
  assert.equal(runs, 1);
  batch(() => {
    x.set(1);
    y.set(1);
  });
  assert.equal(runs, 2); // single re-run, not two
});

test('effect cleanup: returned cleanup runs before re-run and on dispose', () => {
  const s = signal(0);
  const log = [];
  let dispose;
  createRoot(() => {
    dispose = effect(() => {
      const v = s();
      log.push(`run${v}`);
      return () => log.push(`cleanup${v}`);
    });
  });
  assert.deepEqual(log, ['run0']);
  s.set(1);
  assert.deepEqual(log, ['run0', 'cleanup0', 'run1']);
  dispose();
  assert.deepEqual(log, ['run0', 'cleanup0', 'run1', 'cleanup1']);
});

test('onCleanup: registered callback runs on re-run and on dispose', () => {
  const s = signal(0);
  const log = [];
  let dispose;
  createRoot(() => {
    dispose = effect(() => {
      const v = s();
      onCleanup(() => log.push(`clean${v}`));
    });
  });
  s.set(1);
  assert.deepEqual(log, ['clean0']);
  dispose();
  assert.deepEqual(log, ['clean0', 'clean1']);
});

test('disposal is transitive across nested scopes', () => {
  const log = [];
  createRoot((disposeRoot) => {
    createScope(() => {
      effect(() => onCleanup(() => log.push('inner')));
      createScope(() => {
        effect(() => onCleanup(() => log.push('deep')));
      });
    });
    assert.deepEqual(log, []);
    disposeRoot();
  });
  assert.deepEqual(log.sort(), ['deep', 'inner']);
});

test('createScope: disposing one scope leaves siblings alive', () => {
  const a = signal(0);
  const b = signal(0);
  let aRuns = 0;
  let bRuns = 0;
  createRoot(() => {
    const [, disposeA] = createScope(() => effect(() => { aRuns++; a(); }));
    createScope(() => effect(() => { bRuns++; b(); }));
    assert.equal(aRuns, 1);
    assert.equal(bRuns, 1);
    disposeA();
    a.set(1); // scope A disposed — no re-run
    b.set(1); // scope B alive — re-runs
    assert.equal(aRuns, 1);
    assert.equal(bRuns, 2);
  });
});

test('dispose is idempotent', () => {
  const log = [];
  let dispose;
  createRoot(() => {
    dispose = effect(() => onCleanup(() => log.push('x')));
  });
  dispose();
  dispose(); // second call is a no-op
  assert.deepEqual(log, ['x']);
});

test('setting a signal inside its own effect does not loop', () => {
  const s = signal(0);
  let runs = 0;
  createRoot(() => {
    effect(() => {
      runs++;
      const v = s();
      if (v < 1) s.set(v + 1); // would loop without the self-guard
    });
  });
  assert.equal(runs, 1);
  assert.equal(s.peek(), 1);
});

// ===========================================================================
// 2. DOM bindings
// ===========================================================================

test('bindText: writes textContent and updates in place', () => {
  const dom = install();
  try {
    const node = dom.document.createElement('span');
    const s = signal('hi');
    createRoot(() => bindText(node, () => s()));
    assert.equal(node.textContent, 'hi');
    s.set('bye');
    assert.equal(node.textContent, 'bye');
  } finally {
    dom.teardown();
  }
});

test('bindAttr: null/false removes, true sets empty, value stringifies', () => {
  const dom = install();
  try {
    const node = dom.document.createElement('div');
    const v = signal('a');
    createRoot(() => bindAttr(node, 'data-x', () => v()));
    assert.equal(node.getAttribute('data-x'), 'a');
    v.set(true);
    assert.equal(node.getAttribute('data-x'), '');
    v.set(false);
    assert.equal(node.hasAttribute('data-x'), false);
    v.set(7);
    assert.equal(node.getAttribute('data-x'), '7');
    v.set(null);
    assert.equal(node.hasAttribute('data-x'), false);
  } finally {
    dom.teardown();
  }
});

test('bindClass: toggles a class from a boolean accessor', () => {
  const dom = install();
  try {
    const node = dom.document.createElement('div');
    const on = signal(false);
    createRoot(() => bindClass(node, 'active', () => on()));
    assert.equal(node.classList.contains('active'), false);
    on.set(true);
    assert.equal(node.classList.contains('active'), true);
    on.set(false);
    assert.equal(node.classList.contains('active'), false);
  } finally {
    dom.teardown();
  }
});

test('bindShow: toggles display, preserving the original value', () => {
  const dom = install();
  try {
    const node = dom.document.createElement('div');
    node.style.display = 'flex';
    const shown = signal(true);
    createRoot(() => bindShow(node, () => shown()));
    assert.equal(node.style.display, 'flex');
    shown.set(false);
    assert.equal(node.style.display, 'none');
    shown.set(true);
    assert.equal(node.style.display, 'flex'); // restored, not clobbered to ''
  } finally {
    dom.teardown();
  }
});

test('bindValue: writes value but skips writes mid-IME-composition', () => {
  const dom = install();
  try {
    const input = dom.document.createElement('input');
    const s = signal('hello');
    createRoot(() => bindValue(input, () => s()));
    assert.equal(input.value, 'hello');
    s.set('world');
    assert.equal(input.value, 'world');

    dom.document.activeElement = input;
    input.dispatchEvent({ type: 'compositionstart' });
    s.set('IGNORED'); // active + composing -> write skipped
    assert.equal(input.value, 'world');

    input.dispatchEvent({ type: 'compositionend' });
    s.set('done');
    assert.equal(input.value, 'done');
  } finally {
    dom.teardown();
  }
});

// ===========================================================================
// 3. Keyed lists (each)
// ===========================================================================

const texts = (parent) => parent.childNodes.map((n) => n.textContent);

test('each: renders the initial list in order', () => {
  const dom = install();
  try {
    const parent = dom.document.createElement('ul');
    const list = signal([
      { id: 'a', v: 1 },
      { id: 'b', v: 2 },
      { id: 'c', v: 3 },
    ]);
    createRoot(() => {
      each(parent, () => list(), (it) => it.id, (item, key) => {
        const li = dom.document.createElement('li');
        effect(() => { li.textContent = `${key}:${item().v}`; });
        return li;
      });
    });
    assert.deepEqual(texts(parent), ['a:1', 'b:2', 'c:3']);
  } finally {
    dom.teardown();
  }
});

test('each: reorder preserves node identity', () => {
  const dom = install();
  try {
    const parent = dom.document.createElement('ul');
    const list = signal([
      { id: 'a', v: 1 },
      { id: 'b', v: 2 },
      { id: 'c', v: 3 },
    ]);
    createRoot(() => {
      each(parent, () => list(), (it) => it.id, (item, key) => {
        const li = dom.document.createElement('li');
        effect(() => { li.textContent = `${key}:${item().v}`; });
        return li;
      });
    });
    const [nodeA, nodeB, nodeC] = parent.childNodes;

    list.set([
      { id: 'c', v: 3 },
      { id: 'a', v: 1 },
      { id: 'b', v: 2 },
    ]);
    assert.deepEqual(texts(parent), ['c:3', 'a:1', 'b:2']);
    // same node objects, just repositioned
    assert.equal(parent.childNodes[0], nodeC);
    assert.equal(parent.childNodes[1], nodeA);
    assert.equal(parent.childNodes[2], nodeB);
  } finally {
    dom.teardown();
  }
});

test('each: in-place data update keeps the same node', () => {
  const dom = install();
  try {
    const parent = dom.document.createElement('ul');
    const list = signal([{ id: 'a', v: 1 }]);
    createRoot(() => {
      each(parent, () => list(), (it) => it.id, (item, key) => {
        const li = dom.document.createElement('li');
        effect(() => { li.textContent = `${key}:${item().v}`; });
        return li;
      });
    });
    const nodeA = parent.childNodes[0];
    list.set([{ id: 'a', v: 42 }]);
    assert.equal(parent.childNodes[0], nodeA); // not re-created
    assert.equal(nodeA.textContent, 'a:42');
  } finally {
    dom.teardown();
  }
});

test('each: removing an item detaches its node and disposes its scope', () => {
  const dom = install();
  try {
    const parent = dom.document.createElement('ul');
    const list = signal([
      { id: 'a', v: 1 },
      { id: 'b', v: 2 },
    ]);
    const cleaned = [];
    createRoot(() => {
      each(parent, () => list(), (it) => it.id, (item, key) => {
        const li = dom.document.createElement('li');
        effect(() => { li.textContent = `${key}:${item().v}`; });
        onCleanup(() => cleaned.push(key));
        return li;
      });
    });
    const nodeB = parent.childNodes[1];
    list.set([{ id: 'a', v: 1 }]);
    assert.deepEqual(texts(parent), ['a:1']);
    assert.equal(nodeB.parentNode, null); // detached
    assert.deepEqual(cleaned, ['b']); // scope disposed
  } finally {
    dom.teardown();
  }
});

test('each: appending a new item allocates only that node', () => {
  const dom = install();
  try {
    const parent = dom.document.createElement('ul');
    const list = signal([{ id: 'a', v: 1 }]);
    createRoot(() => {
      each(parent, () => list(), (it) => it.id, (item, key) => {
        const li = dom.document.createElement('li');
        effect(() => { li.textContent = `${key}:${item().v}`; });
        return li;
      });
    });
    const nodeA = parent.childNodes[0];
    list.set([
      { id: 'a', v: 1 },
      { id: 'd', v: 4 },
    ]);
    assert.deepEqual(texts(parent), ['a:1', 'd:4']);
    assert.equal(parent.childNodes[0], nodeA); // existing node untouched
  } finally {
    dom.teardown();
  }
});

// ===========================================================================
// 4. Application (createApp)
// ===========================================================================

const appReducer = (state, action) => {
  switch (action.type) {
    case 'inc':
      return { ...state, count: state.count + 1 };
    case 'rename':
      return { ...state, name: action.name };
    default:
      return state;
  }
};

test('createApp: dispatch re-runs only bindings reading changed slices', () => {
  const dom = install();
  try {
    const root = dom.document.createElement('div');
    let countRuns = 0;
    let nameRuns = 0;
    const app = createApp({
      initialState: { count: 0, name: 'a' },
      reducer: appReducer,
      root,
      render: ({ state }) => {
        const wrap = dom.document.createElement('div');
        const c = dom.document.createElement('span');
        const n = dom.document.createElement('span');
        effect(() => { countRuns++; c.textContent = String(state.count()); });
        effect(() => { nameRuns++; n.textContent = state.name(); });
        wrap.appendChild(c);
        wrap.appendChild(n);
        return wrap;
      },
    });
    assert.equal(countRuns, 1);
    assert.equal(nameRuns, 1);
    assert.equal(root.firstChild.childNodes[0].textContent, '0');

    app.dispatch({ type: 'inc' });
    assert.equal(app.getState().count, 1);
    assert.equal(countRuns, 2);
    assert.equal(nameRuns, 1); // name slice unchanged -> no re-run
    assert.equal(root.firstChild.childNodes[0].textContent, '1');

    app.dispatch({ type: 'rename', name: 'b' });
    assert.equal(nameRuns, 2);
    assert.equal(countRuns, 2);

    app.dispatch({ type: 'noop' }); // reducer returns same state
    assert.equal(countRuns, 2);
    assert.equal(nameRuns, 2);

    app.dispose();
    assert.equal(root.childNodes.length, 0);
  } finally {
    dom.teardown();
  }
});

test('createApp: app-level effects receive {state,dispatch,getState} and clean up', () => {
  const dom = install();
  try {
    const root = dom.document.createElement('div');
    const seen = [];
    const cleaned = [];
    const app = createApp({
      initialState: { count: 0 },
      reducer: appReducer,
      root,
      effects: [
        ({ state }) => {
          effect(() => seen.push(state.count()));
          return () => cleaned.push('done');
        },
      ],
      render: () => dom.document.createElement('div'),
    });
    assert.deepEqual(seen, [0]);
    app.dispatch({ type: 'inc' });
    assert.deepEqual(seen, [0, 1]);
    app.dispose();
    assert.deepEqual(cleaned, ['done']);
  } finally {
    dom.teardown();
  }
});

// ===========================================================================
// 5. Effect helpers
// ===========================================================================

test('dispatchOnEvent: wires an event to dispatch and cleans up', () => {
  const dom = install();
  try {
    const button = dom.document.createElement('button');
    const dispatched = [];
    const fx = dispatchOnEvent(button, 'click', () => ({ type: 'inc' }));
    const cleanup = fx({ dispatch: (a) => dispatched.push(a) });
    button.dispatchEvent({ type: 'click' });
    assert.deepEqual(dispatched, [{ type: 'inc' }]);
    cleanup();
    button.dispatchEvent({ type: 'click' }); // listener removed
    assert.equal(dispatched.length, 1);
  } finally {
    dom.teardown();
  }
});

test('localStorageEffect: persists a slice when it changes', () => {
  const dom = install();
  const store = new Map();
  globalThis.localStorage = {
    setItem: (k, v) => store.set(k, v),
    getItem: (k) => (store.has(k) ? store.get(k) : null),
  };
  try {
    const width = signal(200);
    const state = { width };
    createRoot(() => {
      const fx = localStorageEffect('w', (s) => s.width());
      fx({ state });
    });
    assert.equal(store.get('w'), '200');
    width.set(320);
    assert.equal(store.get('w'), '320');
  } finally {
    delete globalThis.localStorage;
    dom.teardown();
  }
});

test('urlSyncEffect: reflects a slice into a query param', () => {
  const dom = install();
  let href = 'https://example.test/app';
  dom.window.location = { get href() { return href; } };
  dom.window.history = {
    replaceState: (_s, _t, url) => { href = String(url); },
  };
  try {
    const view = signal('explore');
    const state = { view };
    createRoot(() => {
      const fx = urlSyncEffect('view', (s) => s.view());
      fx({ state, dispatch: () => {} });
    });
    // 'explore' is non-empty, so it is written
    assert.match(href, /[?&]view=explore/);
    view.set('query');
    assert.match(href, /[?&]view=query/);
    view.set(''); // empty removes the param
    assert.doesNotMatch(href, /view=/);
  } finally {
    dom.teardown();
  }
});
