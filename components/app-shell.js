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

export function render() {
  const root = document.createElement('div');
  root.className = 'dk-app-shell';

  const header = document.createElement('div');
  header.className = 'dk-app-shell-header';
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
  footer.className = 'dk-app-shell-footer';
  footer.dataset.slot = 'footer';

  root.append(header, body, footer);
  return root;
}
