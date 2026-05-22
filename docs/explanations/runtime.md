# The Runtime

This page explains how Caret's runtime works and why it is shaped the way it is. For the API itself, see the [runtime reference](../reference/runtime.md); for the hello world, [getting started](../guides/getting-started.md).

## Where it sits

Caret is a micro-framework. It belongs in the tier of VanJS, SolidJS, and Hyperapp (small libraries that render to the real DOM with fine-grained updates), not the full-framework tier of React or Vue, and not the server-centric tier of Turbo. It is buildless (no compile step), client-only, and plain-DOM (no virtual DOM, no Web Components). The whole engine is one module of a few hundred lines, meant to be read in one sitting.

Its lineage is a deliberate pairing: the **state model** is Hyperapp's (a reducer with effects), and the **reactivity** is Solid/VanJS-style signals. The combination is the defining idea below.

## One idea: the reducer is the truth, signals are the wire

Application state lives in one place: a **reducer**, a pure function `(state, action) => nextState`. Nothing else owns state. There is no per-component local state, no `useState` escape hatch. The only way to change what the user sees is to dispatch an action and let the reducer compute the next state.

A **signal** is a reactive value you read by calling it (`count()`). Reading a signal inside an effect subscribes that effect to it; writing the signal notifies its subscribers. Signals are not a second place to keep state. They are the *transmission medium* that carries reducer state out to the DOM.

`createApp` connects the two. It splits the state object into one signal per top-level key (a **slice**), runs your `render` once to build the DOM, and returns a `dispatch`. When you dispatch:

1. The reducer produces the next state.
2. `createApp` compares it slice by slice and sets the signal only for slices that actually changed.
3. Each binding that read a changed slice re-runs.

Because updates are compared by value and batched, a dispatch that touches three slices still wakes each affected binding exactly once, and a dispatch that changes nothing (the reducer returns the same state) wakes nothing.

## Why no virtual DOM

A **binding** (`bindText`, `bindAttr`, `bindClass`, `bindShow`, `bindValue`) is an effect specialized to one node and one property. When its slice changes, it writes to the node that already exists. It never builds a replacement and never diffs a tree.

That single decision (mutate in place, never replace) is what buys DOM-identity preservation for free. Focus, text selection, scroll position, IME composition, and in-flight CSS transitions all live on the actual DOM nodes; a framework that rebuilds and swaps subtrees destroys them and then scrambles to restore them. Caret keeps the nodes, so that state never leaves. The keyed list (`each`) extends the same guarantee to collections: rows are matched by a stable key, so reordering, inserting, or deleting moves and removes nodes rather than rebuilding the list, and a row's data updates through the per-row signal it was handed.

The trade is that Caret is not for highly dynamic UIs that need to reconcile large, frequently-replaced trees. That is the explicit boundary of the micro-framework tier, not an oversight.

## Effects and their lifecycle

Side effects (persistence, URL sync, global listeners, timers) are not scattered through the view. They are entries in the `effects` array, or `effect()` calls, and each may return a cleanup. Effects are **owner-disposed**: every effect belongs to a scope (the app root, or a component instance), and disposing that scope runs the cleanups and drops subscriptions transitively. Fire-and-forget effects stay valid; they live as long as their owner. This is what lets `createApp().dispose()` tear an app down cleanly, and what lets a removed list row release its listeners without bookkeeping.

The three effect helpers (`dispatchOnEvent`, `localStorageEffect`, `urlSyncEffect`) are ordinary effects packaged for the common cases. They compose: each is one independent entry in the array.

## Further reading

- [Runtime reference](../reference/runtime.md): every export with signature and example.
