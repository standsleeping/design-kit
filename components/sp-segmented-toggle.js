import { SPElement } from './sp-element.js';

/**
 * sp-option (child element) — individual option within sp-segmented-toggle.
 *
 * Usage: <sp-option id="months" label="Months"></sp-option>
 */
class SPOption extends SPElement {
  static metadata = {
    name: 'SPOption',
    description: 'Individual option within sp-segmented-toggle',
    category: 'controls',
  };

  static propTypes = {
    label: { type: 'string', default: '' },
  };
}

customElements.define('sp-option', SPOption);

/**
 * sp-segmented-toggle — mutually exclusive toggle group.
 *
 * Attributes:
 *   active — id of the currently active option
 *
 * Events:
 *   sp-toggle-change — fired when the active option changes
 *     detail: { option: string }
 *
 * Usage:
 *   <sp-segmented-toggle active="months">
 *     <sp-option id="months" label="Months"></sp-option>
 *     <sp-option id="weeks" label="Weeks"></sp-option>
 *     <sp-option id="days" label="Days"></sp-option>
 *   </sp-segmented-toggle>
 */
export class SPSegmentedToggle extends SPElement {
  static metadata = {
    name: 'SPSegmentedToggle',
    description: 'Segmented toggle for mutually exclusive options',
    category: 'controls',
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

    const buttons = this.shadowRoot?.querySelectorAll('.seg-btn');
    if (!buttons || buttons.length === 0) {
      this.render();
      return;
    }

    buttons.forEach((btn) => {
      const isActive = btn.dataset.option === (newVal ?? '');
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-checked', String(isActive));
    });
  }

  render() {
    const active = this.prop('active');
    const options = Array.from(this.querySelectorAll('sp-option'));

    const buttonsHtml = options
      .map((opt) => {
        const id = opt.id;
        const label = opt.getAttribute('label') || id;
        const isActive = id === active;
        return `<button
          class="seg-btn${isActive ? ' active' : ''}"
          data-option="${id}"
          role="radio"
          aria-checked="${isActive}"
        >${label}</button>`;
      })
      .join('');

    this.shadowRoot.innerHTML = `
      <div class="seg-group" role="radiogroup">${buttonsHtml}</div>
    `;

    this.shadowRoot.querySelectorAll('.seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const option = btn.dataset.option;
        this.setAttribute('active', option);
        this.dispatchEvent(
          new CustomEvent('sp-toggle-change', {
            bubbles: true,
            detail: { option },
          })
        );
      });
    });
  }
}

SPSegmentedToggle.componentStyles.replaceSync(`
  .seg-group {
    display: inline-flex;
  }

  .seg-btn {
    padding: var(--spacing-sm) var(--spacing-lg);
    font-size: var(--font-size-sm);
    font-family: var(--typography-mono);
    border: 1px solid var(--color-border);
    border-right: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  .seg-btn:last-child {
    border-right: 1px solid var(--color-border);
  }

  .seg-btn:first-child {
    border-radius: var(--radius-lg) 0 0 var(--radius-lg);
  }

  .seg-btn:last-child {
    border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
  }

  .seg-btn:hover {
    background: var(--color-hover-bg);
  }

  .seg-btn.active {
    background: var(--color-purple-100);
    color: var(--color-link);
    font-weight: var(--font-weight-medium);
  }

  .seg-btn.active:hover {
    background: var(--color-purple-200);
  }

  .seg-btn:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: -2px;
    z-index: 1;
  }
`);

customElements.define('sp-segmented-toggle', SPSegmentedToggle);
