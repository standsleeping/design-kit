/**
 * sp-bento.js — 10 responsive policy web components for the bento layout demo.
 *
 * Each component demonstrates a distinct responsive behavior policy:
 *   1. Truncate — text clips with ellipsis; line count adjusts to width
 *   2. Shed     — elements hide by priority rank as space shrinks
 *   3. Reflow   — layout axis changes (column ↔ row)
 *   4. Scale    — font size tracks container width in steps
 *   5. Replace  — content swaps to a shorter form at thresholds
 *   6. Scroll   — overflow becomes scrollable
 *   7. Compress — spacing/density tightens; all content stays
 *   8. Reveal   — supplementary content appears as space grows
 *   9. Redistribute — items rebalance across available space
 *  10. Defer    — content hides behind a disclosure control
 *
 * All policies are implemented with CSS container queries (no JS resize
 * observers) since the host element gets explicit sizing from the bento grid.
 */

import { SPElement } from './sp-element.js';


// ─── 1. TRUNCATE ───────────────────────────────────────────────────────────────
// Text clips with ellipsis. Allowed line count widens with container.

export class SPBentoTruncate extends SPElement {
  static metadata = { name: 'SPBentoTruncate', description: 'Truncation policy', category: 'bento' };
  static propTypes = { text: { type: 'string', default: '' } };
  // Breakpoints: 200px fits ~25 chars/line (1 line sufficient), 350px fits full sentences comfortably
  static variants = ['narrow', 'medium', 'wide'];
  static componentStyles = new CSSStyleSheet();

  render() {
    this.shadowRoot.innerHTML = `<p class="text">${this.prop('text')}</p>`;
  }
}

SPBentoTruncate.componentStyles.replaceSync(`
  :host {
    container-type: inline-size;
    display: flex; flex-direction: column; justify-content: center;
    flex: 1; min-height: 0; overflow: hidden;
    padding: var(--spacing-md) var(--spacing-lg);
  }
  .text {
    font-family: var(--typography-body);
    font-size: var(--font-size-base);
    line-height: var(--font-line-height-base);
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    overflow: hidden;
  }
  @container (min-width: 200px) { .text { -webkit-line-clamp: 2; } }
  @container (min-width: 350px) { .text { -webkit-line-clamp: 5; } }
`);

customElements.define('sp-bento-truncate', SPBentoTruncate);


// ─── 2. SHED ───────────────────────────────────────────────────────────────────
// Elements have priority ranks. Lowest-priority hides first as space shrinks.

export class SPBentoShed extends SPElement {
  static metadata = { name: 'SPBentoShed', description: 'Priority shedding policy', category: 'bento' };
  static propTypes = {
    heading:     { type: 'string', default: '' },
    description: { type: 'string', default: '' },
    meta:        { type: 'string', default: '' },
  };
  // Breakpoints: 200px = description becomes readable; 350px = enough room for all three tiers
  static variants = ['heading-only', 'with-description', 'full'];
  static componentStyles = new CSSStyleSheet();

  render() {
    this.shadowRoot.innerHTML = `
      <div class="meta">${this.prop('meta')}</div>
      <div class="heading">${this.prop('heading')}</div>
      <div class="description">${this.prop('description')}</div>
    `;
  }
}

SPBentoShed.componentStyles.replaceSync(`
  :host {
    container-type: inline-size;
    display: flex; flex-direction: column; justify-content: center;
    flex: 1; min-height: 0; overflow: hidden;
    padding: var(--spacing-md) var(--spacing-lg);
  }
  .heading {
    font-family: var(--typography-body);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-medium);
    line-height: var(--font-line-height-base);
  }
  .description {
    font-family: var(--typography-body);
    font-size: var(--font-size-sm);
    line-height: var(--font-line-height-relaxed);
    color: var(--color-text-muted);
    margin-top: var(--spacing-sm);
    display: none;
  }
  .meta {
    font-family: var(--typography-mono);
    font-size: var(--font-size-2xs);
    text-transform: uppercase;
    letter-spacing: var(--font-letter-spacing-wider);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-sm);
    display: none;
  }
  @container (min-width: 200px) { .description { display: block; } }
  @container (min-width: 350px) { .meta { display: block; } }
`);

customElements.define('sp-bento-shed', SPBentoShed);


// ─── 3. REFLOW ─────────────────────────────────────────────────────────────────
// Layout axis changes from column to row at a width threshold.

