"""Run the adaptive-components behavior page in headless Chromium and assert all checks pass.

The check is the ``adaptive-behavior`` spec in ``design_kit.audit.headless``, shared verbatim
with ``design-kit audit --headless``; this test builds the current source into a temp dir and
runs that spec against it. The behavior page (``pages/responsive-adaptive-tests.html``) mounts
SessionStatsFooter, Breadcrumb, and AdaptiveMetricsList at controlled wide/narrow widths and
asserts each adapts on mount (priority-drop, middle-collapse, column-hide), writing its verdict
into ``document.body.dataset``, which the spec reads back.

This is the regression guard for the ResizeObserver enhancers: a self-wired observer that fails
to adapt after attach (the class of bug that passes every static lint) fails here.

Requires ``playwright`` and an installed Chromium (``uv run playwright install chromium``).
Skips cleanly if either is missing.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from design_kit.audit.headless import ADAPTIVE_BEHAVIOR_SPEC, run_headless_audits
from design_kit.audit.model import AuditStatus
from design_kit.build import build

TOKENS_PATH = Path(__file__).parent.parent / "tokens" / "design-tokens.json"


def test_adaptive_behavior_page_passes(tmp_path: Path) -> None:
    """All checks on the adaptive-components behavior page pass in headless Chromium."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)
    (outcome,) = run_headless_audits(tmp_path, [ADAPTIVE_BEHAVIOR_SPEC])

    if outcome.status is AuditStatus.SKIPPED:
        pytest.skip(outcome.note)
    if outcome.status is AuditStatus.FAILED:
        detail = "\n".join(f"  {f.locator}: {f.detail}" for f in outcome.findings)
        pytest.fail(f"Adaptive behavior checks failed:\n{detail}")
