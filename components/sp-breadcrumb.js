import { SPElement } from './sp-element.js';

export class SPBreadcrumb extends SPElement {
  static metadata = {
    name: 'SPBreadcrumb',
    description: 'Breadcrumb navigation with monospace separators',
    category: 'navigation',
  };

  static propTypes = {
    items: { type: 'array', default: [] },
  };

  static variants = [];
  static componentStyles = new CSSStyleSheet();

  render() {
    const items = this.prop('items');
    const hasSlottedContent = this.childElementCount > 0 && items.length === 0;

    const listHtml = items.length > 0
      ? items
          .map((item, i) => {
            const isLast = i === items.length - 1;
            const separator =
              i < items.length - 1
                ? '<span class="separator" aria-hidden="true"> &gt; </span>'
                : '';

            if (isLast) {
              return `<span class="crumb current" aria-current="page">${item.label || ''}</span>${separator}`;
            }
            return `<a class="crumb" href="${item.href || '#'}">${item.label || ''}</a>${separator}`;
          })
          .join('')
      : '';

    this.shadowRoot.innerHTML = `
      <nav class="breadcrumb" aria-label="Breadcrumb">
        ${listHtml}
        ${hasSlottedContent ? '<slot></slot>' : ''}
      </nav>
    `;
  }
}

SPBreadcrumb.componentStyles.replaceSync(`
  :host {
    display: block;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0;
  }

  .crumb {
    font-family: var(--typography-mono);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    text-decoration: none;
    white-space: nowrap;
  }

  a.crumb:hover {
    color: var(--color-text);
  }

  a.crumb:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .crumb.current {
    color: var(--color-text);
  }

  .separator {
    font-family: var(--typography-mono);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    user-select: none;
  }

  ::slotted(a) {
    font-family: var(--typography-mono);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    text-decoration: none;
  }

  ::slotted(a:last-child) {
    color: var(--color-text);
    pointer-events: none;
  }
`);

customElements.define('sp-breadcrumb', SPBreadcrumb);
