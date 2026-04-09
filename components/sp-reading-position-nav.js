import { SPElement } from './sp-element.js';

/**
 * SPReadingPositionNav — fixed overlay showing the reader's current
 * section and item (e.g., sentence) as they scroll a long article.
 *
 * Tracks two element groups by CSS selector: section boundaries
 * (typically h2) and items within sections (typically id-tagged
 * blockquotes or paragraphs). As the user scrolls, the component
 * displays the most recent section heading and item label, stacked.
 *
 * Item labels come from one of three sources, in priority order:
 *   1. `data-nav-label` attribute on the element
 *   2. `item-label` prop + trailing digits of the element's id
 *      (e.g., id="s7" with item-label="Sentence" → "Sentence 7")
 *   3. the element's textContent (trimmed, truncated)
 */
export class SPReadingPositionNav extends SPElement {
  static metadata = {
    name: 'SPReadingPositionNav',
    description: 'Fixed overlay showing the reader\'s current section and item as they scroll',
    category: 'navigation',
  };

  static propTypes = {
    'section-selector': { type: 'string', default: 'h2' },
    'item-selector': { type: 'string', default: '[id]' },
    'item-label': { type: 'string', default: '' },
    'threshold': { type: 'number', default: 0.25 },
  };

  static variants = [];
  static componentStyles = new CSSStyleSheet();

  constructor() {
    super();
    this._onScroll = this._onScroll.bind(this);
    this._sections = [];
    this._items = [];
    this._sectionEl = null;
    this._itemEl = null;
  }

  connectedCallback() {
    this.render();
    this._collectTargets();
    this._update();
    window.addEventListener('scroll', this._onScroll, { passive: true });
    window.addEventListener('resize', this._onScroll, { passive: true });
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this._onScroll);
    window.removeEventListener('resize', this._onScroll);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    this.render();
    if (this.isConnected) {
      this._collectTargets();
      this._update();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <nav class="nav" aria-hidden="true">
        <div class="nav-section"></div>
        <div class="nav-item"></div>
      </nav>
    `;
    this._sectionEl = this.shadowRoot.querySelector('.nav-section');
    this._itemEl = this.shadowRoot.querySelector('.nav-item');
  }

  _collectTargets() {
    const sectionSelector = this.prop('section-selector');
    const itemSelector = this.prop('item-selector');
    this._sections = Array.from(document.querySelectorAll(sectionSelector));
    this._items = Array.from(document.querySelectorAll(itemSelector));
  }

  _onScroll() {
    this._update();
  }

  _update() {
    if (!this._sectionEl || !this._itemEl) return;

    const threshold = window.innerHeight * this.prop('threshold');

    const currentSection = this._findCurrent(this._sections, threshold);
    const currentItem = this._findCurrent(this._items, threshold);

    const sectionText = currentSection ? this._formatSection(currentSection) : '';
    const itemText = currentItem ? this._formatItem(currentItem) : '';

    if (this._sectionEl.textContent !== sectionText) {
      this._sectionEl.textContent = sectionText;
    }
    if (this._itemEl.textContent !== itemText) {
      this._itemEl.textContent = itemText;
    }
  }

  _findCurrent(elements, threshold) {
    let current = null;
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].getBoundingClientRect().top <= threshold) {
        current = elements[i];
      }
    }
    return current;
  }

  _formatSection(el) {
    return (el.textContent || '').trim();
  }

  _formatItem(el) {
    const explicit = el.getAttribute('data-nav-label');
    if (explicit) return explicit;

    const label = this.prop('item-label');
    if (label) {
      const id = el.id || '';
      const match = id.match(/(\d+)$/);
      if (match) return `${label} ${match[1]}`;
    }

    return (el.textContent || '').trim();
  }
}

SPReadingPositionNav.componentStyles.replaceSync(`
  :host {
    display: none;
    position: fixed;
    top: var(--spacing-xl);
    left: var(--spacing-xl);
    z-index: var(--z-sticky);
    pointer-events: none;
    max-width: 220px;
  }

  @media (min-width: 1000px) {
    :host {
      display: block;
    }
  }

  .nav {
    font-family: var(--typography-mono);
    font-size: var(--font-size-xs);
    line-height: var(--font-line-height-base);
  }

  .nav-section {
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: var(--font-weight-medium);
    margin-bottom: var(--spacing-xs);
  }

  .nav-item {
    color: var(--color-text-muted);
  }

  .nav-section:empty,
  .nav-item:empty {
    display: none;
  }
`);

customElements.define('sp-reading-position-nav', SPReadingPositionNav);
