import { SPElement } from './sp-element.js';

export class SPCodeBlock extends SPElement {
  static metadata = {
    name: 'SPCodeBlock',
    description: 'Code block with copy button, optional language tabs, and toolbar slot',
    category: 'content',
  };

  static propTypes = {
    languages: { type: 'string', default: '' },
    'active-language': { type: 'string', default: '' },
  };

  static variants = [];
  static componentStyles = new CSSStyleSheet();

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;

    if (name === 'active-language') {
      const tabs = this.shadowRoot?.querySelectorAll('.lang-tab');
      if (!tabs || tabs.length === 0) {
        this.render();
        return;
      }
      tabs.forEach((btn) => {
        const isActive = btn.dataset.lang === (newVal ?? '');
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', String(isActive));
      });
      return;
    }

    if (name === 'languages') {
      this.render();
      return;
    }

    this.render();
  }

  render() {
    const languagesAttr = this.prop('languages');
    const languages = languagesAttr
      ? languagesAttr.split(',').map((l) => l.trim()).filter(Boolean)
      : [];
    const activeLanguage = this.prop('active-language') || languages[0] || '';

    const tabsHtml = languages.length > 1
      ? `<div class="language-tabs" role="tablist">${languages
          .map((lang, i) => {
            const isActive = lang === activeLanguage;
            const separator =
              i < languages.length - 1
                ? '<span class="separator" aria-hidden="true">\u00B7</span>'
                : '';
            return `<button
              class="lang-tab ${isActive ? 'active' : ''}"
              data-lang="${lang}"
              aria-selected="${isActive}"
              role="tab"
            >${lang}</button>${separator}`;
          })
          .join('')}</div>`
      : '';

    this.shadowRoot.innerHTML = `
      <div class="code-block">
        <div class="header">
          ${tabsHtml}
          <div class="toolbar">
            <slot name="toolbar"></slot>
            <button class="copy-btn" aria-label="Copy code">Copy</button>
          </div>
        </div>
        <pre class="code-pre"><code class="code-content"><slot></slot></code></pre>
      </div>
    `;

    // Copy button
    const copyBtn = this.shadowRoot.querySelector('.copy-btn');
    copyBtn.addEventListener('click', () => this._copyCode(copyBtn));

    // Language tab switching
    this.shadowRoot.querySelectorAll('.lang-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        this.setAttribute('active-language', lang);
        this.dispatchEvent(
          new CustomEvent('sp-language-change', {
            bubbles: true,
            detail: { language: lang },
          })
        );
      });
    });
  }

  _copyCode(btn) {
    const slot = this.shadowRoot.querySelector('slot:not([name])');
    const nodes = slot.assignedNodes({ flatten: true });
    const text = nodes.map((n) => n.textContent).join('');

    navigator.clipboard.writeText(text).then(() => {
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove('copied');
      }, 1500);
    });
  }
}

SPCodeBlock.componentStyles.replaceSync(`
  :host {
    display: block;
  }

  .code-block {
    border: 1px solid var(--color-code-border, var(--color-gray-200));
    border-radius: var(--radius-md, 4px);
    background: var(--color-code-bg, var(--color-gray-100));
    overflow: hidden;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-sm) var(--spacing-md);
    border-bottom: 1px solid var(--color-code-border, var(--color-gray-200));
    min-height: 0;
  }

  .language-tabs {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm) var(--spacing-md);
  }

  .lang-tab {
    padding: var(--spacing-xs) 0;
    font-size: var(--font-size-xs);
    font-family: var(--typography-mono);
    color: var(--color-text-muted);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: color 0.15s ease;
    white-space: nowrap;
  }

  .lang-tab:hover {
    color: var(--color-gray-600);
  }

  .lang-tab:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .lang-tab.active {
    color: var(--color-link);
    font-weight: var(--font-weight-semibold);
    border-bottom-color: var(--color-link);
  }

  .separator {
    color: var(--color-gray-300);
    font-size: var(--font-size-xs);
    user-select: none;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-left: auto;
  }

  .copy-btn {
    font-family: var(--typography-mono);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 2px);
    padding: var(--spacing-xs) var(--spacing-md);
    cursor: pointer;
    transition: color 0.15s ease, border-color 0.15s ease;
    white-space: nowrap;
  }

  .copy-btn:hover {
    color: var(--color-text);
    border-color: var(--color-gray-400);
  }

  .copy-btn:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .copy-btn.copied {
    color: var(--color-success);
    border-color: var(--color-success);
  }

  .code-pre {
    margin: 0;
    padding: var(--spacing-lg) var(--spacing-xl);
    overflow-x: auto;
    font-family: var(--typography-mono);
    font-size: var(--font-size-xs);
    line-height: var(--font-line-height-relaxed);
    color: var(--color-text);
  }

  .code-content {
    font-family: inherit;
    font-size: inherit;
  }
`);

customElements.define('sp-code-block', SPCodeBlock);
