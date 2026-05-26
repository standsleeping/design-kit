"""First-paint bootstrap: establish persisted render state before the page paints.

A persisted render preference (luminance, color theme) that is applied by deferred
or module JavaScript paints the default first, then corrects itself: a flash of the
wrong theme on every load (FOUC). The only code that runs before first paint is a
synchronous, render-blocking script in ``<head>``, so that is where the persisted
state is established. See the ``NO_FIRST_PAINT_FLASH`` principle.

This module is the *single source* for that script (see
``GENERATE_INVARIANTS_LINT_VARIATION``): every page receives the identical block,
injected by the build, rather than each page hand-rolling its own copy. The
attribute logic mirrors ``mountLuminanceToggle`` / ``mountColorThemeToggle`` in
``components/system/runtime.js`` — the toggles read the already-established state on
mount and only write it on user action.

Injection is verified, not assumed: ``bootstrap_violation`` lets the build assert the
block actually landed in each page before the first stylesheet, so a silent skip (an
idempotency-marker collision, a head with no stylesheet) is a loud build failure at the
authoring phase rather than a flash discovered at runtime (see ``SHIFT_VALIDATION_LEFT``).

Geometry restoration (panel widths, collapsed rails) is *per page* and therefore not
part of this universal block; a page that persists layout reserves its own geometry
(see ``HYDRATION_RESERVES_GEOMETRY``).
"""

from __future__ import annotations

import re

# Marker used to keep injection idempotent. Must be unique enough not to collide with
# a page's own first-paint scripts (e.g. a per-page geometry bootstrap whose comment
# also mentions "first paint"), or injection would be skipped as already-present.
BOOTSTRAP_MARKER = "dk-render-bootstrap"

# Inline, synchronous, render-blocking. Mirrors runtime.js: luminance is set only
# for the explicit 'light'/'dark' overrides (auto leaves the attribute off and lets
# `color-scheme: light dark` follow the OS); color theme is set only for the
# non-default values.
HEAD_BOOTSTRAP = (
    "<script>/* dk-render-bootstrap — establish persisted render state before "
    "paint (NO_FIRST_PAINT_FLASH) */\n"
    "(function(){try{var d=document.documentElement,s=localStorage;"
    "var l=s.getItem('dk-luminance');"
    "if(l==='dark'||l==='light')d.setAttribute('data-luminance',l);"
    "var t=s.getItem('dk-color-theme');"
    "if(t==='monochrome'||t==='solarized')d.setAttribute('data-color-theme',t);"
    "}catch(e){}})();</script>"
)

# Matches the first stylesheet link tolerant of attribute order, quoting, and spacing
# (`<link rel="stylesheet">`, `<link href=… rel='stylesheet'>`, extra whitespace), so
# the anchor does not silently depend on one exact authored form.
_STYLESHEET_RE = re.compile(
    r"<link\b[^>]*\brel\s*=\s*['\"]?stylesheet\b", re.IGNORECASE
)


def first_stylesheet_pos(html: str) -> int:
    """Index of the first stylesheet ``<link>``, or -1 if there is none.

    Public because the font-preload injection anchors on the same position (both
    land in ``<head>`` before the first stylesheet); sharing one finder keeps the
    two injectors from drifting on what "the first stylesheet" means.
    """
    match = _STYLESHEET_RE.search(html)
    return match.start() if match else -1


def inject_head_bootstrap(html: str) -> str:
    """Insert the first-paint bootstrap into ``html``'s head, before the first
    stylesheet.

    Idempotent: a document that already carries the marker is returned unchanged.
    The block is inserted immediately before the first stylesheet ``<link>`` so it
    runs after the charset/viewport metas but before any style is computed. Falls
    back to just before ``</head>`` when no stylesheet link is present, and returns
    the input unchanged when there is no head at all.
    """
    if BOOTSTRAP_MARKER in html:
        return html
    idx = first_stylesheet_pos(html)
    if idx == -1:
        idx = html.find("</head>")
    if idx == -1:
        return html
    return f"{html[:idx]}{HEAD_BOOTSTRAP}\n  {html[idx:]}"


def bootstrap_violation(html: str) -> str | None:
    """Return why ``html`` fails the first-paint-bootstrap contract, or None if it holds.

    The contract for a *built* page: it carries the bootstrap, and the bootstrap sits
    before the first stylesheet so persisted state is established before styles compute.
    The build calls this after injection so a silent skip becomes a named failure.
    """
    marker_pos = html.find(BOOTSTRAP_MARKER)
    if marker_pos == -1:
        return "first-paint bootstrap missing (injection skipped or failed)"
    link_pos = first_stylesheet_pos(html)
    if link_pos != -1 and marker_pos > link_pos:
        return "first-paint bootstrap appears after the first stylesheet"
    return None
