import { SPElement } from './sp-element.js';

export class SPCollapsibleSection extends SPElement {
  static metadata = {
    name: 'SPCollapsibleSection',
    description: 'Collapsible section with sticky header',
    category: 'containers',
  };

  static propTypes = {
    title: { type: 'string', default: 'Section' },
    count: { type: 'number', default: 0 },
    expanded: { type: 'boolean', default: false },
  };

  static variants = [];

  static componentStyles = new CSSStyleSheet();

  render() {
    const title = this.prop('title');
    const count = this.prop('count');
    const expanded = this.prop('expanded');

    this.shadowRoot.innerHTML = `
      <div class="section ${expanded ? 'expanded' : ''}">
        <button class="header" aria-expanded="${expanded}">
          <span class="icon">${expanded ? '▼' : '▶'}</span>
          <span class="title">${title}</span>
          ${count ? `<span class="count">${count}</span>` : ''}
        </button>
        <div class="content" ${expanded ? '' : 'hidden'}>
          <slot></slot>
        </div>
      </div>
    `;

    this.shadowRoot
      .querySelector('.header')
      .addEventListener('click', () => this._toggle());
  }

  _toggle() {
    const expanded = this.prop('expanded');
    if (expanded) {
      this.removeAttribute('expanded');
    } else {
      this.setAttribute('expanded', '');
    }
    this.dispatchEvent(
      new CustomEvent('sp-toggle', {
        bubbles: true,
        detail: { expanded: !expanded },
      })
    );
  }
}

SPCollapsibleSection.componentStyles.replaceSync(`
  .header {
    display: flex;
    align-items: center;
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    border: none;
    background: none;
    cursor: pointer;
    user-select: none;
    font-family: var(--typography-body);
    position: sticky;
    top: 0;
    background: var(--color-bg, var(--color-white));
    border-bottom: 1px solid var(--color-border);
    z-index: 1;
    transition: background-color 0.15s ease;
  }

  .header:hover {
    background: var(--color-gray-100);
  }

  .header:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: -2px;
  }

  .icon {
    width: var(--spacing-2xl);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    flex-shrink: 0;
  }

  .title {
    flex: 1;
    text-align: left;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .count {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-family: var(--typography-mono);
  }

  .content[hidden] {
    display: none;
  }
`);

customElements.define('sp-collapsible-section', SPCollapsibleSection);
