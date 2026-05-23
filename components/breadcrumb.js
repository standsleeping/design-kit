export const metadata = {
  name: 'Breadcrumb',
  description: 'Breadcrumb navigation with monospace separators',
  category: 'navigation',
};

export const propTypes = {
  items: { type: 'array', default: [] },
  separator: { type: 'string', default: '>' },
};

export const variants = [
  {
    name: 'default',
    description: 'Three-level path',
    props: {
      items: [
        { label: 'Home', href: '#' },
        { label: 'Docs', href: '#' },
        { label: 'Component Contract' },
      ],
    },
  },
  {
    name: 'two-level',
    description: 'Shallow path',
    props: {
      items: [
        { label: 'Projects', href: '#' },
        { label: 'Acme' },
      ],
    },
  },
  {
    name: 'narrow-box',
    description: 'Deep path (6 crumbs) that exercises middle-collapse in a narrow container',
    props: {
      items: [
        { label: 'Home', href: '#' },
        { label: 'Projects', href: '#' },
        { label: 'Acme Corp', href: '#' },
        { label: 'Q3 Planning', href: '#' },
        { label: 'Design System', href: '#' },
        { label: 'Breadcrumb' },
      ],
    },
  },
];

/**
 * @typedef {{ label?: string, href?: string }} BreadcrumbItem
 * @param {{ items?: BreadcrumbItem[], separator?: string }} [props]
 * @returns {{ node: HTMLElement, cleanup: () => void }}
 */
export function render(props = {}) {
  const items = props.items ?? propTypes.items.default;
  const separator = props.separator ?? propTypes.separator.default;

  const root = document.createElement('nav');
  root.className = 'dk-breadcrumb';
  root.setAttribute('aria-label', 'Breadcrumb');

  items.forEach((item, i) => {
    const isLast = i === items.length - 1;
    if (isLast) {
      const crumb = document.createElement('span');
      crumb.className = 'dk-breadcrumb-crumb dk-breadcrumb-current';
      crumb.textContent = item.label ?? '';
      crumb.setAttribute('aria-current', 'page');
      root.append(crumb);
    } else {
      const crumb = document.createElement('a');
      crumb.className = 'dk-breadcrumb-crumb';
      crumb.textContent = item.label ?? '';
      crumb.href = item.href ?? '#';
      crumb.addEventListener('click', () => {
        root.dispatchEvent(new CustomEvent('breadcrumb:navigate', {
          bubbles: true,
          detail: { label: item.label, href: item.href, index: i },
        }));
      });
      root.append(crumb);
    }

    if (!isLast) {
      const sep = document.createElement('span');
      sep.className = 'dk-breadcrumb-separator';
      sep.setAttribute('aria-hidden', 'true');
      sep.textContent = ` ${separator} `;
      root.append(sep);
    }
  });

  const cleanup = installBreadcrumbCollapse(root);
  return { node: root, cleanup };
}

/**
 * Observe a `.dk-breadcrumb` root with a ResizeObserver and collapse middle
 * crumbs into a single `…` ellipsis element when they would overflow a single
 * row, always keeping the first and last crumbs visible. When sufficient space
 * is restored the original crumbs reappear.
 *
 * Collapse strategy: compare the natural full-width of the crumb rail (read
 * while `flex-wrap: wrap` is still in effect, before any DOM surgery) against
 * the available container width. If the rail would overflow, switch the root to
 * `flex-wrap: nowrap`, hide the middle crumbs/separators, and insert a single
 * ellipsis crumb with its flanking separators. The observed element is the root
 * itself; collapsing children does not change its layout width, so there is no
 * observer feedback loop.
 *
 * @param {Element} root - a `.dk-breadcrumb` nav element
 * @returns {() => void} cleanup function that disconnects the observer
 */
