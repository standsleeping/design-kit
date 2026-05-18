// Mount the canonical system sidebar (NavStack from nav-data.js) into a
// page's left chrome slot. Provides a unified navigation surface across
// every clickable page so the user is always grounded in where they are
// and where they came from. See planning/design-kit/nav-model.md in
// prinzfiles for the topology rationale and surface contract.
//
// Usage (auto-mount):
//   Page places <... data-system-nav data-current="<page-id>"> and includes
//   <script type="module" src="components/system/system-sidebar.js"></script>.
//
// Usage (programmatic, e.g., storybook):
//   import { mountSystemSidebar } from './components/system/system-sidebar.js';
//   await mountSystemSidebar({ host, current, levels, initialPath, onSelect });

import { LEVELS, TARGETS } from './nav-data.js';

function applySelection(levels, currentId) {
  if (!currentId) return levels;
  return levels.map((level) => ({
    ...level,
    items: level.items.map((item) =>
      item.id === currentId ? { ...item, selected: true } : item,
    ),
  }));
}

function defaultSelectHandler(e) {
  const target = TARGETS[e.detail.id];
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
    opts.onSelect ?? defaultSelectHandler,
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
  mountSystemSidebar({ current: slot.dataset.current });
}
