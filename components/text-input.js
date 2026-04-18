import { SPElement } from './sp-element.js';

export class SPTextInput extends SPElement {
  static metadata = {
    name: 'SPTextInput',
    description: 'Typed text input wrapper with design-kit styling and events',
    category: 'inputs',
  };

  static propTypes = {
    type: { type: 'string', default: 'text' },
    value: { type: 'string', default: '' },
    placeholder: { type: 'string', default: '' },
    disabled: { type: 'boolean', default: false },
  };

  static variants = ['text', 'search', 'email', 'password', 'disabled'];

  static componentStyles = new CSSStyleSheet();

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;

    const input = this.shadowRoot?.querySelector('.text-input');
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

    if (name === 'type') {
      input.type = newVal || 'text';
      return;
    }

    if (name === 'disabled') {
      input.disabled = newVal !== null && newVal !== 'false';
      return;
    }

    this.render();
  }

  render() {
    const type = this.prop('type');
    const value = this.prop('value');
    const placeholder = this.prop('placeholder');
    const disabled = this.prop('disabled');

    this.shadowRoot.innerHTML = `
      <input
        class="text-input"
        type="${type || 'text'}"
        value="${value ?? ''}"
        placeholder="${placeholder ?? ''}"
        ${disabled ? 'disabled' : ''}
      />
    `;

    const input = this.shadowRoot.querySelector('.text-input');
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
    input.addEventListener('change', (event) => {
      this.dispatchEvent(
        new CustomEvent('sp-change', {
          bubbles: true,
          detail: { value: event.target.value },
        })
      );
    });
  }
}

SPTextInput.componentStyles.replaceSync(`
  .text-input {
    width: 100%;
    min-width: 120px;
    font-family: var(--typography-mono);
    font-size: var(--font-size-xs);
    color: var(--color-text);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-xs) var(--spacing-sm);
    outline: none;
  }

  .text-input::placeholder {
    color: var(--color-text-muted);
  }

  .text-input:hover {
    border-color: var(--color-text-muted);
  }

  .text-input:focus-visible {
    border-color: var(--color-focus-ring);
    box-shadow: 0 0 0 2px var(--color-focus-ring-light);
  }

  .text-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: var(--color-code-bg);
  }
`);

customElements.define('sp-text-input', SPTextInput);
