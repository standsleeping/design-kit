# Runtime Reference

The Caret runtime is a single module, `components/system/app-runtime.js`: fine-grained signals driven by one reducer, rendering to light DOM with no VDOM and no build step. This page documents every public export.

```js
import {
  signal, effect, derive, batch, onCleanup, createRoot, createScope,
  bindText, bindAttr, bindClass, bindShow, bindValue,
  each,
  createApp,
  dispatchOnEvent, localStorageEffect, urlSyncEffect,
} from './app-runtime.js';
```

## Mental model

The reducer is the single source of truth for application state. `createApp` exposes each top-level state key as a **signal**: a getter you call (`state.count()`). Reading a signal inside an effect subscribes that effect to it. A **binding** (`bindText`, `bindAttr`, …) is an effect that writes one value to one node, so when a signal changes the bound node is *mutated in place*, never replaced. That is what preserves focus, selection, scroll, and running transitions across updates.

You change state only by dispatching an action. There is no per-component local state.

Signals and effects are also usable on their own (without `createApp`), but every effect and binding must run under an **owner** so its cleanup is tracked. `createApp`'s `render` runs under the app root; outside it, wrap your code in `createRoot` or `createScope`.

---

## 1. Reactive core

### `signal(initial)`

Create a reactive value. The return is a getter with two extra methods.

| Form | Behavior |
|---|---|
| `s()` | Read. Inside an effect, subscribes that effect to the signal |
| `s.set(next)` | Write. No-op if `Object.is(next, current)`; otherwise notifies subscribers |
| `s.peek()` | Read without subscribing (untracked) |

```js
const count = signal(0);
count();        // 0
count.set(1);   // notifies subscribers
count.peek();   // 1, without subscribing the caller
```

### `effect(fn)`

Run `fn` immediately, then re-run it whenever any signal it read changes. Returns a `dispose()` that stops the effect.

`fn` may return a cleanup function. The cleanup runs before each re-run and once on disposal. Only a returned function is treated as cleanup; any other return value is ignored.

```js
const stop = effect(() => {
  document.title = `Count: ${count()}`;
  return () => console.log('cleaning up before next run or on dispose');
});
stop();   // unsubscribe and run the final cleanup
```

### `derive(fn)`

Create a read-only signal computed from other signals. It recomputes when its dependencies change. The result is callable and has `.peek()`, but **no `.set`**: a derived value updates only from its inputs.

```js
const count = signal(2);
const doubled = derive(() => count() * 2);
doubled();   // 4
count.set(5);
doubled();   // 10
```

### `batch(fn)`

Coalesce the signal writes inside `fn` into one downstream pass, so a binding subscribed to several changed signals re-runs at most once. Returns `fn`'s return value.

```js
batch(() => {
  first.set('Ada');
  last.set('Lovelace');
});   // a binding reading both runs once, not twice
```

`createApp` already wraps each `dispatch` in `batch`, so a reducer that updates many slices triggers each binding once. Reach for `batch` directly only for multi-signal writes outside a dispatch.

### `onCleanup(fn)`

Register a cleanup on the current owner; it runs on the owner's next re-run or on its disposal. Returns nothing (so a concise `() => onCleanup(...)` effect body does not also register the cleanup as a return value).

```js
effect(() => {
  const id = setInterval(tick, 1000);
  onCleanup(() => clearInterval(id));
});
```

### `createRoot(fn)`

Run `fn` under a fresh root owner with no parent. `fn` receives a `dispose()` that tears down the whole tree (every effect and scope created inside). Use it to host signals/effects outside `createApp`. Returns `fn`'s return value.

```js
createRoot((dispose) => {
  effect(() => render(state()));
  // ... later: dispose();
});
```

### `createScope(fn)`

Run `fn` under a fresh **child** owner of the current one. Returns `[result, dispose]`. One scope per component instance: disposing it tears down that instance's effects transitively. A scope does not subscribe to reads, so reading a signal at the top of a render body does not make the whole instance reactive. Only bindings do.

```js
const [node, dispose] = createScope(() => renderRow(item));
// dispose() removes this row's effects when the row goes away
```

---

## 2. DOM bindings

Each binding wraps an `effect`, mutating an existing node when its source changes. Each returns the node, so calls chain. Bindings must run under an owner (inside `render`, or a `createRoot`/`createScope`).

### `bindText(node, accessor)`

Set `node.textContent` to `accessor()` (a string) reactively.

```js
const out = document.createElement('output');
bindText(out, () => String(state.count()));
```

### `bindAttr(node, name, accessor)`

Set attribute `name` from `accessor()`. `null`/`false`/`undefined` removes the attribute; `true` sets it to `''`; any other value is stringified.

```js
bindAttr(button, 'disabled', () => state.busy());
bindAttr(link, 'href', () => state.url());
```

### `bindClass(node, name, accessor)`

Toggle class `name` by the truthiness of `accessor()`.

```js
bindClass(row, 'is-selected', () => state.selectedId() === row.dataset.id);
```

### `bindShow(node, accessor)`

Toggle visibility via `display`. Preserves the node and its state across hide/show. The original `display` value is captured when the binding is created. For mount/unmount semantics (discard and rebuild), use a conditional with `each` instead.

```js
bindShow(panel, () => state.expanded());
```

### `bindValue(node, accessor)`

