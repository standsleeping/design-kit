"""Run the fits-its-own-box page in headless Chromium and assert all checks pass.

The check is the ``component-fit`` spec in ``design_kit.audit.headless``, shared verbatim with
``design-kit audit --headless``; this test builds the current source into a temp dir and runs
that spec against it. The page (``pages/responsive-fit-tests.html``) renders every component
variant into a width-controlled box and asserts the box never overflows (the component fits,
reflows, or scrolls internally — never spills past its own box).

This is the generalized regression guard behind RESPONSIVE_COMPONENTS / ELASTIC_CONTENT_NEEDS_GIVE:
a component that relies on its host to constrain its width (rather than capping itself) fails here,
which is the class of bug a width-controlled storybook resize reveals by hand.

Requires ``playwright`` and an installed Chromium (``uv run playwright install chromium``).
Skips cleanly if either is missing.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from design_kit.audit.headless import FIT_SPEC, run_headless_audits
from design_kit.audit.model import AuditStatus
from design_kit.build import build

TOKENS_PATH = Path(__file__).parent.parent / "tokens" / "design-tokens.json"


def test_every_component_fits_its_own_box(tmp_path: Path) -> None:
    """No component variant overflows its width-controlled box at the test widths."""
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)
    (outcome,) = run_headless_audits(tmp_path, [FIT_SPEC])

    if outcome.status is AuditStatus.SKIPPED:
        pytest.skip(outcome.note)
    if outcome.status is AuditStatus.FAILED:
        detail = "\n".join(f"  {f.locator}: {f.detail}" for f in outcome.findings)
        pytest.fail(f"Component own-box fit checks failed:\n{detail}")