export class SPBentoReflow extends SPElement {
  static metadata = { name: 'SPBentoReflow', description: 'Reflow policy', category: 'bento' };
  static propTypes = {
    value: { type: 'string', default: '' },
    label: { type: 'string', default: '' },
  };
  // Breakpoint: 220px = value + label fit side-by-side with comfortable gap
  static variants = ['stacked', 'inline'];
  static componentStyles = new CSSStyleSheet();

  render() {
    this.shadowRoot.innerHTML = `
      <div class="metric">
        <span class="value">${this.prop('value')}</span>
        <span class="label">${this.prop('label')}</span>
      </div>
    `;
  }
}

SPBentoReflow.componentStyles.replaceSync(`
  :host {
    container-type: inline-size;
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    flex: 1; min-height: 0; overflow: hidden;
    padding: var(--spacing-md) var(--spacing-lg);
  }
  .metric {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
  }
  .value {
    font-family: var(--typography-mono);
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    line-height: var(--font-line-height-tight);
  }
  .label {
    font-family: var(--typography-mono);
    font-size: var(--font-size-2xs);
    text-transform: uppercase;
    letter-spacing: var(--font-letter-spacing-wider);
    color: var(--color-text-muted);
  }
  @container (min-width: 220px) {
    .metric { flex-direction: row; align-items: baseline; gap: var(--spacing-lg); }
  }
`);

customElements.define('sp-bento-reflow', SPBentoReflow);


// ─── 4. SCALE ──────────────────────────────────────────────────────────────────
// Font size tracks container width in discrete steps.

export class SPBentoScale extends SPElement {
  static metadata = { name: 'SPBentoScale', description: 'Scale policy', category: 'bento' };
  static propTypes = { text: { type: 'string', default: '' } };
  // Breakpoints: 4 steps at 180/280/450/650px matching the font-size scale's perceptible jumps
  static variants = ['xs', 'base', 'xl', '2xl', '3xl'];
  static componentStyles = new CSSStyleSheet();

  render() {
    this.shadowRoot.innerHTML = `<div class="heading">${this.prop('text')}</div>`;
  }
}

SPBentoScale.componentStyles.replaceSync(`
  :host {
    container-type: inline-size;
    display: flex; flex-direction: column; justify-content: center;
    flex: 1; min-height: 0; overflow: hidden;
    padding: var(--spacing-md) var(--spacing-lg);
  }
  .heading {
    font-family: var(--typography-mono);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    letter-spacing: var(--font-letter-spacing-wide);
    font-size: var(--font-size-xs);
    line-height: var(--font-line-height-tight);
    transition: font-size 0.15s ease;
  }
  @container (min-width: 180px) { .heading { font-size: var(--font-size-base); } }
  @container (min-width: 280px) { .heading { font-size: var(--font-size-xl);   } }
  @container (min-width: 450px) { .heading { font-size: var(--font-size-2xl);  } }
  @container (min-width: 650px) { .heading { font-size: var(--font-size-3xl);  } }
`);

customElements.define('sp-bento-scale', SPBentoScale);


// ─── 5. REPLACE ────────────────────────────────────────────────────────────────
// Content swaps to a different form at width thresholds.

export class SPBentoReplace extends SPElement {
  static metadata = { name: 'SPBentoReplace', description: 'Replace policy', category: 'bento' };
  static propTypes = {
    full:  { type: 'string', default: '' },
    short: { type: 'string', default: '' },
    icon:  { type: 'string', default: '\u2192' },
  };
  // Breakpoints: 120px = icon alone is ambiguous; 220px = enough for full label
  static variants = ['icon-only', 'short-label', 'full-label'];
  static componentStyles = new CSSStyleSheet();

  render() {
    this.shadowRoot.innerHTML = `
      <button class="btn">
        <span class="form-icon">${this.prop('icon')}</span>
        <span class="form-short">${this.prop('short')}</span>
        <span class="form-full">${this.prop('full')}</span>
      </button>
    `;
  }
}

SPBentoReplace.componentStyles.replaceSync(`
  :host {
    container-type: inline-size;
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    flex: 1; min-height: 0; overflow: hidden;
    padding: var(--spacing-md) var(--spacing-lg);
  }
  .btn {
    font-family: var(--typography-mono);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: var(--font-letter-spacing-wide);
    border: var(--border-width-thin) solid currentColor;
    padding: var(--spacing-sm) var(--spacing-xl);
    background: transparent;
    color: inherit;
    cursor: pointer;
    white-space: nowrap;
  }
  .form-full, .form-short { display: none; }
  .form-icon  { display: inline; }
  @container (min-width: 120px) {
    .form-icon  { display: none;   }
    .form-short { display: inline; }
  }
  @container (min-width: 220px) {
    .form-short { display: none;   }
    .form-full  { display: inline; }
  }
`);

