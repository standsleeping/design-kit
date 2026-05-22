"""Run the ResponsiveTable behavior page in headless Chromium and assert all checks pass.

The check is the ``responsive-table`` spec in ``design_kit.audit.headless``, shared verbatim
with ``design-kit audit --headless``; this test builds the current source into a temp dir and
runs that spec against it. The behavior page (``pages/responsive-table-tests.html``) mounts the
component in wide / narrow / medium modes, exercises the sidenote overlay, presence dots, row
clickability, and the body contract, and writes its verdict into ``document.body.dataset``,
which the spec reads back.

Requires ``playwright`` and an installed Chromium (``uv run playwright install chromium``).
Skips cleanly if either is missing.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from design_kit.audit.headless import RESPONSIVE_TABLE_SPEC, run_headless_audits
from design_kit.audit.model import AuditStatus
from design_kit.build import build

TOKENS_PATH = Path(__file__).parent.parent / "tokens" / "design-tokens.json"


def test_responsive_table_behavior_page_passes(tmp_path: Path) -> None:
    """All checks on the ResponsiveTable behavior page pass in headless Chromium."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)
    (outcome,) = run_headless_audits(tmp_path, [RESPONSIVE_TABLE_SPEC])

    if outcome.status is AuditStatus.SKIPPED:
        pytest.skip(outcome.note)
    if outcome.status is AuditStatus.FAILED:
        detail = "\n".join(f"  {f.locator}: {f.detail}" for f in outcome.findings)
        pytest.fail(f"ResponsiveTable behavior checks failed:\n{detail}")
