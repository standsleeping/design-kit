export const metadata = {
  name: 'AppShell',
  description: 'Application shell with header, footer, and left/right sidebar zones; hosts content in [data-slot="header"], [data-slot="left-sidebar"], [data-slot="main"], [data-slot="right-sidebar"], [data-slot="footer"]',
  category: 'layout',
};

export const propTypes = {};

export const variants = [
  {
    name: 'full-shell',
    description: 'Header, footer, both sidebars, and main',
    props: {},
    slots: {
      header: { component: 'MenuItem', props: { label: 'App Header' } },
      'left-sidebar': { component: 'MenuItem', props: { label: 'Left nav' } },
      main: { component: 'MenuItem', props: { label: 'Main content' } },
      'right-sidebar': { component: 'MenuItem', props: { label: 'Right panel' } },
      footer: { component: 'MenuItem', props: { label: 'Status bar' } },
    },
  },
  {
    name: 'main-only',
    description: 'Just the main zone',
    props: {},
    slots: {
      main: { component: 'MenuItem', props: { label: 'Main content' } },
    },
  },
  {
    name: 'header-and-main',
    description: 'Header plus main zone',
    props: {},
    slots: {
      header: { component: 'MenuItem', props: { label: 'App Header' } },
      main: { component: 'MenuItem', props: { label: 'Main content' } },
    },
  },
];

/**
 * @returns {HTMLDivElement}
 */
export function render() {
  const root = document.createElement('div');
  root.className = 'dk-app-shell';

  const header = document.createElement('div');
  header.className = 'dk-app-shell-header dk-topbar';
  header.dataset.slot = 'header';

  const body = document.createElement('div');
  body.className = 'dk-app-shell-body';

  const leftSidebar = document.createElement('div');
  leftSidebar.className = 'dk-app-shell-left';
  leftSidebar.dataset.slot = 'left-sidebar';

  const main = document.createElement('div');
  main.className = 'dk-app-shell-main';
  main.dataset.slot = 'main';

  const rightSidebar = document.createElement('div');
  rightSidebar.className = 'dk-app-shell-right';
  rightSidebar.dataset.slot = 'right-sidebar';

  body.append(leftSidebar, main, rightSidebar);

  const footer = document.createElement('div');
  footer.className = 'dk-app-shell-footer dk-topbar dk-topbar-bottom';
  footer.dataset.slot = 'footer';

  root.append(header, body, footer);
  return root;
}

/**
 * @typedef {{ sidebar: HTMLElement, below: number, to: 'icon' | 'hidden' }} CollapsingRail
 */

/**
 * Collapse populated rails as the shell narrows, so the center column keeps a
 * usable width instead of being crushed toward zero. Opt-in: a rail that
 * should yield carries `data-collapse-below` (a width in px) and
 * `data-collapse-to` (`"icon"` for rails whose content has an icon mode, e.g.
 * a NavStack; `"hidden"` for panels that have none). When the shell's content
 * width drops below that figure the rail's inner `.dk-sidebar` is driven to the
 * collapsed state, reusing the Sidebar's own icon/hidden CSS; at or above it,
 * back to `expanded`.
 *
 * The decision reads the shell's own width (so a shell embedded in a resizable
 * region collapses against that region, not the viewport) via a ResizeObserver.
 * Collapsing a rail changes its siblings' widths but not the shell's, so the
 * observed width never moves in response to a collapse — there is no feedback
 * loop. The enhancer owns each observed sidebar's `data-state`; it does not
 * coordinate with a consumer that also toggles that state by hand.
 *
 * @param {Element} shell - the `.dk-app-shell` root
 * @returns {() => void} cleanup that disconnects the observer
 */
export function installResponsiveRails(shell) {
  /** @type {CollapsingRail[]} */
  const rails = [];
  for (const rail of Array.from(shell.querySelectorAll('[data-collapse-below]'))) {
    const htmlRail = /** @type {HTMLElement} */ (rail);
    const below = Number(htmlRail.dataset.collapseBelow);
    const to = htmlRail.dataset.collapseTo === 'icon' ? 'icon' : 'hidden';
    const sidebar = /** @type {HTMLElement | null} */ (
      rail.querySelector('.dk-sidebar')
    );
    if (!sidebar || !Number.isFinite(below) || below <= 0) continue;
    rails.push({ sidebar, below, to });
  }
  if (rails.length === 0) return () => {};

  /** @param {number} width */
  const apply = (width) => {
    for (const { sidebar, below, to } of rails) {
      sidebar.dataset.state = width < below ? to : 'expanded';
    }
  };

  apply(shell.clientWidth);
  if (typeof ResizeObserver === 'undefined') return () => {};
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) apply(entry.contentRect.width);
  });
  observer.observe(shell);
  return () => observer.disconnect();
}
