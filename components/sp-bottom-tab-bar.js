import { SPElement } from './sp-element.js';

export class SPBottomTabBar extends SPElement {
  static metadata = {
    name: 'SPBottomTabBar',
    description: 'Bottom navigation tab bar for narrow viewports',
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
      .map((tab) => {
        const id = tab.id;
        const label = tab.getAttribute('label') || id;
        const isActive = id === active;
        return `
          <button
            class="tab ${isActive ? 'active' : ''}"
            data-tab="${id}"
            role="tab"
            aria-selected="${isActive}"
          >${label}</button>`;
      })
      .join('');

    this.shadowRoot.innerHTML = `
      <nav class="tab-bar" role="tablist">${tabsHtml}</nav>
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

SPBottomTabBar.componentStyles.replaceSync(`
  :host {
    display: block;
  }

  .tab-bar {
    display: flex;
    align-items: stretch;
    height: 56px;
    background: var(--color-bg, var(--color-white));
    border-top: 1px solid var(--color-border);
    padding-bottom: env(safe-area-inset-bottom, 0);
  }

  .tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: var(--spacing-sm) var(--spacing-md);
    font-family: var(--typography-body);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    background: transparent;
    border: none;
    border-top: 3px solid transparent;
    cursor: pointer;
    transition: color 0.15s ease;
  }

  .tab:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: -2px;
  }

  .tab.active {
    color: var(--color-link);
    border-top-color: var(--color-link);
    font-weight: var(--font-weight-semibold);
  }
`);

customElements.define('sp-bottom-tab-bar', SPBottomTabBar);
