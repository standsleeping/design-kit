# Tutorial: A Settings Panel

This tutorial builds a settings panel: a text field, a theme dropdown, and a compact-mode checkbox, with a live preview that reacts to all three. The settings persist to `localStorage` and survive a reload.

It assumes you have done [Getting started](../guides/getting-started.md) (the counter) and know the four pieces of a Caret app: `initialState`, a `reducer`, a `render` function, and `createApp`. This tutorial adds three things the counter did not use: two-way input binding, persistence, and driving form controls that have no dedicated binding helper.

A runnable copy is in [`../examples/settings-panel/`](../examples/settings-panel/). Vendor `app-runtime.js` and `tokens.css` next to your `index.html` as before.

---

## 1. State, with rehydration

The settings are three values. We seed them from `localStorage` so a reload restores the user's last choices, falling back to defaults when nothing is stored or the stored value is unparseable.

```js
const STORAGE_KEY = 'caret-settings';

const defaults = { name: '', theme: 'auto', compact: false };

function loadSettings() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') };
  } catch {
    return { ...defaults };
  }
}
```

`loadSettings()` becomes the `initialState`. Reading storage is your responsibility at startup; the runtime does not do it for you. (Writing it back is the runtime's job, via an effect, step 4.)

---

## 2. The reducer

One action per setting. Each returns a new state object with one slice changed.

```js
function reducer(state, action) {
  switch (action.type) {
    case 'setName':    return { ...state, name: action.value };
    case 'setTheme':   return { ...state, theme: action.value };
    case 'setCompact': return { ...state, compact: action.value };
    default:           return state;
  }
}
```

---

## 3. The controls

Each control is a two-way wire: the runtime pushes state *into* the control, and a DOM listener dispatches the user's change *back* into the reducer.

### Text field: `bindValue`

`bindValue` is the one binding helper made for editable fields. It writes the signal's value into the field and guards against overwriting the field mid-IME-composition (so accented and CJK input is not disrupted). You still wire the other direction yourself: an `input` listener that dispatches.

```js
const name = document.createElement('input');
name.type = 'text';
bindValue(name, () => state.name());                                  // state -> field
name.addEventListener('input', () =>                                  // field -> state
  dispatch({ type: 'setName', value: name.value }));
```

### Dropdown and checkbox: the `effect` primitive

There is no binding helper for `<select>` or for a checkbox. That is fine: the binding helpers are just conveniences over `effect`, the underlying primitive, and you can reach for it directly. An `effect` re-runs whenever a signal it reads changes, so this one keeps the control's property in sync with the slice.

```js
const theme = document.createElement('select');
for (const value of ['auto', 'light', 'dark']) theme.append(new Option(value, value));
effect(() => { theme.value = String(state.theme()); });              // state -> control
theme.addEventListener('change', () =>                                // control -> state
  dispatch({ type: 'setTheme', value: theme.value }));

const compact = document.createElement('input');
compact.type = 'checkbox';
effect(() => { compact.checked = Boolean(state.compact()); });
compact.addEventListener('change', () =>
  dispatch({ type: 'setCompact', value: compact.checked }));
```

This is the general pattern: when no `bind*` helper fits, write the one-line `effect` that performs the imperative update.

---

## 4. The live preview, and persistence

### Many bindings, shared slices

The preview reads the same three slices through three different bindings. Each binding owns one node and updates only that node when its slice changes.

```js
const preview = document.createElement('div');
preview.className = 'preview';
bindAttr(preview, 'data-theme', () => String(state.theme()));   // attribute reflects theme
bindClass(preview, 'is-compact', () => state.compact());        // class toggles density

const greeting = document.createElement('div');
bindText(greeting, () => `Hello, ${state.name() || 'stranger'}`);
```

The CSS does the rest: `.preview[data-theme="dark"]` and `.preview.is-compact` restyle the card. Logic stays in the reducer; appearance stays in CSS; the bindings are the thin wire between them.

### Persisting on change

Persistence is an entry in the `effects` array. `localStorageEffect(key, select)` re-serializes and writes whenever any slice that `select` reads changes. Because `select` here reads all three slices, any change persists the whole object.

```js
createApp({
  initialState: loadSettings(),
  reducer,
  effects: [
    localStorageEffect(STORAGE_KEY, (state) => ({
      name: state.name(),
      theme: state.theme(),
      compact: state.compact(),
    })),
  ],
  render,
  root: document.getElementById('app'),
});
```

Rehydration (step 1) and persistence (here) are the two halves of "settings that survive a reload": you read on startup, the effect writes on change.

---

## 5. Run it

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Type a name, switch the theme, toggle compact mode: the preview updates live. Reload the page: your settings are still there.

---

## What you learned

| Need | Tool |
|---|---|
| Editable text field, two-way | `bindValue` (state → field, with IME guard) + an `input` listener (field → state) |
| Control with no binding helper (`<select>`, checkbox) | `effect(() => { el.prop = state.slice() })` + a `change` listener |
| Several views of the same state | Multiple bindings (`bindAttr`, `bindClass`, `bindText`) each reading the slices they need |
| Survive a reload | Rehydrate `initialState` from storage at startup; `localStorageEffect` writes on change |

Every control followed the same two-way shape: a binding (or effect) pushing state into the DOM, and a listener dispatching changes back. State changes only ever go through the reducer.

Next, the [small SPA tutorial](spa.md) adds keyed lists (`each`) and URL-synced state (`urlSyncEffect`): the runtime's last two major surfaces.
