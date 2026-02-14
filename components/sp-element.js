/**
 * SPElement — base class for all sp-* web components.
 *
 * Provides: Shadow DOM (open), adopted stylesheets with token-consuming
 * :host defaults, attribute observation, typed property access, and the
 * metadata/propTypes/variants contract from comphost's component model.
 */

export class SPElement extends HTMLElement {
  // --- Component contract (override in subclasses) ---
  static metadata = { name: '', description: '', category: '' };
  static propTypes = {};
  static variants = [];

  // --- Shared base styles (token-consuming defaults for :host) ---
  static baseStyles = new CSSStyleSheet();

  // --- Lifecycle ---
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [
      SPElement.baseStyles,
      ...(this.constructor.componentStyles
        ? [this.constructor.componentStyles]
        : []),
    ];
  }

  connectedCallback() {
    this.render();
  }

  // Subclasses override this
  render() {}

  // --- Attribute ↔ property reflection ---
  static get observedAttributes() {
    return Object.keys(this.propTypes).filter(
      (k) => this.propTypes[k].type !== 'function'
    );
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal) this.render();
  }

  // Typed property getter from attribute string
  prop(name) {
    const spec = this.constructor.propTypes[name];
    if (!spec) return undefined;
    const raw = this.getAttribute(name);
    if (raw === null) return spec.default;
    switch (spec.type) {
      case 'boolean':
        return raw !== null && raw !== 'false';
      case 'number':
        return Number(raw);
      case 'object':
      case 'array':
        return JSON.parse(raw);
      default:
        return raw;
    }
  }
}

// Base styles all components inherit
SPElement.baseStyles.replaceSync(`
  :host {
    font-family: var(--typography-body);
    color: var(--color-text);
    line-height: var(--font-line-height-base);
    box-sizing: border-box;
  }
  :host([hidden]) { display: none; }
  *, *::before, *::after { box-sizing: border-box; }
`);