customElements.define('sp-bento-replace', SPBentoReplace);


// ─── 6. SCROLL ─────────────────────────────────────────────────────────────────
// Content exceeding the container becomes scrollable.

export class SPBentoScroll extends SPElement {
  static metadata = { name: 'SPBentoScroll', description: 'Scroll policy', category: 'bento' };
  static propTypes = {};
  static variants = ['fits', 'overflows'];
  static componentStyles = new CSSStyleSheet();

  render() {
    this.shadowRoot.innerHTML = `<div class="scroll-container"><slot></slot></div>`;
  }
}

SPBentoScroll.componentStyles.replaceSync(`
  :host {
    container-type: inline-size;
    display: flex; flex-direction: column;
    flex: 1; min-height: 0; overflow: hidden;
  }
  .scroll-container {
    flex: 1; min-height: 0;
    overflow-y: auto;
  }
  .scroll-container::-webkit-scrollbar       { width: 4px; }
  .scroll-container::-webkit-scrollbar-track  { background: transparent; }
  .scroll-container::-webkit-scrollbar-thumb  { background: var(--color-gray-300); }
  /* ::slotted() has low specificity by spec; !important is the standard
     workaround to override light-DOM styles on slotted elements. */
  ::slotted(pre) {
    font-family: var(--typography-mono) !important;
    font-size: var(--font-size-xs) !important;
    line-height: var(--font-line-height-base) !important;
    color: var(--color-text-muted) !important;
    margin: 0 !important;
    white-space: pre !important;
  }
`);

customElements.define('sp-bento-scroll', SPBentoScroll);


// ─── 7. COMPRESS ───────────────────────────────────────────────────────────────
// Spacing and density tighten; all content stays visible.

export class SPBentoCompress extends SPElement {
  static metadata = { name: 'SPBentoCompress', description: 'Compression policy', category: 'bento' };
  static propTypes = { items: { type: 'array', default: [] } };
  // Breakpoints: 200px = items stop overlapping; 400px = comfortable reading density
  static variants = ['tight', 'normal', 'spacious'];
  static componentStyles = new CSSStyleSheet();

  render() {
    const items = this.prop('items');
    const html = items
      .map((item, i) => {
        const sep = i < items.length - 1 ? '<span class="sep" aria-hidden="true">\u00b7</span>' : '';
        return `<span class="item">${item}</span>${sep}`;
      })
      .join('');
    this.shadowRoot.innerHTML = `<div class="items">${html}</div>`;
  }
}

SPBentoCompress.componentStyles.replaceSync(`
  :host {
    container-type: inline-size;
    display: flex; flex-direction: column; justify-content: center;
    flex: 1; min-height: 0; overflow: hidden;
    padding: var(--spacing-xs) var(--spacing-sm);
  }
  .items {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-xs);
  }
  .item {
    font-family: var(--typography-mono);
    font-size: var(--font-size-2xs);
    text-transform: uppercase;
    letter-spacing: var(--font-letter-spacing-wider);
    color: var(--color-text-muted);
    white-space: nowrap;
    transition: font-size 0.15s ease;
  }
  .sep {
    color: var(--color-gray-300);
    user-select: none;
  }
  @container (min-width: 200px) {
    :host { padding: var(--spacing-sm) var(--spacing-lg); }
    .items { gap: var(--spacing-sm); }
    .item  { font-size: var(--font-size-xs); }
  }
  @container (min-width: 400px) {
    :host { padding: var(--spacing-md) var(--spacing-xl); }
    .items { gap: var(--spacing-md); }
    .item  { font-size: var(--font-size-sm); }
  }
`);

customElements.define('sp-bento-compress', SPBentoCompress);


// ─── 8. REVEAL ─────────────────────────────────────────────────────────────────
// As container grows, supplementary content appears. Inverse of Shed.

export class SPBentoReveal extends SPElement {
  static metadata = { name: 'SPBentoReveal', description: 'Reveal policy', category: 'bento' };
  static propTypes = {
    primary:   { type: 'string', default: '' },
    secondary: { type: 'string', default: '' },
    tertiary:  { type: 'string', default: '' },
  };
  // Breakpoints: 140px = label fits below number; 260px = trend indicator adds value
  static variants = ['primary-only', 'with-label', 'full'];
  static componentStyles = new CSSStyleSheet();

