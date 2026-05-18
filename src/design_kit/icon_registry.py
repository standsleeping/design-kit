"""Generate components/system/icons.js from vendored Radix SVGs.

The registry pairs each SVG with curated metadata (category, when-to-use
guidance) so consumers see one canonical surface for icon selection.

Read components/icons/*.svg, normalise the markup (strip width/height so CSS
owns sizing; preserve viewBox and currentColor), and emit a JS module that
exports:

    iconNames: string[]              -- curated, alphabetised
    iconMeta:  Record<name, Meta>    -- category + guidance per icon
    iconCategories: Category[]       -- grouping order for preview surfaces
    icon(name): SVGElement | null    -- factory; clones the parsed markup

The output lives in components/system/ alongside the other framework
infrastructure (runtime.js, nav-data.js, system-sidebar.js), so the
components/ top level holds only contract-conformant components.

The generator is invoked from build.py before the components/ tree is copied
into dist/, so the published bundle always reflects what's on disk.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path

from design_kit.logging import get_logger

logger = get_logger(__name__)

ICONS_DIRNAME = "icons"
SYSTEM_DIRNAME = "system"
REGISTRY_FILENAME = "icons.js"


@dataclass(frozen=True)
class IconEntry:
    name: str
    category: str
    guidance: str


# Curation order is preserved within each category so the preview page
# reads in a sensible sequence (e.g. chevron-down before chevron-up).
ICON_CATEGORIES: list[tuple[str, str]] = [
    (
        "direction",
        "Disclosure and direction. "
        "Indicate where the user is going or what will happen on activation.",
    ),
    (
        "action",
        "State-changing actions. "
        "Pair with an aria-label; never rely on the glyph alone for meaning.",
    ),
    (
        "navigation",
        "Navigation chrome. Persistent UI affordances rather than per-row controls.",
    ),
    (
        "status",
        "Status and meta. Use sparingly; one signal per meaning, never decorative.",
    ),
    (
        "content",
        "Content typing. Mark the kind of resource a row or link refers to.",
    ),
]


CURATED_ICONS: list[IconEntry] = [
    # direction
    IconEntry(
        "chevron-down",
        "direction",
        "Collapsible expand toggle (closed state); reveals content below.",
    ),
    IconEntry(
        "chevron-up",
        "direction",
        "Collapsible collapse toggle (open state); hides content above.",
    ),
    IconEntry(
        "chevron-right",
        "direction",
        "Forward disclosure on a row; nested-detail or breadcrumb separator.",
    ),
    IconEntry(
        "chevron-left",
        "direction",
        "Back disclosure; previous step in a paginated flow.",
    ),
    IconEntry(
        "arrow-right",
        "direction",
        "Continue to the next step or destination; stronger pull than chevron.",
    ),
    IconEntry(
        "arrow-left",
        "direction",
        "Return to a prior screen or context.",
    ),
    IconEntry(
        "arrow-up",
        "direction",
        "Sort ascending or jump-to-top affordance.",
    ),
    IconEntry(
        "arrow-down",
        "direction",
        "Sort descending or download-to-device affordance.",
    ),
    # action
    IconEntry(
        "check",
        "action",
        "Confirmation or selected state in a list/option group.",
    ),
    IconEntry(
        "cross-1",
        "action",
        "Close, dismiss, or remove. Default for modal/toast close buttons.",
    ),
    IconEntry(
        "plus",
        "action",
        "Add a new item to a collection or expand a card.",
    ),
    IconEntry(
        "minus",
        "action",
        "Remove an item or collapse a card. Avoid for destructive delete.",
    ),
    IconEntry(
        "pencil-1",
        "action",
        "Edit existing content in place.",
    ),
    IconEntry(
        "trash",
        "action",
        "Destructive delete. Always pair with confirmation.",
    ),
    IconEntry(
        "copy",
        "action",
        "Copy to clipboard. Show transient confirmation on click.",
    ),
    IconEntry(
        "external-link",
        "action",
        "Opens in a new tab or external context. Append to link text, never replace it.",
    ),
    # navigation
    IconEntry(
        "hamburger-menu",
        "navigation",
        "Collapsed primary nav drawer on narrow viewports.",
    ),
    IconEntry(
        "dots-horizontal",
        "navigation",
        "Toolbar overflow / 'more' menu at the chrome level.",
    ),
    IconEntry(
        "dots-vertical",
        "navigation",
        "Row-level overflow menu within a list or table.",
    ),
    IconEntry(
        "magnifying-glass",
        "navigation",
        "Search-input affordance and search-page entry point.",
    ),
    # status
    IconEntry(
        "info-circled",
        "status",
        "Neutral informational note; supplementary context.",
    ),
    IconEntry(
        "exclamation-triangle",
        "status",
        "Warning that needs attention but is not destructive.",
    ),
    IconEntry(
        "question-mark-circled",
        "status",
        "Help affordance opening definition, tooltip, or docs.",
    ),
    IconEntry(
        "bell",
        "status",
        "Notifications inbox indicator.",
    ),
    IconEntry(
        "gear",
        "status",
        "Settings or configuration entry point.",
    ),
    # content
    IconEntry(
        "file-text",
        "content",
        "Text document or article content type.",
    ),
    IconEntry(
        "code",
        "content",
        "Code block, inline code reference, or developer surface.",
    ),
    IconEntry(
        "link-1",
        "content",
        "Inline hyperlink affordance; pairs with link text.",
    ),
]


_DIM_ATTR_RE = re.compile(r'\s(?:width|height)="[^"]*"')


def normalise_svg(markup: str, *, with_class: bool = False) -> str:
    """Strip width/height attributes; CSS sizes the icon via .dk-icon.

    viewBox is preserved so the SVG scales correctly inside .dk-icon's 1em box.
    fill/stroke="currentColor" passes through untouched.

    Pass ``with_class=True`` for inlined-into-HTML uses where the SVG won't
    pass through the JS factory (which adds the class at runtime).
    """
    cleaned = _DIM_ATTR_RE.sub("", markup, count=2).strip()
    if with_class and "<svg " in cleaned:
        cleaned = cleaned.replace("<svg ", '<svg class="dk-icon" ', 1)
    return cleaned


def _normalise_svg(markup: str) -> str:
    return normalise_svg(markup)


def _categories_payload() -> list[dict[str, str]]:
    return [{"name": name, "description": desc} for name, desc in ICON_CATEGORIES]


def _meta_payload(entries: list[IconEntry]) -> dict[str, dict[str, str]]:
    return {e.name: {"category": e.category, "guidance": e.guidance} for e in entries}


def _markup_payload(icons_dir: Path, entries: list[IconEntry]) -> dict[str, str]:
    payload: dict[str, str] = {}
    for entry in entries:
        svg_path = icons_dir / f"{entry.name}.svg"
        if not svg_path.is_file():
            raise FileNotFoundError(
                f"Curated icon missing on disk: {svg_path}. "
                f"Re-vendor from radix-ui/icons or remove from CURATED_ICONS."
            )
        payload[entry.name] = _normalise_svg(svg_path.read_text(encoding="utf-8"))
    return payload


def _render_module(
    categories: list[dict[str, str]],
    meta: dict[str, dict[str, str]],
    markup: dict[str, str],
) -> str:
    names = sorted(markup.keys())
    return f"""\
