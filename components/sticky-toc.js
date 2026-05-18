import { icon as buildIcon } from './system/icons.js';

let nextId = 0;

export const metadata = {
  name: 'StickyToc',
  description: 'Sticky chrome bar that collapses to show the active section title; expands to a full TOC overlay. Tracks active section via IntersectionObserver. Returns { node, cleanup }.',
  category: 'navigation',
  examplePage: 'sticky-toc.html',
};

export const propTypes = {
  items: { type: 'array', default: [] },
  label: { type: 'string', default: 'On this page' },
  expanded: { type: 'boolean', default: false },
  responsive: { type: 'boolean', default: false },
  title: { type: 'string', default: '' },
  back: { type: 'object', default: null },
};

export const variants = [
  {
    name: 'collapsed',
    description: 'Default collapsed state with a static fallback label',
    props: {
      label: 'On this page',
      items: [
        { href: '#top', label: 'Top', level: 0 },
        { href: '#repl', label: 'REPL', level: 0 },
        { href: '#basics', label: 'Basic types', level: 0 },
        { href: '#building', label: 'Building types', level: 0 },
        { href: '#application', label: 'Application', level: 0 },
        { href: '#lambdas', label: 'Lambdas', level: 0 },
      ],
    },
  },
  {
    name: 'expanded',
    description: 'Open showing the full TOC list',
    props: {
      expanded: true,
      items: [
        { href: '#top', label: 'Top', level: 0 },
        { href: '#repl', label: 'REPL', level: 0 },
        { href: '#basics', label: 'Basic types', level: 0 },
        { href: '#building', label: 'Building types', level: 0 },
        { href: '#application', label: 'Application', level: 0 },
        { href: '#lambdas', label: 'Lambdas', level: 0 },
      ],
    },
  },
  {
    name: 'nested',
    description: 'Two levels of headings',
    props: {
      expanded: true,
      items: [
        { href: '#overview', label: 'Overview', level: 0 },
        { href: '#install', label: 'Install', level: 0 },
        { href: '#install-cli', label: 'CLI', level: 1 },
        { href: '#install-lib', label: 'Library', level: 1 },
        { href: '#api', label: 'API reference', level: 0 },
      ],
    },
  },
  {
    name: 'with-back-link',
    description: 'A back-link slot above the items list, separated by a thin border',
    props: {
      expanded: true,
      title: 'Lean by Example',
      back: { href: '/', label: 'Posts' },
      items: [
        { href: '#top', label: 'Top', level: 0 },
        { href: '#repl', label: 'REPL', level: 0 },
        { href: '#basics', label: 'Basic types', level: 0 },
        { href: '#building', label: 'Building types', level: 0 },
      ],
    },
  },
  {
    name: 'with-tldr',
    description: 'Each item carries an optional one-line summary, shown beneath the active item',
    props: {
      expanded: true,
      title: 'Propositions as Types',
      items: [
        { href: '#s1', label: 'Passage 1', level: 0, tldr: 'Three separate languages: code, assertions, proofs' },
        { href: '#s2', label: 'Passage 2', level: 0, tldr: 'Dependent type theory unifies all three' },
        { href: '#s3', label: 'Passage 3', level: 0, tldr: 'Prop and constructors build claims from claims' },
        { href: '#s4', label: 'Passage 4', level: 0, tldr: 'Proof p: a type for each proposition' },
      ],
    },
  },
];

