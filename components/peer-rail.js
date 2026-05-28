// Peer-rail overlay: dev-time visualization of every element that computes
// --peer-rail (chrome strips). Color-codes each member by whether its rendered
// height matches the expected --layout-chrome-bar-h × --chrome-bar-rows
// formula, and prints actual/expected/Δ on each overlay box. Pair with
// pages/peer-rail-audit.html, which enforces the same contract programmatically.
//
// Use:
//   <script src="components/peer-rail.js"></script>
//   then in the browser console:
//     __dkPeerRailOverlay.toggle()   // show/hide
//     __dkPeerRailOverlay.audit()    // returns the violation list
//
// The overlay is opt-in and does not auto-install; pages that want it ship
// the <script> tag (or load it on demand from devtools). It re-renders on
// resize and DOM mutation so it tracks state changes (nav drill-in,
// sidebar collapse, chrome-rows toggle).

(function () {
  const TAG = 'chrome';
  const TOL = 1.5;
  const HOST_ID = '__dk-peer-rail-overlay-host';

  /** @param {Element} el */
  function probeExpectedHeight(el) {
    const probe = el.ownerDocument.createElement('div');
    probe.style.cssText = (
      'position: absolute; visibility: hidden; pointer-events: none; ' +
      'left: -99999px; top: 0; width: 1px; ' +
      'height: calc(var(--layout-chrome-bar-h) * var(--chrome-bar-rows, 1));'
    );
    if (!el.parentNode) return 0;
    el.parentNode.insertBefore(probe, el);
    const h = probe.getBoundingClientRect().height;
    probe.remove();
    return h;
  }

  /** @param {Document} doc */
  function collectMembers(doc) {
    /** @type {Array<{ el: Element, tag: string, rect: DOMRect }>} */
    const out = [];
    const view = doc.defaultView ?? window;
    for (const el of Array.from(doc.querySelectorAll('*'))) {
      const cs = view.getComputedStyle(el);
      const tag = cs.getPropertyValue('--peer-rail').trim();
      if (!tag || tag === 'none') continue;
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;
      out.push({ el, tag, rect });
    }
    return out;
  }

  /** @param {{ el: Element, tag: string, rect: DOMRect }} member */
  function classify(member) {
    const expected = probeExpectedHeight(member.el);
    const wrapOk = member.el.closest('[data-wrap-ok]') !== null;
    const dy = member.rect.height - expected;
    let status;
    if (wrapOk) status = dy < -TOL ? 'fail' : 'pass';
    else status = Math.abs(dy) <= TOL ? 'pass' : 'fail';
    return { ...member, expected, dy, status, wrapOk };
  }

  // Host overlay sits above all page content (z-index above DK's --z-chrome).
  // pointer-events: none so the overlay never intercepts clicks.
  function ensureHost() {
    let host = document.getElementById(HOST_ID);
    if (host) return host;
    host = document.createElement('div');
    host.id = HOST_ID;
    host.style.cssText = (
      'position: fixed; inset: 0; pointer-events: none; ' +
      'z-index: 2147483647;'
    );
    document.body.appendChild(host);
    return host;
  }

  /** @param {{ el: Element, tag: string, rect: DOMRect, expected: number, dy: number, status: string, wrapOk: boolean }} record */
  function makeMarker(record) {
    const r = record.rect;
    const passColor = 'rgba(40, 167, 69, 0.85)';
    const failColor = 'rgba(220, 53, 69, 0.85)';
    const color = record.status === 'pass' ? passColor : failColor;
    const box = document.createElement('div');
    box.style.cssText = (
      `position: fixed; left: ${r.left}px; top: ${r.top}px; ` +
      `width: ${r.width}px; height: ${r.height}px; ` +
      `outline: 2px solid ${color}; ` +
      `background: ${color.replace('0.85', '0.08')}; ` +
      'box-sizing: border-box; pointer-events: none;'
    );
    const label = document.createElement('div');
    const sign = record.dy > 0 ? '+' : '';
    const wrap = record.wrapOk ? ' wrap-ok' : '';
    label.textContent = (
      `[${record.tag}${wrap}] ${record.rect.height.toFixed(1)} / ` +
      `${record.expected.toFixed(1)} (Δ ${sign}${record.dy.toFixed(1)})`
    );
    label.style.cssText = (
      'position: absolute; left: 0; bottom: 100%; ' +
      'padding: 2px 4px; font: 10px/1.2 ui-monospace, monospace; ' +
      `background: ${color}; color: white; white-space: nowrap;`
    );
    box.appendChild(label);
    return box;
  }

  let active = false;
  /** @type {MutationObserver | null} */
  let mo = null;
  let raf = 0;

  function render() {
    if (!active) return;
    const host = ensureHost();
    host.replaceChildren();
    const members = collectMembers(document).map(classify);
    for (const m of members) host.appendChild(makeMarker(m));
  }

  function scheduleRender() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      render();
    });
  }

  function show() {
    if (active) return;
    active = true;
    render();
    mo = new MutationObserver(scheduleRender);
    mo.observe(document.documentElement, {
      attributes: true, childList: true, subtree: true,
    });
    window.addEventListener('resize', scheduleRender);
    window.addEventListener('scroll', scheduleRender, true);
  }

  function hide() {
    if (!active) return;
    active = false;
    if (mo) { mo.disconnect(); mo = null; }
    window.removeEventListener('resize', scheduleRender);
    window.removeEventListener('scroll', scheduleRender, true);
    const host = document.getElementById(HOST_ID);
    if (host) host.remove();
  }

  function toggle() {
    active ? hide() : show();
  }

  // Programmatic audit: returns the violation list without painting anything.
  // Useful from devtools or from a consumer's own test harness.
  function audit() {
    return collectMembers(document)
      .map(classify)
      .filter((m) => m.status === 'fail')
      .map((m) => ({
        tag: m.tag,
        selector: describe(m.el),
        actual: m.rect.height,
        expected: m.expected,
        dy: m.dy,
        wrapOk: m.wrapOk,
      }));
  }

  /** @param {Element} el */
  function describe(el) {
    let s = el.tagName.toLowerCase();
    if (el.id) s += `#${el.id}`;
    if (typeof el.className === 'string' && el.className.trim()) {
      s += '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.');
    }
    return s;
  }

  /** @type {any} */ (window).__dkPeerRailOverlay = { show, hide, toggle, audit };
})();
