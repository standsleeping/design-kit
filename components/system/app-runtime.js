// Application runtime: the in-house reactive engine that turns a reducer into
// DOM. It implements the render-update contract (mutate in place, never
// replace), DOM-identity preservation, an owner-disposed effect lifecycle,
// and named-slot composition.
//
// It is distinct from the host runtime in ./runtime.js, which scans component
// pools for the storybook. This module is what an *application* is built on.
//
// Shape: fine-grained signals (VanJS / Solid lineage) driven by a single
// reducer (Hyperapp lineage). No VDOM, no build step, light DOM only. The
// reducer is the source of truth; signals are the transmission medium from
// reducer state to DOM. The whole engine is meant to be read in one sitting.
//
// Sections:
//   1. Reactive core   signal / effect / derive / batch / onCleanup / scopes
//   2. DOM bindings    bindText / bindAttr / bindClass / bindShow / bindValue
//   3. Keyed lists     each
//   4. Application      createApp
//   5. Effect helpers  urlSyncEffect / localStorageEffect / dispatchOnEvent

// ---------------------------------------------------------------------------
// Typedefs
// ---------------------------------------------------------------------------

/**
 * A reactive node: an effect, derivation, or scope within the ownership tree.
 * @typedef {{
 *   fn: (() => unknown) | null,
 *   parent: ReactiveNode | null,
 *   owned: Set<ReactiveNode>,
 *   deps: Set<Set<ReactiveNode>>,
 *   cleanups: Array<() => void>,
 *   onRun: (() => void) | null,
 *   disposed: boolean,
 * }} ReactiveNode
 */

/**
 * A signal read function with .set() and .peek() properties.
 * @template T
 * @typedef {((() => T) & { set: (next: T) => void; peek: () => T })} SignalAccessor
 */

/**
 * A read-only accessor: callable, with a .peek() escape hatch, but no setter.
 * Derived values use this. They update from their dependencies, never directly.
 * @template T
 * @typedef {((() => T) & { peek: () => T })} ReadAccessor
 */

/**
 * The state map exposed to the application: each key is a SignalAccessor.
 * @typedef {Record<string, SignalAccessor<unknown>>} AppState
 */

/**
 * The context object passed to effects and the render function.
 * @typedef {{
 *   state: AppState,
 *   dispatch: (action: unknown) => unknown,
 *   getState: () => unknown,
 * }} AppContext
 */

/**
 * An application effect factory: called once at startup with AppContext,
 * optionally returns a cleanup.
 * @typedef {(ctx: AppContext) => (() => void) | void} AppEffect
 */

/**
 * The handle returned by createApp.
 * @typedef {{
 *   state: AppState,
 *   dispatch: (action: unknown) => unknown,
 *   getState: () => unknown,
 *   dispose: () => void,
 * }} AppHandle
 */

/**
 * A focus/selection snapshot used by the keyed list.
 * @typedef {{
 *   el: Element,
 *   selection: { start: number, end: number | null, dir: "none" | "forward" | "backward" | null } | null
 * }} FocusSnapshot
 */

// ---------------------------------------------------------------------------
// 1. Reactive core
// ---------------------------------------------------------------------------
// An observer (an effect or a derivation) tracks the signals it reads while it
// runs; re-running it drops the previous run's subscriptions, so its dependency
// set is always exactly what the last run touched. An owner is a node in the
// disposal tree: app root -> component scopes -> effects (§6 ownership tiers).
// Disposing an owner runs cleanups and disposes its children transitively.

/** @type {ReactiveNode | null} */
let currentObserver = null; // observer that signal reads subscribe
/** @type {ReactiveNode | null} */
let currentOwner = null; // owner that new effects / scopes attach to
let batchDepth = 0;
/** @type {Set<ReactiveNode>} */
const pending = new Set(); // observers queued during a batch (deduped)

/**
 * @param {(() => unknown) | null} fn
 * @param {ReactiveNode | null} parent
 * @returns {ReactiveNode}
 */
function makeNode(fn, parent) {
  /** @type {ReactiveNode} */
  const node = {
    fn, // null for a pure scope; set for an effect / derivation
    parent,
    owned: new Set(), // child owners and effects
    deps: new Set(), // signal subscriber-sets this node belongs to
    cleanups: [], // onCleanup callbacks
    onRun: null, // cleanup returned by the last effect-body run
    disposed: false,
  };
  if (parent) parent.owned.add(node);
  return node;
}

