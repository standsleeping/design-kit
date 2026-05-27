"""The unified audit set: registry, runner, report, and the `audit` command.

These cover the Phase 2 plumbing: that the registry is the single source of the audit
set, that a scope runs every audit into one uniform result, and that the command returns
the right exit code, not the lint logic itself (each lint has its own test module).
"""

from __future__ import annotations

import json
from pathlib import Path

from design_kit.audit import (
    AuditScope,
    AuditStatus,
    any_failed,
    audit,
    format_json_report,
    format_text_report,
    resolve_scope,
    run_audits,
    static_specs,
)
from design_kit.audit.registry import REGISTRY

# The audit set, named once. A slug appearing or vanishing here is the drift signal the
# registry exists to prevent; build and the audit command both run exactly this set.
EXPECTED_SLUGS = {
    "contrast",
    "token-leak",
    "focus-ring",
    "interactive-state",
    "peer-edge",
    "scrollbar-hidden",
    "scroll-axis",
    "padding",
    "radius",
    "margin",
    "border-width",
    "dimension",
    "page",
}


def _scope(tmp_path: Path, css: str = "") -> AuditScope:
    """A consumer-shaped scope with one component CSS file and an empty pages dir."""
    (tmp_path / "components").mkdir()
    (tmp_path / "pages").mkdir()
    if css:
        (tmp_path / "components" / "x.css").write_text(css, encoding="utf-8")
    return AuditScope.for_dir(tmp_path)


def test_registry_lists_exactly_the_expected_audits() -> None:
    assert {spec.slug for spec in REGISTRY} == EXPECTED_SLUGS


def test_registry_slugs_are_unique() -> None:
    slugs = [spec.slug for spec in REGISTRY]
    assert len(slugs) == len(set(slugs))


def test_build_excluded_slugs_are_registered() -> None:
    """build runs its own contrast and page blocks; both must still be in the registry."""
    registered = {spec.slug for spec in REGISTRY}
    assert {"contrast", "page"} <= registered


def test_clean_scope_passes_every_static_audit(tmp_path: Path) -> None:
    scope = _scope(tmp_path, ".a {\n  color: var(--color-text);\n}\n")
    outcomes = run_audits(scope, static_specs())
    assert not any_failed(outcomes)
    # Contrast is the only SKIP (no built tokens.css under the scope); the rest pass.
    statuses = {o.slug: o.status for o in outcomes}
    assert statuses["contrast"] is AuditStatus.SKIPPED
    assert statuses["token-leak"] is AuditStatus.PASSED


def test_raw_color_literal_fails_the_token_leak_audit(tmp_path: Path) -> None:
    scope = _scope(tmp_path, ".a {\n  color: #ff0000;\n}\n")
    outcomes = run_audits(scope, static_specs())
    assert any_failed(outcomes)
    leak = next(o for o in outcomes if o.slug == "token-leak")
    assert leak.status is AuditStatus.FAILED
    assert leak.findings
    assert "#ff0000" in leak.findings[0].detail
    # A failure carries its remediation so the report can show how to fix it.
    assert "TOKEN_DRIVEN_DESIGN" in leak.remediation


def test_missing_directories_skip_rather_than_pass(tmp_path: Path) -> None:
    outcomes = run_audits(AuditScope.for_dir(tmp_path), static_specs())
    assert all(o.status is AuditStatus.SKIPPED for o in outcomes)
    assert not any_failed(outcomes)


def test_json_report_is_valid_and_counted(tmp_path: Path) -> None:
    scope = _scope(tmp_path, ".a {\n  color: #ff0000;\n}\n")
    outcomes = run_audits(scope, static_specs())
    payload = json.loads(format_json_report(outcomes, scope))
    assert {a["slug"] for a in payload["audits"]} == EXPECTED_SLUGS
    summary = payload["summary"]
    assert summary["total"] == len(EXPECTED_SLUGS)
    assert summary["failed"] >= 1
    assert (
        summary["total"] == summary["passed"] + summary["failed"] + summary["skipped"]
    )