export function installBreadcrumbCollapse(root) {
  if (typeof ResizeObserver === 'undefined') return () => {};

  const htmlRoot = /** @type {HTMLElement} */ (root);

  /** @type {boolean} */
  let collapsed = false;

  /**
   * Return all direct child elements that are either crumbs or separators,
   * in DOM order, tagged by kind.
   * @returns {{ el: HTMLElement, kind: 'crumb' | 'separator' }[]}
   */
  const originalChildren = () =>
    Array.from(htmlRoot.children)
      .filter(
        (el) =>
          el.classList.contains('dk-breadcrumb-crumb') ||
          el.classList.contains('dk-breadcrumb-separator'),
      )
      .map((el) => ({
        el: /** @type {HTMLElement} */ (el),
        kind: /** @type {'crumb' | 'separator'} */ (
          el.classList.contains('dk-breadcrumb-separator') ? 'separator' : 'crumb'
        ),
      }));

  /**
   * Measure the natural single-line width of the crumb trail. Must measure with
   * `nowrap`: with `wrap` in effect the trail folds to fit its container and
   * `scrollWidth` collapses to the container width, which would always read as
   * "fits" and defeat the collapse. Only valid in the non-collapsed state.
   * @returns {number}
   */
  const naturalWidth = () => {
    const prev = htmlRoot.style.flexWrap;
    htmlRoot.style.flexWrap = 'nowrap';
    const w = htmlRoot.scrollWidth;
    htmlRoot.style.flexWrap = prev;
    return w;
  };

  /** @param {number} availableWidth */
  const apply = (availableWidth) => {
    // Collect only original crumb/separator elements (ignores the ellipsis if
    // it was already inserted).
    const entries = originalChildren().filter(
      (e) => !e.el.classList.contains('dk-breadcrumb-ellipsis'),
    );

    const crumbs = entries.filter((e) => e.kind === 'crumb');
    // Need at least 3 crumbs to have a collapsible middle (first + ≥1 middle + last).
    if (crumbs.length < 3) {
      if (collapsed) {
        htmlRoot.style.flexWrap = '';
        collapsed = false;
      }
      return;
    }

    // Temporarily restore full content to measure natural width.
    if (collapsed) {
      // Show all original children so scrollWidth reflects the full trail.
      for (const { el } of entries) el.style.display = '';
      // Remove the ellipsis crumb and its separators.
      for (const el of Array.from(htmlRoot.querySelectorAll('.dk-breadcrumb-ellipsis'))) {
        el.remove();
      }
      htmlRoot.style.flexWrap = 'wrap';
      collapsed = false;
    }

    const nat = naturalWidth();
    if (nat <= availableWidth) {
      // Fits — stay expanded.
      return;
    }

    // Does not fit: collapse middle crumbs.
    // Hide all crumbs/separators except the first crumb and last crumb.
    const firstCrumb = crumbs[0].el;
    const lastCrumb = crumbs[crumbs.length - 1].el;

    for (const { el } of entries) {
      if (el === firstCrumb || el === lastCrumb) continue;
      el.style.display = 'none';
    }

    // Build the ellipsis element and its two flanking separators.
    const sep = (htmlRoot.querySelector('.dk-breadcrumb-separator') ?? null);
    const sepText = sep ? sep.textContent ?? ' > ' : ' > ';

    const sepBefore = document.createElement('span');
    sepBefore.className = 'dk-breadcrumb-separator';
    sepBefore.setAttribute('aria-hidden', 'true');
    sepBefore.textContent = sepText;

    const ellipsis = document.createElement('span');
    ellipsis.className = 'dk-breadcrumb-ellipsis';
    ellipsis.setAttribute('aria-hidden', 'true');
    ellipsis.textContent = '…'; // …

    const sepAfter = document.createElement('span');
    sepAfter.className = 'dk-breadcrumb-separator';
    sepAfter.setAttribute('aria-hidden', 'true');
    sepAfter.textContent = sepText;

    // Insert after the first crumb: sep > … > sep, then the last crumb follows.
    firstCrumb.after(sepBefore, ellipsis, sepAfter);

    // Lock to a single row now that middle is collapsed.
    htmlRoot.style.flexWrap = 'nowrap';
    collapsed = true;
  };

  // The observer delivers its first entry once the node is attached and sized;
  // that drives the initial collapse decision. render() self-wires this before
  // the node is appended, so there is nothing to measure synchronously here.
  // (Same pattern as AdaptiveMetricsList; covered by
  // pages/responsive-adaptive-tests.html.)
  const observer = new ResizeObserver((entries) => {
    const w = entries[0]?.contentRect?.width ?? 0;
    if (w > 0) apply(w);
  });
  observer.observe(htmlRoot);

  return () => {
    observer.disconnect();
    // Restore element to clean non-collapsed state on cleanup.
    if (collapsed) {
      for (const el of Array.from(htmlRoot.querySelectorAll('.dk-breadcrumb-ellipsis'))) {
        el.remove();
      }
      for (const { el } of originalChildren()) {
        el.style.display = '';
      }
      htmlRoot.style.flexWrap = '';
      collapsed = false;
    }
  };
}