// Tear down everything from a node's previous run, keeping the node attached to
// its parent. Used by re-run (keep) and, with a detach, by dispose.
/**
 * @param {ReactiveNode} node
 * @returns {void}
 */
function cleanupNode(node) {
  for (const child of [...node.owned]) disposeNode(child);
  node.owned.clear();
  if (node.onRun) {
    node.onRun();
    node.onRun = null;
  }
  for (const c of node.cleanups) c();
  node.cleanups.length = 0;
  for (const subs of node.deps) subs.delete(node);
  node.deps.clear();
}

// Idempotent: a second call is a no-op (§6 disposal semantics).
/**
 * @param {ReactiveNode} node
 * @returns {void}
 */
function disposeNode(node) {
  if (node.disposed) return;
  cleanupNode(node);
  node.disposed = true;
  if (node.parent) node.parent.owned.delete(node);
}

/**
 * @param {ReactiveNode} node
 * @returns {void}
 */
function runNode(node) {
  if (node.disposed) return;
  cleanupNode(node); // previous cleanup runs first, then we re-subscribe
  const prevObserver = currentObserver;
  const prevOwner = currentOwner;
  currentObserver = node;
  currentOwner = node;
  try {
    // Only a returned function is a cleanup; ignore other return values so an
    // effect body whose last expression happens to be truthy is harmless.
    const result = /** @type {ReactiveNode} */ (node).fn?.();
    node.onRun = typeof result === 'function' ? /** @type {() => void} */ (result) : null;
  } finally {
    currentObserver = prevObserver;
    currentOwner = prevOwner;
  }
}

/**
 * Create a reactive signal. Reading inside an effect tracks the dependency;
 * writing notifies all subscribers.
 *
 * @template T
 * @param {T} initial
 * @returns {SignalAccessor<T>}
 */
export function signal(initial) {
  /** @type {T} */
  let value = initial;
  /** @type {Set<ReactiveNode>} */
  const subs = new Set();
  /** @type {SignalAccessor<T>} */
  const read = /** @type {SignalAccessor<T>} */ (Object.assign(
    () => {
      if (currentObserver) {
        subs.add(currentObserver);
        currentObserver.deps.add(subs);
      }
      return value;
    },
    {
      /** @param {T} next */
      set: (next) => {
        if (Object.is(next, value)) return; // no-op on unchanged
        value = next;
        for (const obs of [...subs]) {
          if (obs === currentObserver) continue; // never re-enter the running observer
          if (batchDepth > 0) pending.add(obs);
          else runNode(obs);
        }
      },
      peek: () => value, // untracked read
    },
  ));
  return read;
}

/**
 * Run fn immediately as a reactive effect and re-run it whenever any signal it
 * reads changes. Returns a dispose function that stops the effect.
 *
 * @param {() => (void | (() => void))} fn
 * @returns {() => void}
 */
export function effect(fn) {
  const node = makeNode(fn, currentOwner);
  runNode(node);
  return () => disposeNode(node);
}

/**
 * Derive a read-only signal from a computation that can itself read other
 * signals. The derived value updates whenever its dependencies change.
 *
 * @template T
 * @param {() => T} fn
 * @returns {ReadAccessor<T>}
 */
export function derive(fn) {
  const out = signal(/** @type {T} */ (undefined));
  effect(() => out.set(fn()));
  const read = /** @type {ReadAccessor<T>} */ (
    Object.assign(() => out(), { peek: out.peek })
  );
  return read; // read-only view: no .set, matching the runtime contract
}

/**
 * Coalesce the signal updates produced inside fn into one downstream pass, so a
 * reducer that touches N slices triggers each affected binding at most once.
 *
 * @template T
 * @param {() => T} fn
 * @returns {T}
 */
export function batch(fn) {
  batchDepth++;
  try {
    return fn();
  } finally {
    if (--batchDepth === 0) {
      const queue = [...pending];
      pending.clear();
      for (const obs of queue) runNode(obs);
    }
  }
}

/**
 * Register a cleanup on the current owner; runs on re-run or owner disposal.
 * Returns nothing, so a concise effect body `() => onCleanup(...)` does not
 * accidentally register the cleanup a second time as the body's return value.
 *
 * @param {() => void} fn
 * @returns {void}
 */
export function onCleanup(fn) {
  if (currentOwner) currentOwner.cleanups.push(fn);
}

