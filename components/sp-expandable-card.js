import { SPElement } from './sp-element.js';

export class SPExpandableCard extends SPElement {
  static metadata = {
    name: 'SPExpandableCard',
    description: 'Expandable card with title, count badge, and optional disabled state',
    category: 'containers',
  };

  static propTypes = {
    title: { type: 'string', default: 'Section' },
    count: { type: 'number', default: 0 },
    expanded: { type: 'boolean', default: false },
    disabled: { type: 'boolean', default: false },
  };

  static variants = ['collapsed', 'expanded', 'disabled'];

  static componentStyles = new CSSStyleSheet();

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;

    const titleEl = this.shadowRoot?.querySelector('.card-title');
    const countEl = this.shadowRoot?.querySelector('.card-count');
    const iconEl = this.shadowRoot?.querySelector('.card-icon');
    const headerBtn = this.shadowRoot?.querySelector('.card-header');
    const content = this.shadowRoot?.querySelector('.card-content');
    const card = this.shadowRoot?.querySelector('.card');

    if (!titleEl || !countEl || !iconEl || !headerBtn || !content || !card) {
      this.render();
      return;
    }

    const expanded = this.prop('expanded');
    const disabled = this.prop('disabled');

    if (name === 'title') {
      titleEl.textContent = this.prop('title');
      return;
    }

    if (name === 'count') {
      countEl.textContent = String(this.prop('count'));
      return;
    }

    if (name === 'expanded' || name === 'disabled') {
      iconEl.textContent = disabled ? '—' : expanded ? '▾' : '▸';
      headerBtn.setAttribute('aria-expanded', String(expanded));
      headerBtn.disabled = disabled;
      content.hidden = !expanded;
      card.classList.toggle('card-expanded', expanded);
      card.classList.toggle('card-disabled', disabled);
      return;
    }

    this.render();
  }

  render() {
    const title = this.prop('title');
    const count = this.prop('count');
    const expanded = this.prop('expanded');
    const disabled = this.prop('disabled');
    const icon = disabled ? '—' : expanded ? '▾' : '▸';

    this.shadowRoot.innerHTML = `
      <div class="card ${expanded ? 'card-expanded' : ''} ${disabled ? 'card-disabled' : ''}">
        <button
          type="button"
          class="card-header"
          aria-expanded="${expanded}"
          ${disabled ? 'disabled' : ''}
        >
          <span class="card-icon" aria-hidden="true">${icon}</span>
          <span class="card-title">${title}</span>
          <span class="card-count">${count}</span>
        </button>
        <div class="card-content" ${expanded ? '' : 'hidden'}>
          <slot></slot>
        </div>
      </div>
    `;

    const header = this.shadowRoot.querySelector('.card-header');
    header.addEventListener('click', () => {
      if (disabled) return;
      const nextExpanded = !this.prop('expanded');
      if (nextExpanded) this.setAttribute('expanded', '');
      else this.removeAttribute('expanded');
      this.dispatchEvent(
        new CustomEvent('sp-toggle', {
          bubbles: true,
          detail: { expanded: nextExpanded },
        })
      );
    });
  }
}

SPExpandableCard.componentStyles.replaceSync(`
  .card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg);
    overflow: hidden;
  }

  .card-header {
    width: 100%;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--spacing-sm);
    border: none;
    border-bottom: 1px solid transparent;
    background: transparent;
    color: var(--color-text);
    padding: var(--spacing-sm) var(--spacing-md);
    text-align: left;
    cursor: pointer;
    font-family: var(--typography-mono);
  }

  .card-expanded .card-header {
    border-bottom-color: var(--color-border);
  }

  .card-header:hover {
    background: var(--color-hover-bg);
  }

  .card-header:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: -2px;
  }

  .card-icon {
    color: var(--color-text-muted);
    width: 1.2em;
    text-align: center;
  }

  .card-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: var(--font-letter-spacing-wide);
  }

  .card-count {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 0 var(--spacing-sm);
    min-width: 1.8em;
    text-align: center;
  }

  .card-content {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .card-disabled {
    opacity: 0.65;
  }

  .card-header:disabled {
    cursor: not-allowed;
  }
`);

customElements.define('sp-expandable-card', SPExpandableCard);
