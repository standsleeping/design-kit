// Mount the canonical system sidebar (NavStack from nav-data.js) into a
// page's left chrome slot. Provides a unified navigation surface across
// every clickable page so the user is always grounded in where they are
// and where they came from.
//
// Usage (auto-mount):
//   Page places <... data-system-nav data-current="<page-id>"> and includes
//   <script type="module" src="components/system/system-sidebar.js"></script>.
//
// Usage (programmatic, e.g., storybook):
//   import { mountSystemSidebar } from './components/system/system-sidebar.js';
//   await mountSystemSidebar({ host, current, levels, initialPath, onSelect });

import { LEVELS, TARGETS } from './nav-data.js';

/**
 * @typedef {{ kind: string, id: string, label?: string, selected?: boolean }} NavItem
 * @typedef {{ id: string, title?: string, items: NavItem[] }} NavLevel
 */

/**
 * @param {NavLevel[]} levels
 * @param {string | undefined} currentId
 * @returns {NavLevel[]}
 */
function applySelection(levels, currentId) {
  if (!currentId) return levels;
  return levels.map((level) => ({
    ...level,
    items: level.items.map((item) =>
      item.id === currentId ? { ...item, selected: true } : item,
    ),
  }));
}

/**
 * @param {CustomEvent<{ id: string }>} e
 * @returns {void}
 */
function defaultSelectHandler(e) {
  const id = e.detail.id;
  const target = TARGETS[/** @type {keyof typeof TARGETS} */ (id)];
  if (!target) return;
  if (target.startsWith('#')) {
    // Hash targets in TARGETS are anchors on the index page (token
    // sections — Colors, Typography, ...). On the index itself we can
    // hash-mutate for a no-reload smooth scroll; on every other page we
    // have to navigate to the index, because setting the current page's
    // hash wouldn't take the user anywhere useful and would silently
    // swallow the click.
    const onIndex =
      window.location.pathname === '/' ||
      window.location.pathname.endsWith('/index.html');
    if (onIndex) {
      window.location.hash = target;
    } else {
      window.location.href = `index.html${target}`;
    }
  } else {
    window.location.href = target;
  }
}

/**
 * @typedef {{
 *   host?: Element | null,
 *   current?: string,
 *   levels?: NavLevel[],
 *   initialPath?: string[],
 *   onSelect?: (e: CustomEvent<{ id: string }>) => void,
 * }} MountSystemSidebarOpts
 */

/**
 * @param {MountSystemSidebarOpts} [opts]
 * @returns {Promise<HTMLElement | null>}
 */
export async function mountSystemSidebar(opts = {}) {
  const host = opts.host ?? document.querySelector('[data-system-nav]');
  if (!host) return null;

  const navStackMod = await import('../nav-stack.js');
  const levels = applySelection(opts.levels ?? LEVELS, opts.current);
  const initialPath = opts.initialPath ?? ['root'];

  const navStack = navStackMod.render({ levels, initialPath });
  host.append(navStack);
  navStack.addEventListener(
    'nav-stack:select',
    /** @type {EventListener} */ (opts.onSelect ?? defaultSelectHandler),
  );

  return navStack;
}

// Auto-mount when loaded as a page script. Pages mark the host with
// [data-system-nav] and optionally set data-current="<page-id>" to
// highlight themselves in the system nav. Hosts that opt into manual
// control (mountSystemSidebar called from page code with custom levels,
// e.g. storybook) carry [data-system-nav-manual] to suppress this default.
const slot = document.querySelector(
  '[data-system-nav]:not([data-system-nav-manual])',
);
if (slot) {
  const htmlSlot = /** @type {HTMLElement} */ (slot);
  mountSystemSidebar({ current: htmlSlot.dataset.current });
}