/**
 * Run fn under a fresh root owner (no parent). fn receives a dispose() that
 * tears the whole tree down. createApp builds on this.
 *
 * @template T
 * @param {(dispose: () => void) => T} fn
 * @returns {T}
 */
export function createRoot(fn) {
  const root = makeNode(null, null);
  const prevOwner = currentOwner;
  currentOwner = root;
  try {
    return fn(() => disposeNode(root));
  } finally {
    currentOwner = prevOwner;
  }
}

/**
 * Run fn under a fresh child owner; return [result, dispose]. One scope per
 * component instance (§6 tier 2): disposing it tears down that instance's
 * effects transitively. A scope does not subscribe to reads, so signals read at
 * the top of a render body do not make the whole instance reactive. Only
 * bindings do.
 *
 * @template T
 * @param {() => T} fn
 * @returns {[T, () => void]}
 */
export function createScope(fn) {
  const node = makeNode(null, currentOwner);
  const prevOwner = currentOwner;
  currentOwner = node;
  try {
    return [fn(), () => disposeNode(node)];
  } finally {
    currentOwner = prevOwner;
  }
}

// ---------------------------------------------------------------------------
// 2. DOM bindings
// ---------------------------------------------------------------------------
// Each binding wraps an effect, so the node is mutated in place when its source
// changes (§4 rule 1). Focus, scroll, selection, IME state, and running CSS
// transitions on the node and its ancestors survive because the node is never
// replaced. Each returns the node so calls chain.

/**
 * @param {Element} node
 * @param {() => string} accessor
 * @returns {Element}
 */
export function bindText(node, accessor) {
  effect(() => {
    node.textContent = accessor();
  });
  return node;
}

/**
 * @param {Element} node
 * @param {string} name
 * @param {() => string | boolean | null | undefined} accessor
 * @returns {Element}
 */
export function bindAttr(node, name, accessor) {
  effect(() => {
    const v = accessor();
    if (v == null || v === false) node.removeAttribute(name);
    else node.setAttribute(name, v === true ? '' : String(v));
  });
  return node;
}

/**
 * @param {Element} node
 * @param {string} name
 * @param {() => unknown} accessor
 * @returns {Element}
 */
export function bindClass(node, name, accessor) {
  effect(() => {
    node.classList.toggle(name, Boolean(accessor()));
  });
  return node;
}

/**
 * Display toggle: preserves the node and its state across hide / show (§4 rule
 * 3). For mount / unmount semantics, use a conditional with each instead.
 *
 * @param {HTMLElement} node
 * @param {() => unknown} accessor
 * @returns {HTMLElement}
 */
export function bindShow(node, accessor) {
  const shown = node.style.display;
  effect(() => {
    node.style.display = accessor() ? shown : 'none';
  });
  return node;
}

/**
 * The one binding that needs care (§4 guard): writing to a focused element's
 * value mid-IME-composition interrupts CJK / accent input and resets the caret.
 * Guard on composition events and skip the write while the element is the
 * active, composing element.
 *
 * @param {HTMLInputElement | HTMLTextAreaElement} node
 * @param {() => string} accessor
 * @returns {HTMLInputElement | HTMLTextAreaElement}
 */
export function bindValue(node, accessor) {
  let composing = false;
  const onStart = () => {
    composing = true;
  };
  const onEnd = () => {
    composing = false;
  };
  node.addEventListener('compositionstart', onStart);
  node.addEventListener('compositionend', onEnd);
  onCleanup(() => {
    node.removeEventListener('compositionstart', onStart);
    node.removeEventListener('compositionend', onEnd);
  });
  effect(() => {
    const v = accessor();
    if (composing && document.activeElement === node) return;
    if (node.value !== v) node.value = v;
  });
  return node;
}

// ---------------------------------------------------------------------------
// 3. Keyed lists
// ---------------------------------------------------------------------------
// Identity-preserving array rendering (§4 rule 2). `parent` is owned
// exclusively by the list. `keyFn(item, index)` must return a stable key; items
// keep their nodes across reorder / insert / delete, so only genuinely new
// items allocate and only genuinely removed items detach. `renderItem` receives
// a signal of the item (so the row reacts to in-place data changes) and the key;
// each row runs in its own scope, disposed when the row is removed.

// Moving a node that contains the focused element blurs it in some browsers, so
// `each` snapshots focus + caret before reordering and restores them after. The
// node identity is already preserved; this preserves the *active* state on it.
/**
 * @returns {FocusSnapshot | null}
 */
