"""Browser-free tests for the headless audit infrastructure.

The rendered-page checks themselves need Chromium (see test_overflow_audit.py and
test_responsive_table_behavior.py). These cover the parts that do not: the registry shape and
the skip paths that let a token-only run complete cleanly without a browser.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from design_kit.audit.headless import (
    HEADLESS_REGISTRY,
    RESPONSIVE_TABLE_SPEC,
    HeadlessContext,
    headless_specs,
    run_headless_audits,
)
from design_kit.audit.model import AuditKind, AuditStatus

if TYPE_CHECKING:
    from pathlib import Path


def test_headless_registry_specs_are_headless_with_unique_slugs() -> None:
    """Every registered headless spec is HEADLESS-kind, and slugs do not collide."""
    specs = headless_specs()
    assert specs == HEADLESS_REGISTRY
    assert specs, "the headless registry must not be empty"
    slugs = [s.slug for s in specs]
    assert len(slugs) == len(set(slugs)), f"duplicate headless slugs: {slugs}"


def test_missing_site_dir_skips_every_spec(tmp_path: Path) -> None:
    """A missing site directory yields one SKIPPED outcome per spec, not a false pass."""
    missing = tmp_path / "does-not-exist"
    outcomes = run_headless_audits(missing, headless_specs())

    assert len(outcomes) == len(headless_specs())
    assert all(o.status is AuditStatus.SKIPPED for o in outcomes)
    assert all(o.kind is AuditKind.HEADLESS for o in outcomes)
    assert all("not found" in o.note for o in outcomes)


def test_empty_site_dir_skips_every_spec(tmp_path: Path) -> None:
    """A site directory with no HTML pages skips rather than vacuously passing."""
    outcomes = run_headless_audits(tmp_path, headless_specs())

    assert len(outcomes) == len(headless_specs())
    assert all(o.status is AuditStatus.SKIPPED for o in outcomes)
    assert all("no HTML pages" in o.note for o in outcomes)


def test_responsive_table_skips_when_its_page_is_absent() -> None:
    """The behavior-page spec skips (consumer portability) when its page is not served."""
    ctx = HeadlessContext(base_url="http://localhost", page_names=(), browser=None)
    outcome = RESPONSIVE_TABLE_SPEC.run(ctx)

    assert outcome.status is AuditStatus.SKIPPED
    assert outcome.slug == "responsive-table"
    assert "responsive-table-tests.html" in outcome.note