// Generated by src/design_kit/icon_registry.py from components/icons/*.svg.
// Edit the generator (and the SVGs it reads), not this file.
//
// Radix Icons - MIT License, Copyright (c) 2022 WorkOS.
// See components/icons/LICENSE for the full text.

const MARKUP = {json.dumps(markup, indent=2, sort_keys=True)};

export const iconNames = {json.dumps(names, indent=2)};

export const iconMeta = {json.dumps(meta, indent=2, sort_keys=True)};

export const iconCategories = {json.dumps(categories, indent=2)};

const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;

/**
 * Build an SVGElement for a curated icon name.
 * Returns null if the name is unknown so callers can fall back to text.
 *
 * The element is decorative by default (aria-hidden="true"); callers that
 * surface meaning must set their own aria-label on the parent control.
 */
export function icon(name) {{
  const markup = MARKUP[name];
  if (!markup || !parser) return null;
  const doc = parser.parseFromString(markup, 'image/svg+xml');
  const svg = doc.documentElement;
  if (!svg || svg.nodeName !== 'svg') return null;
  svg.classList.add('dk-icon');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  return svg;
}}
"""


def generate_registry(components_dir: Path) -> Path:
    """Write components/system/icons.js based on components/icons/*.svg."""
    icons_dir = components_dir / ICONS_DIRNAME
    if not icons_dir.is_dir():
        raise FileNotFoundError(f"Icons directory not found: {icons_dir}")

    categories = _categories_payload()
    meta = _meta_payload(CURATED_ICONS)
    markup = _markup_payload(icons_dir, CURATED_ICONS)

    module = _render_module(categories, meta, markup)
    system_dir = components_dir / SYSTEM_DIRNAME
    system_dir.mkdir(parents=True, exist_ok=True)
    out_path = system_dir / REGISTRY_FILENAME
    out_path.write_text(module, encoding="utf-8")
    logger.info(f"Generated {out_path} ({len(markup)} icons)")
    return out_path
