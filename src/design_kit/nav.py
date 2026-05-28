"""SSR for the design-kit system nav.

The nav data is also defined in ``components/system/nav-data.js`` (consumed by
``system-sidebar.js`` at runtime for click-to-URL routing). Keeping the two in
sync is enforced by ``tests/test_nav_data_drift.py``; edit both together.

Rendering the nav as HTML at build time lets the items exist at first paint,
so the sidebar never paints empty and then refills (HYDRATION_RESERVES_GEOMETRY).
"""

from __future__ import annotations

import html
import re
from typing import Literal, TypedDict

NavKind = Literal["section-header", "section-item", "item", "branch"]


class NavItem(TypedDict, total=False):
    kind: NavKind
    id: str
    label: str
    icon: str
    branchTo: str
    selected: bool


class NavLevel(TypedDict):
    id: str
    title: str
    items: list[NavItem]


LEVELS: list[NavLevel] = [
    {
        "id": "root",
        "title": "Design Kit",
        "items": [
            {"kind": "section-header", "id": "tokens-header", "label": "Tokens"},
            {"kind": "section-item", "id": "colors", "label": "Colors"},
            {"kind": "section-item", "id": "typography", "label": "Typography"},
            {"kind": "section-item", "id": "display-typography", "label": "Display Typography"},
            {"kind": "section-item", "id": "spacing", "label": "Spacing"},
            {"kind": "section-item", "id": "borders", "label": "Borders"},
            {"kind": "section-item", "id": "tables", "label": "Tables"},
            {"kind": "section-item", "id": "icons", "label": "Icons"},
            {"kind": "section-header", "id": "discovery-header", "label": "Discovery"},
            {"kind": "section-item", "id": "storybook", "label": "Storybook"},
            {"kind": "section-item", "id": "taxonomy", "label": "Design Taxonomy"},
            {"kind": "section-header", "id": "patterns-header", "label": "Patterns"},
            {"kind": "section-item", "id": "dashboard-shell", "label": "Dashboard Shell"},
            {"kind": "section-item", "id": "inset-vs-flush", "label": "Inset vs Flush"},
            {"kind": "section-item", "id": "session-stats", "label": "Session Stats"},
            {"kind": "section-item", "id": "sticky-toc", "label": "Sticky TOC"},
            {"kind": "section-item", "id": "line-height-units", "label": "Line Height Units"},
            {"kind": "section-header", "id": "audits-header", "label": "Audits"},
            {"kind": "section-item", "id": "border-audit", "label": "Border Audit"},
            {"kind": "section-item", "id": "control-audit", "label": "Control Audit"},
            {"kind": "section-item", "id": "contract-tests", "label": "Contract Tests"},
            {"kind": "section-item", "id": "app-runtime-tests", "label": "App Runtime Tests"},
            {"kind": "section-item", "id": "responsive-table-tests", "label": "Responsive Table Tests"},
            {"kind": "section-item", "id": "responsive-adaptive-tests", "label": "Adaptive Behavior Tests"},
            {"kind": "section-item", "id": "responsive-fit-tests", "label": "Fit Tests"},
        ],
    },
]


def render_nav_stack_html(current: str | None = None) -> str:
    """Render the system nav as static HTML matching what nav-stack.js produces.

    Shape mirrors the JS-rendered tree so the hydration step in
    ``system-sidebar.js`` only attaches a click delegation; it never rebuilds
    the DOM. ``current`` is the ``data-current`` page id; the matching item
    gets ``dk-nav-stack-item-selected``.
    """
    level = LEVELS[0]
    level_id = html.escape(level["id"])
    parts: list[str] = []
    parts.append(
        '<nav class="dk-nav-stack" data-state="expanded" '
        f'data-level="{level_id}" data-depth="1">'
    )
    parts.append(f'<div class="dk-nav-stack-level" data-level="{level_id}">')
    parts.append('<div class="dk-nav-stack-header">')
    parts.append(
        '<div class="dk-nav-stack-title">'
        f'{html.escape(level.get("title", ""))}'
        "</div>"
    )
    parts.append("</div>")
    parts.append('<div class="dk-nav-stack-body">')
    parts.append('<div class="dk-nav-stack-list">')
    for item in level["items"]:
        parts.append(_render_item(item, current))
    parts.append("</div>")
    parts.append("</div>")
    parts.append("</div>")
    parts.append("</nav>")
    return "".join(parts)


def _render_item(item: NavItem, current: str | None) -> str:
    kind = item.get("kind")
    item_id = item.get("id", "")
    label = item.get("label", "")
    if kind == "section-header":
        return (
            '<div class="dk-nav-stack-section-header" data-kind="section-header">'
            f'<span class="dk-nav-stack-label">{html.escape(label)}</span>'
            "</div>"
        )
    classes = ["dk-nav-stack-item"]
    if kind == "section-item":
        classes.append("dk-nav-stack-section-item")
    if current is not None and item_id == current:
        classes.append("dk-nav-stack-item-selected")
    cls_attr = " ".join(classes)
    icon_glyph = html.escape(label[:1].upper() if label else "")
    return (
        f'<button type="button" class="{cls_attr}" '
        f'data-kind="{html.escape(kind or "")}" '
        f'data-item-id="{html.escape(item_id)}">'
        f'<span class="dk-nav-stack-icon" aria-hidden="true">{icon_glyph}</span>'
        f'<span class="dk-nav-stack-label">{html.escape(label)}</span>'
        "</button>"
    )


_NAV_SLOT_RE = re.compile(r"<div\b[^>]*\bdata-system-nav\b[^>]*>")


def inject_system_nav(text: str) -> str:
    """Inject the SSR'd nav stack into a page's [data-system-nav] slot.

    Finds the slot div, reads ``data-current`` for the active highlight, and
    fills the div with the rendered nav stack. Slots marked
    ``data-system-nav-manual`` opt out (storybook constructs its own augmented
    levels at runtime). Pages without a system-nav slot are returned unchanged.
    """
    match = _NAV_SLOT_RE.search(text)
    if match is None:
        return text
    open_tag = match.group(0)
    if "data-system-nav-manual" in open_tag:
        return text
    close_idx = text.find("</div>", match.end())
    if close_idx == -1:
        return text
    current = _extract_data_current(open_tag)
    nav_html = render_nav_stack_html(current)
    return text[: match.end()] + nav_html + text[close_idx:]


def _extract_data_current(open_tag: str) -> str | None:
    m = re.search(r'data-current="([^"]*)"', open_tag)
    return m.group(1) if m else None
