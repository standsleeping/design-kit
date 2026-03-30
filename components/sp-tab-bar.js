import { SPElement } from './sp-element.js';

// --- sp-tab (child element) ---

class SPTab extends SPElement {
  static metadata = {
    name: 'SPTab',
    description: 'Individual tab within sp-tab-bar',
    category: 'navigation',
  };

  static propTypes = {
    label: { type: 'string', default: '' },
  };
}

customElements.define('sp-tab', SPTab);

// --- sp-tab-bar ---

export class SPTabBar extends SPElement {
  static metadata = {
    name: 'SPTabBar',
    description: 'Horizontal tab bar with separator dots',
    category: 'navigation',
  };

  static propTypes = {
    active: { type: 'string', default: '' },
  };

  static variants = [];

  static componentStyles = new CSSStyleSheet();

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;

    if (name !== 'active') {
      this.render();
      return;
    }

    const tabs = this.shadowRoot?.querySelectorAll('.tab');
    if (!tabs || tabs.length === 0) {
      this.render();
      return;
    }

    tabs.forEach((btn) => {
      const isActive = btn.dataset.tab === (newVal ?? '');
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });
  }

  render() {
    const active = this.prop('active');
    const tabs = Array.from(this.querySelectorAll('sp-tab'));

    const tabsHtml = tabs
      .map((tab, i) => {
        const id = tab.id;
        const label = tab.getAttribute('label') || id;
        const isActive = id === active;
        const separator =
          i < tabs.length - 1
            ? '<span class="separator" aria-hidden="true">\u00B7</span>'
            : '';
        return `
          <button
            class="tab ${isActive ? 'active' : ''}"
            data-tab="${id}"
            aria-selected="${isActive}"
            role="tab"
          >${label}</button>${separator}`;
      })
      .join('');

    this.shadowRoot.innerHTML = `
      <div class="tab-bar" role="tablist">${tabsHtml}</div>
    `;

    this.shadowRoot.querySelectorAll('.tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.setAttribute('active', tab);
        this.dispatchEvent(
          new CustomEvent('sp-tab-change', {
            bubbles: true,
            detail: { tab },
          })
        );
      });
    });
  }
}

SPTabBar.componentStyles.replaceSync(`
  .tab-bar {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm) var(--spacing-md);
  }

  .tab {
    padding: var(--spacing-xs) 0;
    font-size: var(--font-size-sm);
    font-family: var(--typography-mono);
    color: var(--color-text-muted);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: color 0.15s ease;
    white-space: nowrap;
  }

  .tab:hover {
    color: var(--color-gray-600);
  }

  .tab:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .tab.active {
    color: var(--color-link);
    font-weight: var(--font-weight-semibold);
    border-bottom-color: var(--color-link);
  }

  .separator {
    color: var(--color-gray-300);
    font-size: var(--font-size-sm);
    user-select: none;
  }
`);

customElements.define('sp-tab-bar', SPTabBar);
