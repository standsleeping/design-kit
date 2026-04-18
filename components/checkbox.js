import { SPElement } from './sp-element.js';

export class SPCheckbox extends SPElement {
  static metadata = {
    name: 'SPCheckbox',
    description: 'Checkbox control wrapper with normalized change payload',
    category: 'inputs',
  };

  static propTypes = {
    checked: { type: 'boolean', default: false },
    disabled: { type: 'boolean', default: false },
  };

  static variants = ['unchecked', 'checked', 'disabled'];

  static componentStyles = new CSSStyleSheet();

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;

    const input = this.shadowRoot?.querySelector('.checkbox');
    if (!input) {
      this.render();
      return;
    }

    if (name === 'checked') {
      input.checked = newVal !== null && newVal !== 'false';
      return;
    }

    if (name === 'disabled') {
      input.disabled = newVal !== null && newVal !== 'false';
      return;
    }

    this.render();
  }

  render() {
    const checked = this.prop('checked');
    const disabled = this.prop('disabled');

    this.shadowRoot.innerHTML = `
      <input
        class="checkbox"
        type="checkbox"
        ${checked ? 'checked' : ''}
        ${disabled ? 'disabled' : ''}
      />
    `;

    const input = this.shadowRoot.querySelector('.checkbox');
    input.addEventListener('change', (event) => {
      const nextChecked = event.target.checked;
      if (nextChecked) {
        this.setAttribute('checked', '');
      } else {
        this.removeAttribute('checked');
      }
      this.dispatchEvent(
        new CustomEvent('sp-change', {
          bubbles: true,
          detail: { checked: nextChecked },
        })
      );
    });
  }
}

SPCheckbox.componentStyles.replaceSync(`
  .checkbox {
    width: 14px;
    height: 14px;
    accent-color: var(--color-link);
  }
`);

customElements.define('sp-checkbox', SPCheckbox);
