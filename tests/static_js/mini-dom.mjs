// Minimal, correct DOM for exercising app-runtime.js bindings and `each` under
// node:test, without pulling in jsdom (design-kit ships no node dependencies).
// It implements only the surface the runtime touches, but implements it
// faithfully: in particular insertBefore move semantics and nextSibling, which
// the keyed `each` reconciliation depends on.
//
// install() returns { document, window, teardown } and assigns globalThis
// document / window so the runtime's DOM and browser references resolve.

class ClassList {
  constructor() {
    this._set = new Set();
  }
  add(name) {
    this._set.add(name);
  }
  remove(name) {
    this._set.delete(name);
  }
  contains(name) {
    return this._set.has(name);
  }
  toggle(name, force) {
    const want = force === undefined ? !this._set.has(name) : Boolean(force);
    if (want) this._set.add(name);
    else this._set.delete(name);
    return want;
  }
  get value() {
    return [...this._set].join(' ');
  }
}

class Element {
  constructor(tagName) {
    this.tagName = String(tagName).toUpperCase();
    this.parentNode = null;
    this.childNodes = [];
    this.classList = new ClassList();
    this.style = { display: '' }; // inline display defaults to '' on a fresh element
    this.attributes = new Map();
    this._textContent = '';
    this.value = '';
    this._listeners = new Map();
  }

  get textContent() {
    if (this.childNodes.length === 0) return this._textContent;
    return this.childNodes.map((c) => c.textContent).join('');
  }
  set textContent(v) {
    this._textContent = v == null ? '' : String(v);
    for (const child of this.childNodes) child.parentNode = null;
    this.childNodes = [];
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }
  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }
  removeAttribute(name) {
    this.attributes.delete(name);
  }
  hasAttribute(name) {
    return this.attributes.has(name);
  }

  get firstChild() {
    return this.childNodes[0] ?? null;
  }
  get nextSibling() {
    const siblings = this.parentNode?.childNodes;
    if (!siblings) return null;
    const i = siblings.indexOf(this);
    return i >= 0 && i + 1 < siblings.length ? siblings[i + 1] : null;
  }

  insertBefore(node, ref) {
    if (node.parentNode) node.parentNode.removeChild(node); // move semantics
    if (ref == null) {
      this.childNodes.push(node);
    } else {
      const i = this.childNodes.indexOf(ref);
      if (i < 0) throw new Error('insertBefore: ref is not a child');
      this.childNodes.splice(i, 0, node);
    }
    node.parentNode = this;
    return node;
  }
  appendChild(node) {
    return this.insertBefore(node, null);
  }
  removeChild(node) {
    const i = this.childNodes.indexOf(node);
    if (i < 0) throw new Error('removeChild: not a child');
    this.childNodes.splice(i, 1);
    node.parentNode = null;
    return node;
  }
  remove() {
    if (this.parentNode) this.parentNode.removeChild(this);
  }
  replaceChildren(...nodes) {
    for (const child of [...this.childNodes]) this.removeChild(child);
    for (const node of nodes) this.appendChild(node);
  }

  addEventListener(type, handler) {
    if (!this._listeners.has(type)) this._listeners.set(type, new Set());
    this._listeners.get(type).add(handler);
  }
  removeEventListener(type, handler) {
    this._listeners.get(type)?.delete(handler);
  }
  dispatchEvent(event) {
    event.target ??= this;
    for (const handler of this._listeners.get(event.type) ?? []) handler(event);
    return true;
  }
}

class MiniDocument {
  constructor() {
    this.activeElement = null;
  }
  createElement(tag) {
    return new Element(tag);
  }
}

export function install() {
  const document = new MiniDocument();
  const listeners = new Map();
  const window = {
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(handler);
    },
    removeEventListener(type, handler) {
      listeners.get(type)?.delete(handler);
    },
    dispatchEvent(event) {
      for (const handler of listeners.get(event.type) ?? []) handler(event);
      return true;
    },
  };

  const prevDocument = globalThis.document;
  const prevWindow = globalThis.window;
  globalThis.document = document;
  globalThis.window = window;

  return {
    document,
    window,
    teardown() {
      globalThis.document = prevDocument;
      globalThis.window = prevWindow;
    },
  };
}

export { Element };
