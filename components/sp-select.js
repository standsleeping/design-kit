import { SPElement } from './sp-element.js';

export class SPSelect extends SPElement {
  static metadata = {
    name: 'SPSelect',
    description: 'Select control wrapper with normalized option schema',
    category: 'inputs',
  };

  static propTypes = {
    value: { type: 'string', default: '' },
    options: { type: 'array', default: [] },
    disabled: { type: 'boolean', default: false },
  };

  static variants = ['basic', 'disabled'];

  static componentStyles = new CSSStyleSheet();

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;

    const select = this.shadowRoot?.querySelector('.select');
    if (!select) {
      this.render();
      return;
    }

    if (name === 'value') {
      const next = newVal ?? '';
      if (select.value !== next) {
        select.value = next;
      }
      return;
    }

    if (name === 'disabled') {
      select.disabled = newVal !== null && newVal !== 'false';
      return;
    }

    if (name === 'options') {
      this.render();
      return;
    }

    this.render();
  }

  _normalizedOptions() {
    const raw = this.prop('options');
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw
      .map((opt) => {
        if (typeof opt === 'string') {
          return { value: opt, label: opt };
        }
        if (opt && typeof opt === 'object') {
          const value = opt.value ?? opt.label ?? '';
          const label = opt.label ?? opt.value ?? '';
          return { value: String(value), label: String(label) };
        }
        return null;
      })
      .filter(Boolean);
  }

  render() {
    const value = this.prop('value');
    const disabled = this.prop('disabled');
    const options = this._normalizedOptions();

    const optionsHtml = options
      .map((option) => {
        const selected = option.value === value ? 'selected' : '';
        return `<option value="${option.value}" ${selected}>${option.label}</option>`;
      })
      .join('');

    this.shadowRoot.innerHTML = `
      <select class="select" ${disabled ? 'disabled' : ''}>
        ${optionsHtml}
      </select>
    `;

    const select = this.shadowRoot.querySelector('.select');
    select.addEventListener('change', (event) => {
      const nextValue = event.target.value;
      this.setAttribute('value', nextValue);
      this.dispatchEvent(
        new CustomEvent('sp-change', {
          bubbles: true,
          detail: { value: nextValue },
        })
      );
    });
  }
}

SPSelect.componentStyles.replaceSync(`
  .select {
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

  .select:hover {
    border-color: var(--color-text-muted);
  }

  .select:focus-visible {
    border-color: var(--color-focus-ring);
    box-shadow: 0 0 0 2px var(--color-focus-ring-light);
  }

  .select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: var(--color-code-bg);
  }
`);

customElements.define('sp-select', SPSelect);
