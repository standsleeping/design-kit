import { SPElement } from './sp-element.js';

export class SPContainer extends SPElement {
  static metadata = {
    name: 'SPContainer',
    description: 'Layout container with preset configurations',
    category: 'layout',
  };

  static propTypes = {
    preset: { type: 'string', default: 'standard' },
    padding: { type: 'string', default: '' },
    gap: { type: 'string', default: '' },
  };

  static variants = ['standard', 'centered'];

  static componentStyles = new CSSStyleSheet();

  render() {
    const preset = this.prop('preset');
    const padding = this.prop('padding');
    const gap = this.prop('gap');

    const overrides = [
      padding ? `padding: ${padding}` : '',
      gap ? `gap: ${gap}` : '',
    ]
      .filter(Boolean)
      .join('; ');

    this.shadowRoot.innerHTML = `
      <div class="container container-${preset}" ${overrides ? `style="${overrides}"` : ''}>
        <slot></slot>
      </div>
    `;
  }
}

SPContainer.componentStyles.replaceSync(`
  .container {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .container-standard {
    padding: var(--spacing-xl) 0;
    gap: var(--spacing-xl);
  }

  .container-centered {
    max-width: var(--layout-content-max-width, 680px);
    margin: 0 auto;
    padding: var(--spacing-2xl) var(--spacing-xl);
    gap: var(--spacing-xl);
  }
`);

customElements.define('sp-container', SPContainer);
