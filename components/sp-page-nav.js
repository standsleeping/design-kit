import { SPElement } from './sp-element.js';

export class SPPageNav extends SPElement {
  static metadata = {
    name: 'SPPageNav',
    description: 'Previous/Next page navigation links',
    category: 'navigation',
  };

  static propTypes = {
    'prev-label': { type: 'string', default: '' },
    'prev-href': { type: 'string', default: '' },
    'prev-subtitle': { type: 'string', default: '' },
    'next-label': { type: 'string', default: '' },
    'next-href': { type: 'string', default: '' },
    'next-subtitle': { type: 'string', default: '' },
  };

  static variants = [];
  static componentStyles = new CSSStyleSheet();

  render() {
    const prevLabel = this.prop('prev-label');
    const prevHref = this.prop('prev-href');
    const prevSubtitle = this.prop('prev-subtitle');
    const nextLabel = this.prop('next-label');
    const nextHref = this.prop('next-href');
    const nextSubtitle = this.prop('next-subtitle');

    const prevHtml = prevLabel && prevHref
      ? `<a class="nav-link prev" href="${prevHref}">
          <span class="direction">&lt; Previous</span>
          <span class="label">${prevLabel}</span>
          ${prevSubtitle ? `<span class="subtitle">${prevSubtitle}</span>` : ''}
        </a>`
      : '<span class="nav-link placeholder"></span>';

    const nextHtml = nextLabel && nextHref
      ? `<a class="nav-link next" href="${nextHref}">
          <span class="direction">Next &gt;</span>
          <span class="label">${nextLabel}</span>
          ${nextSubtitle ? `<span class="subtitle">${nextSubtitle}</span>` : ''}
        </a>`
      : '<span class="nav-link placeholder"></span>';

    this.shadowRoot.innerHTML = `
      <nav class="page-nav" aria-label="Page navigation">
        ${prevHtml}
        ${nextHtml}
      </nav>
    `;
  }
}

SPPageNav.componentStyles.replaceSync(`
  :host {
    display: block;
  }

  .page-nav {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-xl);
    padding: var(--spacing-xl) 0;
    border-top: 1px solid var(--color-border);
  }

  .nav-link {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    text-decoration: none;
    min-width: 0;
    max-width: 50%;
  }

  .nav-link.placeholder {
    visibility: hidden;
  }

  .nav-link.next {
    margin-left: auto;
    text-align: right;
    align-items: flex-end;
  }

  .nav-link.prev {
    text-align: left;
    align-items: flex-start;
  }

  .direction {
    font-family: var(--typography-mono);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .label {
    font-family: var(--typography-mono);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text);
    transition: color 0.15s ease;
  }

  .nav-link:hover .label {
    color: var(--color-link);
  }

  .nav-link:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .subtitle {
    font-family: var(--typography-mono);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
`);

customElements.define('sp-page-nav', SPPageNav);