def test_json_report_records_generated_at_and_the_resolved_scope(
    tmp_path: Path,
) -> None:
    scope = _scope(tmp_path, ".a {\n  color: var(--color-text);\n}\n")
    outcomes = run_audits(scope, static_specs())
    payload = json.loads(format_json_report(outcomes, scope))
    assert "generated_at" in payload
    assert payload["scope"]["components_dir"] == str(scope.components_dir)
    assert payload["scope"]["pages_dir"] == str(scope.pages_dir)
    assert payload["scope"]["tokens_css"] == str(scope.tokens_css)


def test_text_report_marks_failures(tmp_path: Path) -> None:
    scope = _scope(tmp_path, ".a {\n  color: #ff0000;\n}\n")
    report = format_text_report(run_audits(scope, static_specs()))
    assert "FAIL  token-leak" in report
    assert "audits:" in report


def test_audit_command_exits_zero_on_clean_scope(tmp_path: Path) -> None:
    _scope(tmp_path, ".a {\n  color: var(--color-text);\n}\n")
    assert audit(scope_dir=tmp_path, as_json=False) == 0


def test_audit_command_exits_nonzero_on_violation(tmp_path: Path) -> None:
    _scope(tmp_path, ".a {\n  color: #ff0000;\n}\n")
    assert audit(scope_dir=tmp_path, as_json=True) == 1


# --- scope resolution (slice 2c): a consumer rarely mirrors DK's components/pages layout ---


def test_resolve_scope_bare_reads_the_repo() -> None:
    """No flags resolves to design-kit's own components/, pages/, dist/tokens.css."""
    scope = resolve_scope(
        scope_dir=None, components_dir=None, pages_dir=None, tokens_css=None
    )
    assert scope.components_dir.name == "components"
    assert scope.pages_dir.name == "pages"


def test_resolve_scope_dir_derives_the_three_subpaths() -> None:
    """--scope DIR derives DIR/components, DIR/pages, DIR/dist/tokens.css."""
    base = Path("/somewhere/app")
    scope = resolve_scope(
        scope_dir=base, components_dir=None, pages_dir=None, tokens_css=None
    )
    assert scope.components_dir == base / "components"
    assert scope.pages_dir == base / "pages"
    assert scope.tokens_css == base / "dist" / "tokens.css"


def test_resolve_scope_explicit_override_wins_per_input() -> None:
    """An explicit --components-dir wins; an unspecified input still falls back to --scope."""
    base = Path("/somewhere/app")
    css = Path("/elsewhere/styles")
    scope = resolve_scope(
        scope_dir=base, components_dir=css, pages_dir=None, tokens_css=None
    )
    assert scope.components_dir == css  # override wins
    assert scope.pages_dir == base / "pages"  # falls back to --scope
    # A consumer-shaped scope drops DK's internal preview-generator extra file.
    assert scope.extra_files == ()


def test_audit_lints_css_outside_a_components_dir(tmp_path: Path) -> None:
    """The real 2c shape: CSS lives at an arbitrary path, not under <root>/components."""
    styles = tmp_path / "styles"
    styles.mkdir()
    (styles / "app.css").write_text(".a {\n  color: #ff0000;\n}\n", encoding="utf-8")
    missing_pages = tmp_path / "no-pages"
    missing_tokens = tmp_path / "no-tokens.css"

    code = audit(
        scope_dir=None,
        as_json=False,
        components_dir=styles,
        pages_dir=missing_pages,
        tokens_css=missing_tokens,
    )
    assert code == 1  # the raw color literal in styles/app.css is caught

    (styles / "app.css").write_text(
        ".a {\n  color: var(--color-text);\n}\n", encoding="utf-8"
    )
    clean = audit(
        scope_dir=None,
        as_json=False,
        components_dir=styles,
        pages_dir=missing_pages,
        tokens_css=missing_tokens,
    )
    assert clean == 0  # pages and contrast SKIP (absent); the CSS lint passes
