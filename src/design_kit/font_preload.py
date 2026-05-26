"""Build-managed font preload: discover the self-hosted brand font early, once.

The Recursive woff2 is preloaded so the browser fetches it at the start of the page
load rather than only when the first glyph that needs it is laid out. On a warm
cache the font is then present at first paint; on a cold load the fetch runs in
parallel with the stylesheet, so the metric-matched fallback (see
``token_css.FONT_FACE``) is swapped out as early as possible.

Like the first-paint render-state bootstrap, the preload is a single build-managed
source injected into every page (``GENERATE_INVARIANTS_LINT_VARIATION``) rather than
hand-authored per page, and the injection is verified at build time
(``SHIFT_VALIDATION_LEFT``): a page that silently loses the hint is a loud build
failure, not a slow first paint discovered in the field.

This is a separate artifact from ``head_bootstrap`` (the render-state script): they
share the "inject into ``<head>`` before the first stylesheet" anchor
(``first_stylesheet_pos``) but carry different payloads and answer to different
contracts. The preload ``crossorigin`` is mandatory even same-origin, or the
preload will not match the font fetch and the browser double-downloads.
"""

from __future__ import annotations

from design_kit.head_bootstrap import first_stylesheet_pos
from design_kit.token_css import FONT_WOFF2_HREF

# Idempotency/detection marker. The attribute prefix is unique enough not to collide
# with a stylesheet/script preload a page might already carry.
PRELOAD_MARKER = 'rel="preload" as="font"'

# `crossorigin` is required even though the font is same-origin: a font fetch is
# always made in CORS mode, so a preload without it is treated as a different
# request and does not satisfy the fetch (the browser warns and downloads twice).
FONT_PRELOAD = (
    f'<link rel="preload" as="font" type="font/woff2" '
    f'href="{FONT_WOFF2_HREF}" crossorigin>'
)


def inject_font_preload(html: str) -> str:
    """Insert the font preload into ``html``'s head, before the first stylesheet.

    Idempotent: a document already carrying the preload is returned unchanged. The
    hint is inserted immediately before the first stylesheet ``<link>`` so the font
    fetch is discovered alongside the CSS fetch. Falls back to just before
    ``</head>`` when there is no stylesheet link, and returns the input unchanged
    when there is no head at all.
    """
    if PRELOAD_MARKER in html:
        return html
    idx = first_stylesheet_pos(html)
    if idx == -1:
        idx = html.find("</head>")
    if idx == -1:
        return html
    return f"{html[:idx]}{FONT_PRELOAD}\n  {html[idx:]}"


def font_preload_violation(html: str) -> str | None:
    """Return why ``html`` fails the font-preload contract, or None if it holds.

    The contract for a *built* page: it carries the preload, and the preload sits
    before the first stylesheet so the font fetch starts in parallel with the CSS.
    The build calls this after injection so a silent skip becomes a named failure.
    """
    marker_pos = html.find(PRELOAD_MARKER)
    if marker_pos == -1:
        return "font preload missing (injection skipped or failed)"
    link_pos = first_stylesheet_pos(html)
    if link_pos != -1 and marker_pos > link_pos:
        return "font preload appears after the first stylesheet"
    return None
