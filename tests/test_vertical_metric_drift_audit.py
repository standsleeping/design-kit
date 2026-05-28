"""Headless audit teeth: VERTICAL_METRIC_DRIFT.

Two tests give the spec teeth:

- a *positive* test that the built site is drift-free, so a regression on any chrome
  rail fails CI (a `<span>` newly mixed with a `<button>` peer, a future component
  that mounts into a wrapper placeholder without `display: contents`, a stylesheet
  that drops `text-box-trim` from a uppercase chrome label); and
- a *detector* test that wires a fixture page with deliberate drift into the same
  build temp dir, runs the spec, and asserts the fixture's rows are flagged. If a
  later refactor tightens the audit's filters too far, the detector goes dead
  silently — this test catches that.

The fixture lives under ``tests/fixtures/`` (not ``pages/``), so it is only seen by
this test's audit run, never by ``design-kit audit --headless`` or the build's
audit pass.

Both tests need ``playwright`` and an installed Chromium
(``uv run playwright install chromium``); they skip cleanly when either is missing.
"""

from __future__ import annotations

import shutil
from pathlib import Path

import pytest

from design_kit.audit.headless import (
    VERTICAL_METRIC_DRIFT_SPEC,
    run_headless_audits,
)
from design_kit.audit.model import AuditStatus
from design_kit.build import build

_REPO = Path(__file__).parent.parent
TOKENS_PATH = _REPO / "tokens" / "design-tokens.json"
FIXTURE = Path(__file__).parent / "fixtures" / "vmd_drift_fixture.html"


def test_built_site_is_drift_free(tmp_path: Path) -> None:
    """Every built page passes the vertical-metric-drift gate.

    A failure here is a regression on any chrome rail: visible glyphs that drift
    inside boxes the box-level audits consider correctly sized.
    """
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)
    (outcome,) = run_headless_audits(tmp_path, [VERTICAL_METRIC_DRIFT_SPEC])

    if outcome.status is AuditStatus.SKIPPED:
        pytest.skip(outcome.note)
    if outcome.status is AuditStatus.FAILED:
        detail = "\n".join(f"  {f.locator}: {f.detail}" for f in outcome.findings)
        pytest.fail("vertical metric drift detected:\n" + detail)


def test_audit_detects_drift_in_fixture(tmp_path: Path) -> None:
    """The audit flags a fixture page that deliberately exhibits drift.

    Detector liveness: a passing audit on the built site is only reassuring if
    the audit *would* catch drift when it appears. The fixture demonstrates two
    drift cases (padding skew between two spans; line-height drift between a
    span and a button); the audit must produce at least one finding referencing
    the fixture page.
    """
    build(tokens_path=TOKENS_PATH, output_dir=tmp_path)
    shutil.copy(FIXTURE, tmp_path / FIXTURE.name)
    (outcome,) = run_headless_audits(tmp_path, [VERTICAL_METRIC_DRIFT_SPEC])

    if outcome.status is AuditStatus.SKIPPED:
        pytest.skip(outcome.note)
    fixture_findings = [f for f in outcome.findings if FIXTURE.name in f.locator]
    assert fixture_findings, (
        f"audit produced zero findings on {FIXTURE.name}; the spec's filters "
        "may have grown too strict and stopped detecting real drift. "
        f"All findings this run: {[f.locator for f in outcome.findings]}"
    )
