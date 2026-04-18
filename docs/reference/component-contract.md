# Component Contract

The storybook renders any component module that conforms to this contract. A component module is a `.js` file with four named exports: `metadata`, `propTypes`, `variants`, `render`.

This is a reference spec; it describes the shape, not the motivation. For the rationale behind choosing ES modules over Web Components, see `../../../../../prinzfiles/planning/design-kit/modules-vs-web-components.md`.

---

## Module shape

```js
export const metadata  = { name, description, category };
export const propTypes = { [propName]: { type, default, options? } };
export const variants  = [ { name, description?, props } ];
export function render(props) { /* returns HTMLElement or { node, cleanup } */ }
```

All four exports are required. A file missing any export is skipped by the storybook pool scanner with a warning.

---

## `metadata`

| Field | Type | Required | Rule |
|---|---|---|---|
| `name` | string | yes | PascalCase; unique within a pool; used as the display label and URL slug |
| `description` | string | yes | One sentence; fits on one line in the component list |
| `category` | string | yes | Free-form; the storybook groups components by string equality |

Category values are not enumerated. Projects choose their own vocabulary (`navigation`, `actions`, `forms`, `data-display`). The storybook does not enforce a taxonomy.

---

## `propTypes`

Object keyed by prop name. Each entry is a prop descriptor.

| Descriptor field | Type | Required | Rule |
|---|---|---|---|
| `type` | string | yes | One of: `string`, `number`, `boolean`, `enum`, `array`, `object` |
| `default` | any | yes | Used by the storybook when the prop is unset; must be a valid value for `type` |
| `options` | array | only when `type === 'enum'` | List of allowed values |

`array` and `object` carry structured data (e.g., breadcrumb items, segmented toggle options). The storybook inspector treats them as opaque JSON in its propTypes editor for now; richer editing is deferred.

### Validation scope

`validatePropTypes` runs only at storybook scan time (`scanPool` in `storybook.js`) and at contract-test time (`pages/contract-tests.html`). Production render calls do not validate — `render(props)` accepts whatever is passed and trusts the caller. Callers are the boundary; pass valid props, or expect undefined behavior.

### Why `function` is not a type

Function props (callbacks) are deliberately excluded. Components communicate outward by dispatching `CustomEvent` on the returned node; see the events section below. This keeps `render` pure and the prop surface serializable, which is what lets the storybook deep-link variants and width settings via URL.

### Example

```js
export const propTypes = {
  label:    { type: 'string',  default: 'Item' },
  icon:     { type: 'string',  default: null },
  selected: { type: 'boolean', default: false },
  disabled: { type: 'boolean', default: false },
  size:     { type: 'enum',    default: 'md', options: ['sm', 'md', 'lg'] },
};
```

---

## `variants`

Array of concrete example states. The storybook renders each variant as a live preview card.

| Field | Type | Required | Rule |
|---|---|---|---|
| `name` | string | yes | Unique within the array; kebab-case |
| `description` | string | no | Shown under the variant card |
| `props` | object | yes | Concrete prop values; merged over `propTypes` defaults before rendering |
| `slots` | object | no | Content to inject into shell components that expose `[data-slot="<key>"]` insertion points |

`props` carries concrete values, not prop names. A bare-string variant list is not accepted.

### Example

```js
export const variants = [
  { name: 'default',  description: 'Default state',           props: { label: 'Menu Item' } },
  { name: 'selected', description: 'Currently selected',      props: { label: 'Selected', selected: true } },
  { name: 'disabled', description: 'Disabled/inactive',       props: { label: 'Disabled', disabled: true } },
];
```

### Slots

Wrapper components (FieldRow, FormLayout, etc.) don't know about their children. They render a shell with one or more `[data-slot="<key>"]` elements marking insertion points. Variants inject content into those slots via the `slots` field.

A slot value is a **slot spec** or an array of slot specs:

```js
type SlotSpec = {
  component: string,     // metadata.name of a component in the same pool
  props?: object,        // passed to that component's render
  slots?: { [key: string]: SlotSpec | SlotSpec[] },  // nested slots
};
```

The storybook resolves slots after calling the wrapper's `render(props)`: for each entry in `slots`, it looks up the named component in the pool registry, renders it with the given props (recursively resolving that child's own slots), and appends the resulting node into the matching `[data-slot="<key>"]` element. Array values append multiple children.

Wrapper render functions stay slot-agnostic: they emit `[data-slot="..."]` markers and do nothing else. Runtime consumers compose the same way without the storybook:

```js
const row = FieldRow.render({ label: 'Name' });
row.querySelector('[data-slot="control"]').append(TextInput.render({ value: 'Alice' }));
```

### Slot example

```js
export const variants = [
  {
    name: 'text-field',
    description: 'Field row hosting a text input',
    props: { label: 'Name' },
    slots: {
      control: { component: 'TextInput', props: { value: 'Alice' } },
    },
  },
];
```

---

## `render`

Pure function. Takes a props object; returns either an `HTMLElement` or an object of shape `{ node: HTMLElement, cleanup: () => void }`.

| Rule | Reason |
|---|---|
| Must not retain state between calls | Storybook re-renders on every prop change; stashed state leaks across renders |
| Must not read from globals beyond the DOM APIs | Keeps the component testable in isolation |
| Must not mutate the `props` argument | Props are treated as a value; the storybook reuses the same object across renders |
| Must default missing props to `propTypes[name].default` | Callers may pass partial props; the component fills gaps |

### Return shape

