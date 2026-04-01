import { SPElement } from './sp-element.js';

export class SPTitleBlock extends SPElement {
  static metadata = {
    name: 'SPTitleBlock',
    description: 'Document identity block in the standards-manual tradition',
    category: 'display',
  };

  static propTypes = {
    'doc-title': { type: 'string', default: '' },
    identifier: { type: 'string', default: '' },
    revision: { type: 'string', default: '' },
    date: { type: 'string', default: '' },
    author: { type: 'string', default: '' },
    status: { type: 'string', default: '' },
  };

  static variants = ['full', 'minimal', 'with-status'];

  static componentStyles = new CSSStyleSheet();

  render() {
    const title = this.prop('doc-title');
    const identifier = this.prop('identifier');
    const revision = this.prop('revision');
    const date = this.prop('date');
    const author = this.prop('author');
    const status = this.prop('status');

    const metaFields = [
      identifier ? { label: 'ID', value: identifier } : null,
      revision ? { label: 'REV', value: revision } : null,
      date ? { label: 'DATE', value: date } : null,
      author ? { label: 'AUTHOR', value: author } : null,
      status ? { label: 'STATUS', value: status } : null,
    ].filter(Boolean);

    const titleHtml = title
      ? `<div class="tb-field tb-title">
           <div class="tb-label">TITLE</div>
           <div class="tb-value">${title}</div>
         </div>`
      : '';

    const metaHtml =
      metaFields.length > 0
        ? `<div class="tb-meta">
             ${metaFields
               .map(
                 (f) =>
                   `<div class="tb-field">
                      <div class="tb-label">${f.label}</div>
                      <div class="tb-value">${f.value}</div>
                    </div>`
               )
               .join('')}
           </div>`
        : '';

    this.shadowRoot.innerHTML = `
      <div class="title-block">
        ${titleHtml}
        ${metaHtml}
      </div>
      <div class="tb-slot"><slot></slot></div>
    `;
  }
}

SPTitleBlock.componentStyles.replaceSync(`
  .title-block {
    border: var(--border-width-thin) solid var(--color-border);
    font-family: var(--typography-mono);
    display: grid;
    background: var(--color-border);
    gap: 1px;
  }

  .tb-field {
    background: var(--color-bg);
    padding: var(--spacing-xs) var(--spacing-sm);
  }

  .tb-label {
    font-size: var(--font-size-2xs);
    text-transform: uppercase;
    letter-spacing: var(--font-letter-spacing-wide);
    color: var(--color-text-muted);
    line-height: var(--font-line-height-tight);
  }

  .tb-value {
    font-size: var(--font-size-xs);
    color: var(--color-text);
    line-height: var(--font-line-height-base);
  }

  .tb-title {
    grid-column: 1 / -1;
  }

  .tb-title .tb-value {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }

  .tb-meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 1px;
    background: var(--color-border);
    grid-column: 1 / -1;
  }

  .tb-meta .tb-field {
    background: var(--color-bg);
  }

  .tb-slot:empty {
    display: none;
  }
`);

customElements.define('sp-title-block', SPTitleBlock);