function captureFocus() {
  const el = document?.activeElement;
  if (!el) return null;
  /** @type {FocusSnapshot['selection']} */
  let selection = null;
  try {
    const inputEl = /** @type {HTMLInputElement} */ (el);
    if (inputEl.selectionStart != null) {
      selection = {
        start: inputEl.selectionStart,
        end: inputEl.selectionEnd,
        dir: inputEl.selectionDirection,
      };
    }
  } catch {
    /* selection API not available on this element type */
  }
  return { el, selection };
}

/**
 * @param {FocusSnapshot | null} snapshot
 * @returns {void}
 */
function restoreFocus(snapshot) {
  if (!snapshot) return;
  const { el, selection } = snapshot;
  if (el === document.activeElement || !el.isConnected) return; // never blurred
  /** @type {HTMLElement} */ (el).focus({ preventScroll: true });
  if (selection) {
    try {
      /** @type {HTMLInputElement} */ (el).setSelectionRange(selection.start, selection.end, selection.dir ?? undefined);
    } catch {
      /* element no longer supports a selection range */
    }
  }
}

/**
 * Identity-preserving keyed list renderer. Reconciles the list returned by
 * listAccessor into DOM children of parent on every change.
 *
 * @template T
 * @template K
 * @param {Element} parent
 * @param {() => T[]} listAccessor
 * @param {(item: T, index: number) => K} keyFn
 * @param {(item: SignalAccessor<T>, key: K) => Element} renderItem
 * @returns {void}
 */
export function each(parent, listAccessor, keyFn, renderItem) {
  // Rows live under a stable owner, a child of the caller's owner, so the
  // reconciliation effect re-running does not dispose them (it only re-reads the
  // list); the whole list still tears down with its surroundings. Each row gets
  // its own child scope, disposed when the row is removed.
  const rows = makeNode(null, currentOwner);
  /** @type {Map<K, { node: Element, dispose: () => void, item: SignalAccessor<T> }>} */
  let prev = new Map(); // key -> { node, dispose, item }
  effect(() => {
    const items = listAccessor();
    /** @type {Map<K, { node: Element, dispose: () => void, item: SignalAccessor<T> }>} */
    const next = new Map();
    /** @type {Element[]} */
    const ordered = [];
    items.forEach((value, i) => {
      const key = keyFn(value, i);
      let rec = prev.get(key);
      if (rec) {
        rec.item.set(value); // update the existing row's data in place
        prev.delete(key);
      } else {
        const item = signal(value);
        const savedOwner = currentOwner;
        currentOwner = rows; // new row scope attaches to the stable owner
        const [node, dispose] = createScope(() => renderItem(item, key));
        currentOwner = savedOwner;
        rec = { node, dispose, item };
      }
      next.set(key, rec);
      ordered.push(rec.node);
    });
    for (const rec of prev.values()) {
      rec.dispose();
      rec.node.remove();
    }
    // Place nodes in order with minimal moves: walk back-to-front, inserting a
    // node only when it is not already positioned before the previously-placed
    // node. Nodes already in the right place are left untouched; focus + caret
    // on a node that does move are restored afterwards.
    const focused = captureFocus();
    /** @type {Element | null} */
    let ref = null;
    for (let i = ordered.length - 1; i >= 0; i--) {
      const node = ordered[i];
      // Insert a brand-new node, or move an existing one only if out of place.
      if (node.parentNode !== parent || node.nextSibling !== ref) {
        parent.insertBefore(node, ref);
      }
      ref = node;
    }
    restoreFocus(focused);
    prev = next;
  });
}

// ---------------------------------------------------------------------------
// 4. Application
// ---------------------------------------------------------------------------
// createApp({ initialState, reducer, effects, render, root }) wires a reducer to
// the DOM. Each top-level key of initialState becomes its own signal (§3:
// signals top-level keys only), so a dispatch re-runs only the bindings that
// read the slices that actually changed. Returns { state, dispatch, getState,
// dispose }, where state.key() reads a slice reactively and state.key.peek()
// reads it untracked.

/**
 * Wire a reducer to the DOM, creating a live application under root.
 *
 * @param {{
 *   initialState: Record<string, unknown>,
 *   reducer: (state: unknown, action: unknown) => unknown,
 *   effects?: AppEffect[],
 *   render: (ctx: AppContext) => Element,
 *   root: Element,
 * }} config
 * @returns {AppHandle}
 */
