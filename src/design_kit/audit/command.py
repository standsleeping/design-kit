"""The ``design-kit audit`` command: run the audit set, print one report, set exit code."""

from __future__ import annotations

from pathlib import Path

from design_kit.audit.headless import headless_specs, run_headless_audits
from design_kit.audit.model import AuditOutcome, AuditScope
from design_kit.audit.registry import static_specs
from design_kit.audit.runner import (
    any_failed,
    format_json_report,
    format_text_report,
    run_audits,
)


def resolve_scope(
    *,
    scope_dir: Path | None,
    components_dir: Path | None,
    pages_dir: Path | None,
    tokens_css: Path | None,
) -> AuditScope:
    """Resolve the three audit inputs from the CLI flags, precedence in one place.

    Per input the order is: an explicit ``--components-dir`` / ``--pages-dir`` /
    ``--tokens-css`` wins; else ``--scope DIR`` derives ``DIR/components``, ``DIR/pages``,
    ``DIR/dist/tokens.css``; else design-kit's own ``components/``, ``pages/``,
    ``dist/tokens.css``. A real consumer rarely mirrors DK's layout (one may keep a
    single flat CSS file; another may nest its component CSS under a static dir), so
    the per-input overrides are what let any tree be
    audited. Each directory is globbed one level deep (``*.css`` / ``*.html``), matching DK's
    own flat component layout.
    """
    no_override = components_dir is None and pages_dir is None and tokens_css is None
    if no_override:
        if scope_dir is not None:
            return AuditScope.for_dir(scope_dir)
        return AuditScope.for_repo(Path("dist") / "tokens.css")

    if scope_dir is not None:
        d_components = scope_dir / "components"
        d_pages = scope_dir / "pages"
        d_tokens = scope_dir / "dist" / "tokens.css"
    else:
        d_components = Path("components")
        d_pages = Path("pages")
        d_tokens = Path("dist") / "tokens.css"
    # An explicit override means a consumer-shaped tree; the preview generator in
    # for_repo's extra_files is DK-internal, so it is dropped here.
    return AuditScope(
        components_dir=components_dir or d_components,
        pages_dir=pages_dir or d_pages,
        tokens_css=tokens_css or d_tokens,
        extra_files=(),
    )


def audit(
    scope_dir: Path | None,
    as_json: bool,
    headless: bool = False,
    *,
    components_dir: Path | None = None,
    pages_dir: Path | None = None,
    tokens_css: Path | None = None,
) -> int:
    """Run the audit set against the resolved scope and report.

    ``scope_dir`` plus the ``components_dir`` / ``pages_dir`` / ``tokens_css`` overrides
    select what gets audited (see :func:`resolve_scope`); without any of them the audits read
    DK's own tree. Returns a non-zero exit code iff any audit failed. Contrast reads a built
    ``tokens.css`` and reports SKIPPED when it is absent.

    With ``headless`` the rendered-page audits also run against the built site: ``DIR`` under
    a scope, otherwise ``dist/`` (the static override flags do not retarget the served site).
    They report SKIPPED (not failure) when the site, Playwright, or Chromium is absent, so a
    token-only run still completes.
    """
    scope = resolve_scope(
        scope_dir=scope_dir,
        components_dir=components_dir,
        pages_dir=pages_dir,
        tokens_css=tokens_css,
    )

    outcomes: list[AuditOutcome] = list(run_audits(scope, static_specs()))

    if headless:
        site_dir = scope_dir if scope_dir is not None else Path("dist")
        outcomes.extend(run_headless_audits(site_dir, headless_specs()))

    report = (
        format_json_report(outcomes, scope) if as_json else format_text_report(outcomes)
    )
    print(report)
    return 1 if any_failed(outcomes) else 0