Two-way-friendly binding for an `<input>` / `<textarea>` `value`. It writes `accessor()` to the field but **skips the write while the field is focused and an IME composition is active**, so CJK/accent input and the caret are not disrupted. It only writes when the value actually differs. It attaches `compositionstart`/`compositionend` listeners and registers their removal via `onCleanup`, so it must run under an owner.

```js
const input = document.createElement('input');
bindValue(input, () => state.query());
input.addEventListener('input', (e) => dispatch({ type: 'setQuery', value: e.target.value }));
```

---

## 3. Keyed lists

### `each(parent, listAccessor, keyFn, renderItem)`

Render the array from `listAccessor()` as children of `parent`, reconciling on every change. `parent` is owned exclusively by the list. Returns nothing.

| Parameter | Type | Role |
|---|---|---|
| `parent` | `Element` | Container the rows are placed into |
| `listAccessor` | `() => T[]` | Reactive source of the array |
| `keyFn` | `(item, index) => K` | **Must return a stable key per item** |
| `renderItem` | `(item: Signal<T>, key) => Element` | Builds one row |

Items keep their nodes across reorder, insert, and delete: only genuinely new items allocate, only genuinely removed items detach. `renderItem` receives a **signal** of the item (so a row reacts to in-place data changes) and the key. Each row runs in its own scope, disposed when the row is removed. Reordering restores focus and caret on a node that moved.

A missing or unstable key is the one way to silently destroy identity for shifted rows (the same contract as React keys or Solid `<For>`).

```js
const ul = document.createElement('ul');
each(
  ul,
  () => state.todos(),
  (todo) => todo.id,                    // stable key
  (todo) => {
    const li = document.createElement('li');
    bindText(li, () => todo().text);    // todo is a signal
    return li;
  },
);
```

---

## 4. Application

### `createApp(config)`

Wire a reducer to the DOM and mount a live app under `root`.

| Field | Type | Required | Role |
|---|---|---|---|
| `initialState` | `object` | yes | Each top-level key becomes its own signal |
| `reducer` | `(state, action) => state` | yes | Returns the next state; return the same reference to signal no change |
| `effects` | `AppEffect[]` | no | Each called once at startup with the app context; may return a cleanup |
| `render` | `(ctx) => Element` | yes | Builds the DOM once; the returned node is mounted under `root` |
| `root` | `Element` | yes | Where the app mounts (its children are replaced) |

Returns an `AppHandle`:

| Member | Description |
|---|---|
| `state` | Map of slice signals; `state.key()` reads reactively, `state.key.peek()` untracked |
| `dispatch(action)` | Runs the reducer, sets only the slices that changed (within a `batch`), returns the new state |
| `getState()` | The current raw state object (untracked) |
| `dispose()` | Tears the app down: disposes all effects and clears `root` |

The `ctx` passed to `render` and to each effect is `{ state, dispatch, getState }`. A `dispatch` whose reducer returns an unchanged value (`===` the previous state) is a no-op. When the reducer's output contains a key not present in `initialState`, a new signal is created for it.

```js
const app = createApp({
  initialState: { count: 0 },
  reducer(state, action) {
    switch (action.type) {
      case 'increment': return { ...state, count: state.count + 1 };
      default:          return state;
    }
  },
  render({ state, dispatch }) {
    const root = document.createElement('div');
    const out = document.createElement('output');
    bindText(out, () => String(state.count()));
    const btn = document.createElement('button');
    btn.textContent = '+';
    btn.addEventListener('click', () => dispatch({ type: 'increment' }));
    root.append(out, btn);
    return root;
  },
  root: document.getElementById('app'),
});
```

---

## 5. Effect helpers

Composable entries for the `effects` array. Each is a factory returning an `AppEffect`: a function called once with `{ state, dispatch, getState }` that sets up listeners and/or a reactive effect, optionally returning a cleanup disposed with the app.

### `dispatchOnEvent(target, type, toAction, options?)`

Wire a DOM event to a dispatch. `toAction(event)` returns an action, or a falsy value to ignore the event. Returns a cleanup that removes the listener.

```js
createApp({
  // ...
  effects: [
    dispatchOnEvent(window, 'keydown', (e) =>
      e.key === 'ArrowUp' ? { type: 'increment' } : null),
  ],
});
```

### `localStorageEffect(key, select, options?)`

Persist a state slice to `localStorage` whenever it changes. `select(state)` reads slice signals; the effect re-persists when any of them change. `options.serialize` defaults to `JSON.stringify`. Storage errors (full/disabled) are swallowed.

```js
effects: [
  localStorageEffect('todos', (state) => state.todos()),
]
```

### `urlSyncEffect(param, select, options?)`

Reflect a state slice into a URL query parameter via `history.replaceState`. `select(state)` reads the slice; an empty or nullish value removes the param.

| Option | Default | Role |
|---|---|---|
| `encode` | `String` | Slice value → query string |
| `decode` | identity | Query string → value (used by `onPop`) |
| `onPop` | — | If given, `popstate` decodes the param and calls `onPop(value, dispatch)` |

```js
effects: [
  urlSyncEffect('q', (state) => state.query(), {
    onPop: (value, dispatch) => dispatch({ type: 'setQuery', value: value ?? '' }),
  }),
]
```

---

## See also

- [Getting started](../guides/getting-started.md): the counter hello-world.
- [Component contract](component-contract.md): the four-export module shape (`metadata`, `propTypes`, `variants`, `render`).