| Return | When to use |
|---|---|
| `HTMLElement` | Default. Listeners attached only to the returned subtree; removal from the DOM garbage-collects them |
| `{ node, cleanup }` | Component attaches listeners outside the returned tree (document, window, another element). `cleanup()` must remove all such listeners |

The storybook checks the return shape at render time: if the return is an `HTMLElement`, it uses it directly; otherwise it expects `node` and calls `cleanup()` when unmounting.

### Example

```js
export function render(props = {}) {
  const p = { ...defaults(propTypes), ...props };
  const root = document.createElement('button');
  root.className = `menu-item${p.selected ? ' menu-item-selected' : ''}`;
  root.disabled = p.disabled;
  root.textContent = p.label;

  root.addEventListener('click', () => {
    if (p.disabled) return;
    root.dispatchEvent(new CustomEvent('menu-item:select', {
      bubbles: true,
      detail: { label: p.label },
    }));
  });

  return root;
}
```

---

## Events

Components communicate outward via `CustomEvent` dispatched on the returned root node.

### Naming

`<component-kebab>:<action>`

| Component | Event |
|---|---|
| `MenuItem` | `menu-item:select` |
| `DatasetCard` | `dataset-card:expand` |
| `DecisionRow` | `decision-row:click` |
| `Button` | `button:click` |

Kebab-case component name; colon separator; verb-ish action. The `sp-` prefix from the old Web Component era is dropped. Events bubble by default (`bubbles: true`) so the storybook can capture them at the preview root.

### `detail` payload

Required for any event that conveys information beyond the fact of the event. Keep payloads serializable (no DOM references, no functions); the storybook's event log serializes `detail` as JSON.

---

## Styles

Each component ships a sibling `.css` file with the same basename as the module:

```
components/menu-item.js      ← module (metadata, propTypes, variants, render)
components/menu-item.css     ← styles consumed by the module's render output
```

The storybook loads the sibling stylesheet automatically when it imports the module: after `import()`-ing `<name>.js`, it injects a `<link rel="stylesheet" href="<name>.css">` into the document head if one is not already present for that module. Each sibling loads exactly once per page regardless of how many instances render.

A component with no styles may omit the sibling file.

| Concern | Rule |
|---|---|
| Selector scope | Use a namespaced class prefix (`.dk-button`, `.ch-dataset-card`) to avoid collisions across pools. The sibling CSS does not get any automatic scoping; discipline enforces isolation |
| Token usage | Consume design tokens via CSS custom properties (`var(--color-text)`, `var(--spacing-md)`); no hardcoded values |
| Shadow DOM | Not used; the module contract assumes light DOM |
| Base styles | Project-wide tokens, resets, and utilities (things outside any single component's scope) live in the pool's `stylesheet` config entry; component sidecars cover only per-component rules |

---

## Pool membership

A pool is a directory of component modules plus a base stylesheet. The storybook reads pools from `storybook.config.json`; each pool entry has `name`, `path`, and `stylesheet`. Pool scanning is recursive: every `.js` file under `path` is import-probed, and files that conform to this contract are added to the registry. Files that do not conform are skipped with a console warning. The pool `stylesheet` is loaded once per pool and carries project-wide base styles (tokens, resets, utilities); per-component CSS sibling files are loaded on demand as each component is imported.

A component's fully qualified identity is `<pool>/<metadata.name>`. Names must be unique within a pool; they may collide across pools.

### File-naming conventions

Each project keeps its own file-naming convention. The storybook does not enforce a single form:

| Project | Convention | Examples |
|---|---|---|
| design-kit | kebab-case | `menu-item.js`, `tab-bar.js`, `code-block.js` |
| comphost  | camelCase (default), PascalCase when a class is the canonical export | `menuItem.js`, `searchInput.js`, `CollapsibleSection.js` |

The sibling-CSS loader replaces the trailing `.js` with `.css` on the full URL, so the CSS file must share the JS basename exactly (case-sensitive). `menuItem.js` → `menuItem.css`; `CollapsibleSection.js` → `CollapsibleSection.css`.

### CSS class prefix

Components declare classes under a pool-namespaced prefix to avoid cross-pool collisions:

| Pool | Prefix | Example class |
|---|---|---|
| design-kit | `dk-` | `.dk-menu-item`, `.dk-tab-bar-active` |
| comphost | `ch-` | `.ch-menu-item`, `.ch-entity-metrics-section` |

Prefixing is strict: every selector a component owns starts with its pool prefix. Shared modifier classes (`resolved`, `disabled`, `expanded`, etc.) are acceptable as secondary classes when a component already carries its prefixed primary class.

---

## Migration from the `SPElement` base class

Existing `sp-*` components extend a `SPElement` base class and render into Shadow DOM. Migration steps:

1. Replace `export class SP<X> extends SPElement` with four named exports.
2. Move `static componentStyles` rules into a sibling `<name>.css` file under a namespaced class prefix. Selectors previously scoped by Shadow DOM (bare `.menu-item`) become `.menu-item`.
3. Replace `this.shadowRoot.innerHTML = ...` with explicit DOM construction in `render`.
4. Replace `this.dispatchEvent(new CustomEvent('sp-select', ...))` with `root.dispatchEvent(new CustomEvent('<component>:<action>', ...))`.
5. Convert `variants` from `['default', 'selected']` to `[{ name, description, props }]` objects.
6. Delete the `customElements.define(...)` call at the bottom of the file.
7. Delete any `import { SPElement } from './sp-element.js'`.

`sp-element.js` is removed once the last component is migrated; `sp-all.js` becomes a flat re-export index.
