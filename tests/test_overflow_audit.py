"""Headless audit: no design-kit page may scroll horizontally.

Runtime arm of SCROLL_CONTAINMENT (the static arm is scroll_axis_lint). The check
itself is the ``overflow`` spec in ``design_kit.audit.headless``, shared verbatim with
``design-kit audit --headless``; this test builds the current source into a temp dir and
runs that spec against it, so CI and the CLI cannot drift.

The spec loads every built page in headless Chromium at several widths and flags four
things, because each hides from the ones above it: page-level horizontal scroll, a center
container (``.dk-app-shell-main``) whose ``scrollWidth`` exceeds its ``clientWidth`` even
though it clips x, any element that is a real horizontal scroller (minus ``data-allow-x-scroll``
leaf scrollers), and a fixed chrome rail (``.dk-topbar``) that has wrapped to a second row
(``data-wrap-ok`` opts an intentional wrapping strip out).

Requires ``playwright`` and an installed Chromium (``uv run playwright install chromium``).
Skips cleanly if either is missing.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from design_kit.audit.headless import OVERFLOW_SPEC, run_headless_audits
from design_kit.audit.model import AuditStatus
from design_kit.build import build

TOKENS_PATH = Path(__file__).parent.parent / "tokens" / "design-tokens.json"


def test_no_page_scrolls_horizontally(tmp_path: Path) -> None:
    """No built page scrolls horizontally — page-level or in the center container."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)
    (outcome,) = run_headless_audits(tmp_path, [OVERFLOW_SPEC])

    if outcome.status is AuditStatus.SKIPPED:
        pytest.skip(outcome.note)
    if outcome.status is AuditStatus.FAILED:
        detail = "\n".join(f"  {f.locator}: {f.detail}" for f in outcome.findings)
        pytest.fail(
            "Horizontal overflow detected — pages must not scroll horizontally "
            "(NO_PAGE_SCROLL; the center container must not grow an internal "
            "horizontal scrollbar):\n" + detail
        )
