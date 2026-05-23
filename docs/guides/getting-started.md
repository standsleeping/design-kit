# Getting Started

Caret is a small, buildless UI framework for plain-DOM applications. This guide builds Caret's hello world (a counter) from an empty directory. There is no build step and no dependency beyond a static file server and a browser.

A runnable copy of everything below lives in [`../examples/hello-world/`](../examples/hello-world/).

---

## What you need

| Requirement | Why |
|---|---|
| A browser | Caret runs client-side; no server runtime |
| A static file server | ES modules do not load over `file://`; any HTTP server works |
| The design-kit CLI (optional) | Only to regenerate `tokens.css`; you can copy the file instead |

Caret ships as plain ES modules. There is nothing to install and no bundler to configure.

---

## 1. Get the two files

A Caret app vendors two files into its own directory:

| File | What it is | How to get it |
|---|---|---|
| `app-runtime.js` | The runtime: signals, bindings, `createApp`, effect helpers | Copy `components/system/app-runtime.js` from design-kit |
| `tokens.css` | The design token vocabulary (color, spacing, type) | `design-kit build` then `design-kit export-tokens --to .`, or copy `dist/tokens.css` |

```bash
mkdir hello-world && cd hello-world
cp /path/to/design-kit/components/system/app-runtime.js .
cp /path/to/design-kit/dist/tokens.css .          # or: design-kit export-tokens --to .
```

Vendoring (copying the runtime in, rather than installing a package) is the distribution model: the runtime is small enough to read in one sitting and stays in the design-kit repo.

---

## 2. Write the app

Create `index.html`. A Caret app is four things (`initialState`, a `reducer`, a `render` function, and a `root` element) passed to `createApp`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="./tokens.css">
  <title>Caret: hello world</title>
</head>
<body>
  <div id="app"></div>

  <script type="module">
    import { createApp, bindText } from './app-runtime.js';

    // State: a plain object. Each top-level key becomes its own signal.
    const initialState = { count: 0 };

    // Reducer: (state, action) -> next state. The only place state changes.
    function reducer(state, action) {
      switch (action.type) {
        case 'increment': return { ...state, count: state.count + 1 };
        case 'decrement': return { ...state, count: state.count - 1 };
        default:          return state;
      }
    }

    // View: build the DOM once; bindings keep it in sync with the state.
    function render({ state, dispatch }) {
      const root = document.createElement('div');

      const minus = document.createElement('button');
      minus.textContent = '−';
      minus.addEventListener('click', () => dispatch({ type: 'decrement' }));

      const value = document.createElement('output');
      bindText(value, () => String(state.count()));   // re-runs only on count change

      const plus = document.createElement('button');
      plus.textContent = '+';
      plus.addEventListener('click', () => dispatch({ type: 'increment' }));

      root.append(minus, value, plus);
      return root;
    }

    createApp({
      initialState,
      reducer,
      render,
      root: document.getElementById('app'),
    });
  </script>
</body>
</html>
```

---

## 3. Run it

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Click `+` and `−`. The number changes; the rest of the page does not.

---

## What just happened

The data flows in one direction: an event dispatches an action, the reducer computes the next state, and only the DOM bound to a changed value updates.

`createApp` turns each top-level key of `initialState` into its own **signal**. `state.count()` reads that signal, and because the read happens inside `bindText`, the binding subscribes to it.

`dispatch({ type: 'increment' })` runs the reducer. `createApp` compares the result key-by-key and sets the signal for `count` only.

`bindText` is an effect over that signal. When `count` changes, the effect re-runs and writes the new text to the existing `<output>` node. The node is mutated, never replaced, so focus, selection, scroll, and in-flight transitions elsewhere on the page survive untouched. This is the render-update contract and DOM-identity preservation.

The reducer is the single source of truth. There is no `setState` on a component and no local state outside the reducer; the only way to change what the user sees is to dispatch an action.

---

## Next steps

| To learn | See |
|---|---|
| Build a settings panel (inputs, persistence) | `../tutorials/settings-panel.md` |
| Build a small SPA (keyed lists, URL state) | `../tutorials/spa.md` |
| Every runtime export with signature and example | `../reference/runtime.md` |
| Binding lists that reorder without losing focus | `each` in `../reference/runtime.md` |
| Persisting state to the URL or localStorage | the effect helpers in `../reference/runtime.md` |
| The four-export component contract | `../reference/component-contract.md` |
| The token vocabulary and visual language | `../reference/visual-language.md` |
| The CLI (`build`, `audit`, `export-tokens`) | `../reference/cli.md` |
| Why the runtime is shaped this way | `../explanations/runtime.md` |
| How the audit set works | `../explanations/audits.md` |
| How the token vocabulary is organized | `../explanations/tokens.md` |
| Start a real project (layout, audits, types) | `new-project.md` |
