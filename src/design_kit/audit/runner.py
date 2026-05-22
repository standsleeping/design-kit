"""Run audits over a scope and present the results in one unified report."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from design_kit.audit.model import AuditOutcome, AuditScope, AuditStatus

if TYPE_CHECKING:
    from collections.abc import Iterable, Sequence
    from logging import Logger

    from design_kit.audit.registry import LintSpec


def run_audits(
    scope: AuditScope, specs: Iterable[LintSpec]
) -> tuple[AuditOutcome, ...]:
    """Run each spec against ``scope`` and collect the uniform outcomes."""
    return tuple(spec.run(scope) for spec in specs)


def _counts(outcomes: Sequence[AuditOutcome]) -> dict[str, int]:
    return {
        "total": len(outcomes),
        "passed": sum(o.status is AuditStatus.PASSED for o in outcomes),
        "failed": sum(o.status is AuditStatus.FAILED for o in outcomes),
        "skipped": sum(o.status is AuditStatus.SKIPPED for o in outcomes),
    }


def any_failed(outcomes: Iterable[AuditOutcome]) -> bool:
    return any(o.status is AuditStatus.FAILED for o in outcomes)


_STATUS_LABEL = {
    AuditStatus.PASSED: "PASS",
    AuditStatus.FAILED: "FAIL",
    AuditStatus.SKIPPED: "SKIP",
}


def format_text_report(outcomes: Sequence[AuditOutcome]) -> str:
    """A flat, scannable report: one status line per audit, findings indented."""
    lines: list[str] = []
    for o in outcomes:
        lines.append(f"{_STATUS_LABEL[o.status]}  {o.slug:<18} ({o.principle})")
        if o.status is AuditStatus.SKIPPED and o.note:
            lines.append(f"      {o.note}")
        if o.status is AuditStatus.FAILED:
            for f in o.findings:
                lines.append(f"      {f.locator}: {f.detail}")
            if o.remediation:
                lines.append(f"      → {o.remediation}")
    c = _counts(outcomes)
    lines.append("")
    lines.append(
        f"{c['total']} audits: {c['passed']} passed, {c['failed']} failed, "
        f"{c['skipped']} skipped"
    )
    return "\n".join(lines)


def format_json_report(outcomes: Sequence[AuditOutcome], scope: AuditScope) -> str:
    payload: dict[str, object] = {
        "generated_at": datetime.now(UTC).isoformat(timespec="seconds"),
        "scope": {
            "components_dir": str(scope.components_dir),
            "pages_dir": str(scope.pages_dir),
            "tokens_css": str(scope.tokens_css),
        },
        "audits": [
            {
                "slug": o.slug,
                "name": o.name,
                "principle": o.principle,
                "kind": o.kind.value,
                "status": o.status.value,
                "findings": [
                    {"locator": f.locator, "detail": f.detail} for f in o.findings
                ],
                "remediation": o.remediation,
                "note": o.note,
            }
            for o in outcomes
        ],
        "summary": _counts(outcomes),
    }
    return json.dumps(payload, indent=2)


def raise_on_failure(outcomes: Sequence[AuditOutcome], logger: Logger) -> None:
    """Log each failed audit's findings and remediation, then raise if any failed.

    Reproduces ``build``'s per-lint logging so the build log reads as it did before the
    registry refactor: a header line, one line per violation, the remediation hint.
    """
    failed = [o for o in outcomes if o.status is AuditStatus.FAILED]
    if not failed:
        return
    for o in failed:
        logger.error(f"{o.name} lint found {len(o.findings)} violation(s)")
        for f in o.findings:
            logger.error(f"  {f.locator}: {f.detail}")
        if o.remediation:
            logger.error(f"  {o.remediation}")
    slugs = ", ".join(o.slug for o in failed)
    raise RuntimeError(f"audit failed: {slugs}")