export function render(props = {}) {
  const items = props.items ?? propTypes.items.default;
  const label = props.label ?? propTypes.label.default;
  let expanded = props.expanded ?? propTypes.expanded.default;
  const responsive = props.responsive ?? propTypes.responsive.default;
  const title = props.title ?? propTypes.title.default;
  const back = props.back ?? propTypes.back.default;
  const panelId = `dk-sticky-toc-panel-${++nextId}`;

  const root = document.createElement('nav');
  root.className = responsive ? 'dk-sticky-toc dk-sticky-toc-responsive' : 'dk-sticky-toc';
  root.setAttribute('aria-label', label);
  root.dataset.state = expanded ? 'expanded' : 'collapsed';

  const summary = document.createElement('button');
  summary.type = 'button';
  summary.className = 'dk-sticky-toc-summary';
  summary.setAttribute('aria-expanded', String(expanded));
  summary.setAttribute('aria-controls', panelId);

  const currentEl = document.createElement('span');
  currentEl.className = 'dk-sticky-toc-current';
  currentEl.dataset.fallback = label;

  const chevron = document.createElement('span');
  chevron.className = 'dk-sticky-toc-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  const expandSvg = buildIcon('chevron-down');
  if (expandSvg) chevron.append(expandSvg); else chevron.textContent = '[+]';

  summary.append(currentEl, chevron);
  root.append(summary);

  const panel = document.createElement('div');
  panel.className = 'dk-sticky-toc-panel';
  panel.id = panelId;

  if (back && back.href) {
    const backEl = document.createElement('a');
    backEl.className = 'dk-sticky-toc-back';
    backEl.href = back.href;
    const backSvg = buildIcon('arrow-left');
    if (backSvg) backEl.append(backSvg);
    const backLabel = document.createElement('span');
    backLabel.className = 'dk-sticky-toc-back-label';
    backLabel.textContent = back.label ?? 'Back';
    backEl.append(backLabel);
    panel.append(backEl);
  }

  if (title) {
    const titleEl = document.createElement('div');
    titleEl.className = 'dk-sticky-toc-title';
    titleEl.textContent = title;
    panel.append(titleEl);
  }

  const list = document.createElement('ul');
  list.className = 'dk-sticky-toc-list';
  panel.append(list);

  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.className = 'dk-sticky-toc-dismiss';
  dismiss.setAttribute('aria-label', 'Collapse');
  dismiss.setAttribute('aria-controls', panelId);
  const dismissIcon = document.createElement('span');
  dismissIcon.className = 'dk-sticky-toc-chevron';
  dismissIcon.setAttribute('aria-hidden', 'true');
  const dismissSvg = buildIcon('chevron-up');
  if (dismissSvg) dismissIcon.append(dismissSvg); else dismissIcon.textContent = '[−]';
  dismiss.append(dismissIcon);
  panel.append(dismiss);

  root.append(panel);

  const itemEls = new Map();
  const labelById = new Map();
  let activeId = '';

  const setActive = (id) => {
    if (id === activeId) return;
    activeId = id;
    for (const [itemId, li] of itemEls) {
      const isActive = itemId === id;
      li.classList.toggle('dk-sticky-toc-item-active', isActive);
      const link = li.querySelector('.dk-sticky-toc-link');
      if (link) {
        if (isActive) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    }
    currentEl.textContent = labelById.get(id) ?? '';
    root.dispatchEvent(new CustomEvent('sticky-toc:change', {
      bubbles: true,
      detail: { activeId: id },
    }));
  };

  const expand = () => {
    if (expanded) return;
    expanded = true;
    root.dataset.state = 'expanded';
    summary.setAttribute('aria-expanded', 'true');
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('pointerdown', onDocumentPointerDown, true);
    root.dispatchEvent(new CustomEvent('sticky-toc:expand', { bubbles: true }));
  };

  const collapse = () => {
    if (!expanded) return;
    expanded = false;
    root.dataset.state = 'collapsed';
    summary.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('pointerdown', onDocumentPointerDown, true);
    root.dispatchEvent(new CustomEvent('sticky-toc:collapse', { bubbles: true }));
  };

  const onKeydown = (e) => {
    if (e.key === 'Escape') collapse();
  };

  const onDocumentPointerDown = (e) => {
    if (!root.contains(e.target)) collapse();
  };

  for (const item of items) {
    const li = document.createElement('li');
    li.className = `dk-sticky-toc-item dk-sticky-toc-item-level-${item.level ?? 0}`;

    const link = document.createElement('a');
    link.className = 'dk-sticky-toc-link';
    link.href = item.href ?? '#';
    link.textContent = item.label ?? '';
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          // Snap the panel closed before measuring + scrolling. If we let the
          // collapse animate, the document shrinks above the target while the
          // smooth scroll runs, and the scroll undershoots — landing on the
          // section above the intended one.
          const prevTransition = panel.style.transition;
          panel.style.transition = 'none';
          collapse();
          void panel.offsetHeight;
          panel.style.transition = prevTransition;
          const stickyHeight = summary.getBoundingClientRect().height;
          const breathingRoom = 16;
          const targetTop = target.getBoundingClientRect().top + window.scrollY;
          const finalY = Math.max(0, targetTop - stickyHeight - breathingRoom);
          window.scrollTo({ top: finalY, behavior: 'smooth' });
          return;
        }
      }
      collapse();
    });

    li.append(link);

    if (item.tldr) {
      const tldr = document.createElement('span');
      tldr.className = 'dk-sticky-toc-tldr';
      tldr.textContent = item.tldr;
      li.append(tldr);
    }

    list.append(li);

    const id = (item.href ?? '').replace(/^#/, '');
    if (id) {
      itemEls.set(id, li);
      labelById.set(id, item.label ?? '');
    }
  }

  summary.addEventListener('click', () => {
    if (expanded) collapse(); else expand();
  });
  dismiss.addEventListener('click', (e) => {
    e.stopPropagation();
    collapse();
  });

  let observer = null;
  const ids = Array.from(itemEls.keys());
  if (ids.length > 0 && typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
          break;
        }
      }
    }, {
      rootMargin: '-10% 0px -80% 0px',
      threshold: 0,
    });
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
  }

  if (expanded) {
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('pointerdown', onDocumentPointerDown, true);
  }

  const cleanup = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('pointerdown', onDocumentPointerDown, true);
  };

  return { node: root, cleanup };
}
