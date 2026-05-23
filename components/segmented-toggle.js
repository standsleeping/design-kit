export const metadata = {
  name: 'SegmentedToggle',
  description: 'Segmented toggle for mutually exclusive options',
  category: 'controls',
};

export const propTypes = {
  options: { type: 'array', default: [] },
  active: { type: 'string', default: '' },
};

export const variants = [
  {
    name: 'default',
    description: 'Three-option period selector',
    props: {
      options: [
        { id: 'months', label: 'Months' },
        { id: 'weeks', label: 'Weeks' },
        { id: 'days', label: 'Days' },
      ],
      active: 'months',
    },
  },
  {
    name: 'binary',
    description: 'Two-option toggle',
    props: {
      options: [
        { id: 'list', label: 'List' },
        { id: 'grid', label: 'Grid' },
      ],
      active: 'list',
    },
  },
  {
    name: 'narrow-box',
    description: 'Many long options in a narrow host — scrolls horizontally as a boundary scroller',
    props: {
      options: [
        { id: 'yesterday', label: 'Yesterday' },
        { id: 'last-7-days', label: 'Last 7 Days' },
        { id: 'last-30-days', label: 'Last 30 Days' },
        { id: 'last-quarter', label: 'Last Quarter' },
        { id: 'year-to-date', label: 'Year to Date' },
        { id: 'all-time', label: 'All Time' },
      ],
      active: 'last-30-days',
    },
  },
];

/**
 * @typedef {{ id: string, label?: string }} SegmentedOption
 * @param {{ options?: SegmentedOption[], active?: string }} [props]
 * @returns {HTMLDivElement}
 */
export function render(props = {}) {
  const options = props.options ?? propTypes.options.default;
  const initialActive = props.active ?? propTypes.active.default;
  let active = initialActive;

  const root = document.createElement('div');
  root.className = 'dk-segmented-toggle';
  root.setAttribute('role', 'radiogroup');

  /** @type {{ el: HTMLButtonElement, id: string }[]} */
  const buttons = options.map((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dk-segmented-toggle-button';
    btn.dataset.option = opt.id;
    btn.setAttribute('role', 'radio');
    btn.textContent = opt.label ?? opt.id;
    /** @param {boolean} isActive */
    const setActive = (isActive) => {
      btn.classList.toggle('dk-segmented-toggle-button-active', isActive);
      btn.setAttribute('aria-checked', String(isActive));
    };
    setActive(opt.id === active);
    btn.addEventListener('click', () => {
      if (active === opt.id) return;
      active = opt.id;
      buttons.forEach(({ el, id }) => {
        const isActive = id === active;
        el.classList.toggle('dk-segmented-toggle-button-active', isActive);
        el.setAttribute('aria-checked', String(isActive));
      });
      root.dispatchEvent(new CustomEvent('segmented-toggle:change', {
        bubbles: true,
        detail: { option: active },
      }));
    });
    root.append(btn);
    return { el: btn, id: opt.id };
  });

  return root;
}
