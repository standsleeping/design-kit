import { SPElement } from './sp-element.js';

export class SPSearchInput extends SPElement {
  static metadata = {
    name: 'SPSearchInput',
    description: 'Minimal search input for filtering',
    category: 'inputs',
  };

  static propTypes = {
    value: { type: 'string', default: '' },
    placeholder: { type: 'string', default: 'Filter' },
    disabled: { type: 'boolean', default: false },
  };

  static variants = ['empty', 'with-value', 'disabled'];

  static componentStyles = new CSSStyleSheet();

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;

    const input = this.shadowRoot?.querySelector('.search-input');
    if (!input) {
      this.render();
      return;
    }

    if (name === 'value') {
      const next = newVal ?? '';
      if (input.value !== next) {
        input.value = next;
      }
      return;
    }

    if (name === 'placeholder') {
      input.placeholder = newVal ?? '';
      return;
    }

    if (name === 'disabled') {
      input.disabled = newVal !== null && newVal !== 'false';
      return;
    }

    this.render();
  }

  render() {
    const value = this.prop('value');
    const placeholder = this.prop('placeholder');
    const disabled = this.prop('disabled');

    this.shadowRoot.innerHTML = `
      <input
        class="search-input"
        type="search"
        value="${value ?? ''}"
        placeholder="${placeholder ?? ''}"
        ${disabled ? 'disabled' : ''}
      />
    `;

    const input = this.shadowRoot.querySelector('.search-input');
    input.addEventListener('input', (event) => {
      const nextValue = event.target.value;
      this.setAttribute('value', nextValue);
      this.dispatchEvent(
        new CustomEvent('sp-input', {
          bubbles: true,
          detail: { value: nextValue },
        })
      );
    });
  }
}

SPSearchInput.componentStyles.replaceSync(`
  .search-input {
    width: 100%;
    min-width: 120px;
    font-family: var(--typography-mono);
    font-size: var(--font-size-xs);
    line-height: var(--font-line-height-base);
    color: var(--color-text);
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    outline: none;
  }

  .search-input::placeholder {
    color: var(--color-text-muted);
  }

  .search-input:hover {
    border-color: var(--color-text-muted);
  }

  .search-input:focus-visible {
    border-color: var(--color-focus-ring);
    box-shadow: 0 0 0 2px var(--color-focus-ring-light);
  }

  .search-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: var(--color-code-bg);
  }
`);

customElements.define('sp-search-input', SPSearchInput);
