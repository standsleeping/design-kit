import { SPElement } from './sp-element.js';

export class SPToc extends SPElement {
  static metadata = {
    name: 'SPToc',
    description: 'Right-rail "On this page" table of contents with active section tracking',
    category: 'navigation',
  };

  static propTypes = {
    items: { type: 'array', default: [] },
    label: { type: 'string', default: 'On this page' },
  };

  static variants = [];
  static componentStyles = new CSSStyleSheet();

  constructor() {
    super();
    this._observer = null;
    this._activeId = '';
  }

  connectedCallback() {
    this.render();
    this._setupObserver();
  }

  disconnectedCallback() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
  }

  render() {
    const items = this.prop('items');
    const label = this.prop('label');
    const hasSlottedContent = this.querySelector('[slot="items"]');

    const listHtml = items.length > 0
      ? `<ul class="toc-list">${items
          .map((item) => {
            const level = item.level || 0;
            const activeClass = item.href === `#${this._activeId}` ? 'active' : '';
            return `<li class="toc-item level-${level} ${activeClass}">
              <a href="${item.href || '#'}" class="toc-link">${item.label || ''}</a>
            </li>`;
          })
          .join('')}</ul>`
      : '';

    this.shadowRoot.innerHTML = `
      <nav class="toc" aria-label="${label}">
        <div class="toc-label">${label}</div>
        ${listHtml}
        <slot name="items"></slot>
      </nav>
    `;

    // Handle click events for smooth scrolling
    this.shadowRoot.querySelectorAll('.toc-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
  }

  _setupObserver() {
    const items = this.prop('items');
    if (!items || items.length === 0) return;

    const ids = items
      .map((item) => (item.href || '').replace('#', ''))
      .filter(Boolean);

    if (ids.length === 0) return;

    this._observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible heading
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this._setActive(entry.target.id);
            break;
          }
        }
      },
      {
        rootMargin: '-10% 0px -80% 0px',
        threshold: 0,
      }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) this._observer.observe(el);
    });
  }

  _setActive(id) {
    if (this._activeId === id) return;
    this._activeId = id;

    // Update active class without full re-render
    this.shadowRoot.querySelectorAll('.toc-item').forEach((item) => {
      item.classList.remove('active');
    });

    const activeLink = this.shadowRoot.querySelector(`a[href="#${id}"]`);
    if (activeLink) {
      activeLink.closest('.toc-item').classList.add('active');
    }

    this.dispatchEvent(
      new CustomEvent('sp-toc-change', {
        bubbles: true,
        detail: { activeId: id },
      })
    );
  }
}

SPToc.componentStyles.replaceSync(`
  :host {
    display: block;
  }

  .toc {
    padding: var(--spacing-xl) var(--spacing-lg);
  }

  .toc-label {
    font-family: var(--typography-mono);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding-bottom: var(--spacing-md);
  }

  .toc-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .toc-item {
    border-left: 2px solid transparent;
    transition: border-color 0.15s ease;
  }

  .toc-item.active {
    border-left-color: var(--color-link);
  }

  .toc-item.active .toc-link {
    color: var(--color-link);
  }

  .toc-item.level-0 {
    padding-left: var(--spacing-md);
  }

  .toc-item.level-1 {
    padding-left: var(--spacing-xl);
  }

  .toc-item.level-2 {
    padding-left: var(--spacing-2xl);
  }

  .toc-link {
    display: block;
    font-family: var(--typography-mono);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-decoration: none;
    padding: var(--spacing-xs) 0;
    transition: color 0.15s ease;
    line-height: var(--font-line-height-base);
  }

  .toc-link:hover {
    color: var(--color-text);
  }

  .toc-link:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }
`);

customElements.define('sp-toc', SPToc);