  render() {
    this.shadowRoot.innerHTML = `
      <div class="content">
        <div class="primary">${this.prop('primary')}</div>
        <div class="secondary">${this.prop('secondary')}</div>
        <div class="tertiary">${this.prop('tertiary')}</div>
      </div>
    `;
  }
}

SPBentoReveal.componentStyles.replaceSync(`
  :host {
    container-type: inline-size;
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    flex: 1; min-height: 0; overflow: hidden;
    padding: var(--spacing-md) var(--spacing-lg);
  }
  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
  }
  .primary {
    font-family: var(--typography-mono);
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    line-height: var(--font-line-height-tight);
  }
  .secondary {
    font-family: var(--typography-mono);
    font-size: var(--font-size-2xs);
    text-transform: uppercase;
    letter-spacing: var(--font-letter-spacing-wider);
    color: var(--color-text-muted);
    display: none;
  }
  .tertiary {
    font-family: var(--typography-mono);
    font-size: var(--font-size-2xs);
    color: var(--color-purple-500);
    display: none;
  }
  @container (min-width: 140px) { .secondary { display: block; } }
  @container (min-width: 260px) { .tertiary  { display: block; } }
`);

customElements.define('sp-bento-reveal', SPBentoReveal);


// ─── 9. REDISTRIBUTE ──────────────────────────────────────────────────────────
// Items rebalance across available space.

export class SPBentoRedistribute extends SPElement {
  static metadata = { name: 'SPBentoRedistribute', description: 'Redistribute policy', category: 'bento' };
  static propTypes = { items: { type: 'array', default: [] } };
  // No fixed breakpoints; flex-wrap redistributes naturally as width changes
  static variants = ['narrow', 'wide'];
  static componentStyles = new CSSStyleSheet();

  render() {
    const html = this.prop('items').map(i => `<span class="tag">${i}</span>`).join('');
    this.shadowRoot.innerHTML = `<div class="tags">${html}</div>`;
  }
}

SPBentoRedistribute.componentStyles.replaceSync(`
  :host {
    container-type: inline-size;
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    flex: 1; min-height: 0; overflow: hidden;
    padding: var(--spacing-md) var(--spacing-lg);
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    justify-content: center;
  }
  .tag {
    font-family: var(--typography-mono);
    font-size: var(--font-size-2xs);
    text-transform: uppercase;
    letter-spacing: var(--font-letter-spacing-wider);
    color: var(--color-text-muted);
    border: var(--border-width-thin) solid var(--color-border);
    padding: var(--spacing-xs) var(--spacing-sm);
    white-space: nowrap;
  }
  @container (min-width: 250px) {
    .tags { gap: var(--spacing-sm); }
    .tag  { padding: var(--spacing-xs) var(--spacing-md); }
  }
`);

customElements.define('sp-bento-redistribute', SPBentoRedistribute);


// ─── 10. DEFER ─────────────────────────────────────────────────────────────────
// Content hides behind a disclosure control at small sizes.

export class SPBentoDefer extends SPElement {
  static metadata = { name: 'SPBentoDefer', description: 'Defer policy', category: 'bento' };
  static propTypes = { text: { type: 'string', default: '' } };
  // Breakpoints: 250px = 3 lines visible (enough context); 450px = full text fits without gating
  static variants = ['clamped-short', 'clamped-medium', 'full'];
  static componentStyles = new CSSStyleSheet();

  render() {
    this.shadowRoot.innerHTML = `
      <div class="content">
        <p class="text">${this.prop('text')}</p>
        <button class="more" type="button">Read more \u2192</button>
      </div>
    `;
  }
}

SPBentoDefer.componentStyles.replaceSync(`
  :host {
    container-type: inline-size;
    display: flex; flex-direction: column; justify-content: center;
    flex: 1; min-height: 0; overflow: hidden;
    padding: var(--spacing-md) var(--spacing-lg);
  }
  .text {
    font-family: var(--typography-body);
    font-size: var(--font-size-sm);
    line-height: var(--font-line-height-relaxed);
    color: var(--color-text-muted);
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }
  .more {
    display: inline-block;
    font-family: var(--typography-mono);
    font-size: var(--font-size-2xs);
    color: var(--color-link);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    margin-top: var(--spacing-sm);
  }
  .more:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }
  @container (min-width: 250px) { .text { -webkit-line-clamp: 3; } }
  @container (min-width: 450px) {
    .text {
      -webkit-line-clamp: unset;
      display: block;
    }
    .more { display: none; }
  }
`);

customElements.define('sp-bento-defer', SPBentoDefer);
