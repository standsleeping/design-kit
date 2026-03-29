import { SPElement } from './sp-element.js';

const STORAGE_KEY = 'sp-theme';
const THEMES = ['light', 'dark', 'auto'];

export class SPThemeToggle extends SPElement {
  static metadata = {
    name: 'SPThemeToggle',
    description: 'Three-state theme toggle: light, dark, system',
    category: 'interactive',
  };

  static propTypes = {};
  static variants = [];
  static componentStyles = new CSSStyleSheet();

  constructor() {
    super();
    this._theme = 'auto';
  }

  connectedCallback() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && THEMES.includes(stored)) {
      this._theme = stored;
    }
    this._applyTheme();
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <div class="toggle" role="radiogroup" aria-label="Color theme">
        ${THEMES.map(
          (t) => `<button
            class="toggle-btn ${t === this._theme ? 'active' : ''}"
            data-theme="${t}"
            role="radio"
            aria-checked="${t === this._theme}"
            aria-label="${t === 'auto' ? 'System' : t.charAt(0).toUpperCase() + t.slice(1)} theme"
          >${t === 'auto' ? 'AUTO' : t.toUpperCase()}</button>`
        ).join('')}
      </div>
    `;

    this.shadowRoot.querySelectorAll('.toggle-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this._theme = btn.dataset.theme;
        localStorage.setItem(STORAGE_KEY, this._theme);
        this._applyTheme();
        this.render();
      });
    });
  }

  _applyTheme() {
    if (this._theme === 'auto') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', this._theme);
    }
  }
}

SPThemeToggle.componentStyles.replaceSync(`
  :host {
    display: inline-flex;
  }

  .toggle {
    display: inline-flex;
    gap: var(--spacing-xs);
    align-items: center;
  }

  .toggle-btn {
    font-family: var(--typography-mono);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    text-transform: uppercase;
    letter-spacing: var(--font-letter-spacing-wide);
    color: var(--color-text-muted);
    background: transparent;
    border: var(--border-width-thin) solid transparent;
    border-radius: var(--radius-sm);
    padding: var(--spacing-xs) var(--spacing-md);
    cursor: pointer;
    transition: color 0.15s ease, border-color 0.15s ease;
  }

  .toggle-btn:hover {
    color: var(--color-text);
  }

  .toggle-btn:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .toggle-btn.active {
    color: var(--color-link);
    border-color: var(--color-link);
  }
`);

customElements.define('sp-theme-toggle', SPThemeToggle);
