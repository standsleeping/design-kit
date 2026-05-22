# Tutorial: A Small SPA

This tutorial builds a task list: add, toggle, and delete tasks, filter them (all / active / done), and keep the filter in the URL so a link is shareable and survives a reload. It is a single-page app with no router and no build step.

It assumes [Getting started](../guides/getting-started.md) and the [settings panel](settings-panel.md). It introduces the runtime's last two major surfaces: keyed lists (`each`) and URL-synced state (`urlSyncEffect`).

A runnable copy is in [`../examples/spa/`](../examples/spa/). Vendor `app-runtime.js` and `tokens.css` next to your `index.html`.

---

## 1. State

The state is the task array, the active filter, and a counter for generating ids. The filter is seeded from the URL so a `?filter=` link restores the right view.

```js
const FILTERS = ['all', 'active', 'done'];

function initialFilter() {
  const f = new URL(location.href).searchParams.get('filter');
  return FILTERS.includes(f) ? f : 'all';
}

const initialState = {
  todos: [
    { id: 1, text: 'Read the runtime reference', done: false },
    { id: 2, text: 'Build the counter', done: true },
  ],
  filter: initialFilter(),
  nextId: 3,
};
```

Every task carries a stable `id`. That id is what lets the keyed list (step 3) preserve each row across changes, so generating one per task is not bookkeeping. It is the contract `each` depends on.

---

## 2. The reducer

```js
function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const text = action.text.trim();
      if (!text) return state;                       // ignore empty: return state unchanged
      return {
        ...state,
        todos: [...state.todos, { id: state.nextId, text, done: false }],
        nextId: state.nextId + 1,
      };
    }
    case 'toggle':
      return { ...state, todos: state.todos.map((t) =>
        t.id === action.id ? { ...t, done: !t.done } : t) };
    case 'remove':
      return { ...state, todos: state.todos.filter((t) => t.id !== action.id) };
    case 'setFilter':
      return { ...state, filter: action.value };
    default:
      return state;
  }
}
```

Returning `state` unchanged from `add` (when the text is empty) is a no-op dispatch: `createApp` compares the result by reference and skips notifying any binding.

`toggle` replaces only the affected task with a new object. This matters for step 3: the keyed list will see the same id with new data and update that row in place, rather than rebuilding it.

---

## 3. The keyed list: `each`

The visible tasks depend on both `todos` and `filter`. We express that as a plain accessor; `each` wraps it in an effect, so the list reconciles whenever either slice changes.

```js
function visible(state) {
  const f = state.filter();
  return state.todos().filter((t) =>
    f === 'all' ? true : f === 'active' ? !t.done : t.done);
}
```

`each(parent, listAccessor, keyFn, renderItem)` renders that array into `parent`, keyed by id. The key is the contract: rows with a surviving key keep their DOM node across add, remove, reorder, and filter. Only genuinely new tasks allocate a node, only removed ones detach.

`renderItem` receives a **signal of the task**, not the task itself. Reading `todo()` inside a binding subscribes that binding to the row's data, so when `toggle` produces a new object for this id, the row's bindings re-run and the existing node updates in place.

```js
each(
  list,
  () => visible(state),
  (todo) => todo.id,                       // stable key
  (todo, id) => {
    const li = document.createElement('div');
    li.className = 'todo';
    bindClass(li, 'is-done', () => todo().done);

    const box = document.createElement('input');
    box.type = 'checkbox';
    effect(() => { box.checked = todo().done; });          // row signal -> control
    box.addEventListener('change', () => dispatch({ type: 'toggle', id }));

    const text = document.createElement('span');
    bindText(text, () => todo().text);                      // updates in place on toggle

    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.addEventListener('click', () => dispatch({ type: 'remove', id }));

    li.append(box, text, del);
    return li;
  },
);
```

The second argument of `renderItem` is the key (`id`), which is convenient to close over for the `toggle` and `remove` actions.

---

## 4. URL-synced filter: `urlSyncEffect`

The filter buttons dispatch `setFilter`. To make the current filter shareable, mirror it into a query parameter with `urlSyncEffect`, added to the `effects` array.

```js
createApp({
  initialState,
  reducer,
  effects: [
    urlSyncEffect('filter', (state) => (state.filter() === 'all' ? '' : state.filter()), {
      onPop: (value, dispatch) =>
        dispatch({ type: 'setFilter', value: FILTERS.includes(value) ? value : 'all' }),
    }),
  ],
  render,
  root: document.getElementById('app'),
});
```

`urlSyncEffect(param, select, options)` reflects `select(state)` into `?param=` via `history.replaceState` whenever the slice changes. Returning `''` for the default (`all`) drops the parameter, keeping clean URLs. `onPop` handles the browser back/forward buttons by decoding the param and dispatching.

Reflection is one direction; restoring on a fresh load is the other, and that is `initialFilter()` from step 1. The two together make the filter a real piece of shareable application state: changing it updates the URL, and opening that URL restores it.

`urlSyncEffect` is not a router. The framework's scope deliberately excludes routing (use anchor tags plus a URL-sync effect, or a small router); this effect is the lightweight "reflect one slice into the URL" tool, not a route table.

---

## 5. Run it

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Add a few tasks, check some off, switch filters. Watch the URL gain `?filter=active`. Copy that URL into a new tab: it opens already filtered.

---

## What you learned

| Need | Tool |
|---|---|
| A list that survives add / remove / reorder / filter | `each` with a stable `keyFn` |
| A row that updates without rebuilding | bindings reading the per-row signal `renderItem` provides |
| Skip work when nothing changed | return the same `state` from the reducer (no-op dispatch) |
| Shareable, bookmarkable view state | `urlSyncEffect` to reflect, read the URL at startup to restore |

Tasks themselves are not persisted here, so they reset on reload. Only the filter is URL-synced. To keep the tasks too, add a `localStorageEffect` over `state.todos()` exactly as in the [settings panel](settings-panel.md). The runtime composes: each effect is one independent entry in the `effects` array.

You have now used every major surface of the runtime: signals and bindings, keyed lists, the effect lifecycle, and the three effect helpers. For the full API, see the [runtime reference](../reference/runtime.md).
