import { SPElement } from './sp-element.js';

export class SPAppShell extends SPElement {
  static metadata = {
    name: 'SPAppShell',
    description: 'Application shell with header, content, and footer zones',
    category: 'layout',
  };

  static propTypes = {};
  static variants = [];
  static componentStyles = new CSSStyleSheet();

  // Structural only — render once, no re-render on attribute change
  attributeChangedCallback() {}

  render() {
    this.shadowRoot.innerHTML = `
      <div class="shell">
        <slot name="header"></slot>
        <div class="shell-content">
          <slot name="left-sidebar"></slot>
          <div class="shell-main"><slot></slot></div>
          <slot name="right-sidebar"></slot>
        </div>
        <slot name="footer"></slot>
      </div>
    `;
  }
}

SPAppShell.componentStyles.replaceSync(`
  :host {
    display: block;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }

  .shell {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  ::slotted([slot="header"]),
  ::slotted([slot="footer"]) {
    flex-shrink: 0;
  }

  .shell-content {
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  ::slotted([slot="left-sidebar"]),
  ::slotted([slot="right-sidebar"]) {
    flex-shrink: 0;
  }

  .shell-main {
    flex: 1;
    min-width: 0;
    overflow: auto;
  }
`);

customElements.define('sp-app-shell', SPAppShell);
