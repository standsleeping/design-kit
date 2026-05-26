"""Headless audit teeth: the self-hosted font makes load-time CLS shift-free.

The CLS gate is the ``first-paint`` spec in ``design_kit.audit.headless``, shared
verbatim with ``design-kit audit --headless``. Two kinds of test give it teeth:

- browser-free guards that no page exempts itself from CLS for font-swap reasons.
  Font swap was the one excuse for the session-stats exemption; the self-hosted,
  metric-matched font (token_css.FONT_FACE) removed the shift, so any font-worded
  exemption is a regression that would silence the gate; and
- a rendered check that builds the current source and runs the spec, so an actual
  FOUC or load-time shift on any page (session-stats now un-exempted) fails CI.

The rendered check needs ``playwright`` and an installed Chromium
(``uv run playwright install chromium``); it skips cleanly when either is missing.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

from design_kit.audit.headless import FIRST_PAINT_SPEC, run_headless_audits
from design_kit.audit.model import AuditStatus
from design_kit.build import build

_REPO = Path(__file__).parent.parent
_PAGES = _REPO / "pages"
TOKENS_PATH = _REPO / "tokens" / "design-tokens.json"

_EXEMPT_RE = re.compile(r'data-cls-exempt="([^"]*)"')
_FONT_TERMS = ("font", "fout", "foit", "swap")


def test_no_page_exempts_cls_for_font_swap() -> None:
    """No page exempts itself from the CLS gate for font-swap reasons.

    Font swap was the one excuse for a user surface to opt out; the self-hosted,
    metric-matched font removed the shift, so a font-worded exemption is a regression
    of that fix that would silence the gate."""
    offenders: list[str] = []
    for page in sorted(_PAGES.glob("*.html")):
        for reason in _EXEMPT_RE.findall(page.read_text(encoding="utf-8")):
            if any(term in reason.lower() for term in _FONT_TERMS):
                offenders.append(f"{page.name}: data-cls-exempt={reason!r}")
    assert not offenders, "font-swap CLS exemptions must not exist:\n" + "\n".join(
        offenders
    )


def test_session_stats_is_not_cls_exempt() -> None:
    """session-stats.html is a user surface, not a results-injecting harness; with the
    font swap shift-free it carries no CLS exemption and is held to the gate."""
    html = (_PAGES / "session-stats.html").read_text(encoding="utf-8")
    assert "data-cls-exempt" not in html


def test_load_trajectory_has_no_shift(tmp_path: Path) -> None:
    """Every built page passes the first-paint + CLS gate: no FOUC and no load-time
    shift, with session-stats un-exempted. Empirical teeth on the tightened bound."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)
    (outcome,) = run_headless_audits(tmp_path, [FIRST_PAINT_SPEC])

    if outcome.status is AuditStatus.SKIPPED:
        pytest.skip(outcome.note)
    if outcome.status is AuditStatus.FAILED:
        detail = "\n".join(f"  {f.locator}: {f.detail}" for f in outcome.findings)
        pytest.fail("Load-trajectory regression (FOUC or layout shift):\n" + detail)