export function createApp({ initialState, reducer, effects = [], render, root }) {
  return createRoot((dispose) => {
    /** @type {Record<string, SignalAccessor<unknown>>} */
    const signals = {};
    /** @type {AppState} */
    const state = {};
    for (const key of Object.keys(initialState)) {
      signals[key] = signal(initialState[key]);
      state[key] = signals[key];
    }
    let current = /** @type {unknown} */ (initialState);

    /** @param {unknown} action */
    const dispatch = (action) => {
      const next = /** @type {Record<string, unknown>} */ (reducer(current, action));
      const cur = /** @type {Record<string, unknown>} */ (current);
      if (next === cur) return current; // reducer signalled no change
      batch(() => {
        for (const key of Object.keys(next)) {
          if (Object.is(next[key], cur[key])) continue;
          if (signals[key]) signals[key].set(next[key]);
          else {
            signals[key] = signal(next[key]);
            state[key] = signals[key];
          }
        }
        current = next;
      });
      return current;
    };

    const getState = () => current;

    for (const fx of effects) {
      const cleanup = fx({ state, dispatch, getState });
      if (typeof cleanup === 'function') onCleanup(cleanup);
    }

    const tree = render({ state, dispatch, getState });
    root.replaceChildren(tree);
    onCleanup(() => root.replaceChildren());

    return { state, dispatch, getState, dispose };
  });
}

// ---------------------------------------------------------------------------
// 5. Effect helpers
// ---------------------------------------------------------------------------
// Composable entries for the `effects` array. Each is called once with
// { state, dispatch, getState } and sets up its own reactive effect and / or
// listeners; any cleanup it returns is disposed with the app (§6).

/**
 * Wire a DOM event to a dispatch. `toAction(event)` returns an action (or a
 * falsy value to ignore the event). Returns a cleanup that removes the listener.
 * The canonical §6 example.
 *
 * @param {EventTarget} target
 * @param {string} type
 * @param {(event: Event) => unknown} toAction
 * @param {AddEventListenerOptions | boolean | undefined} [options]
 * @returns {AppEffect}
 */
export function dispatchOnEvent(target, type, toAction, options) {
  return ({ dispatch }) => {
    /** @param {Event} event */
    const handler = (event) => {
      const action = toAction(event);
      if (action) dispatch(action);
    };
    target.addEventListener(type, handler, options);
    return () => target.removeEventListener(type, handler, options);
  };
}

/**
 * Persist a state slice to localStorage whenever it changes. `select(state)`
 * reads slice signals; the effect re-persists when any of them change.
 *
 * @param {string} key
 * @param {(state: AppState) => unknown} select
 * @param {{ serialize?: (value: unknown) => string }} [options]
 * @returns {AppEffect}
 */
export function localStorageEffect(key, select, { serialize = JSON.stringify } = {}) {
  return ({ state }) => {
    effect(() => {
      const value = select(state);
      try {
        localStorage.setItem(key, serialize(value));
      } catch {
        /* storage full or disabled: drop the write */
      }
    });
  };
}

/**
 * Reflect a state slice into a URL query param via replaceState, and optionally
 * dispatch on back / forward navigation. `select(state)` reads the slice; an
 * empty or nullish value removes the param. With `onPop`, popstate decodes the
 * param and calls onPop(value, dispatch).
 *
 * @param {string} param
 * @param {(state: AppState) => unknown} select
 * @param {{
 *   encode?: (value: unknown) => string,
 *   decode?: (s: string) => unknown,
 *   onPop?: (value: unknown, dispatch: (action: unknown) => unknown) => void,
 * }} [options]
 * @returns {AppEffect}
 */
export function urlSyncEffect(
  param,
  select,
  { encode = String, decode = (s) => s, onPop } = {},
) {
  return ({ state, dispatch }) => {
    effect(() => {
      const value = select(state);
      const url = new URL(window.location.href);
      const encoded = value == null || value === '' ? null : encode(value);
      if (encoded == null) url.searchParams.delete(param);
      else url.searchParams.set(param, encoded);
      if (url.href !== window.location.href) {
        window.history.replaceState(null, '', url);
      }
    });
    if (onPop) {
      const handler = () => {
        const raw = new URL(window.location.href).searchParams.get(param);
        onPop(raw == null ? null : decode(raw), dispatch);
      };
      window.addEventListener('popstate', handler);
      return () => window.removeEventListener('popstate', handler);
    }
  };
}
