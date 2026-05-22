"""Unified audit set: one registry, one runner, one report.

The registry (:mod:`design_kit.audit.registry`) is the canonical list of every audit.
``build`` and the ``audit`` command both run audits from it, so the set is defined once.
"""

from design_kit.audit.command import audit, resolve_scope
from design_kit.audit.headless import (
    HEADLESS_REGISTRY,
    HeadlessContext,
    HeadlessSpec,
    headless_specs,
    run_headless_audits,
)
from design_kit.audit.model import (
    AuditKind,
    AuditOutcome,
    AuditScope,
    AuditStatus,
    Finding,
)
from design_kit.audit.registry import REGISTRY, LintSpec, spec_by_slug, static_specs
from design_kit.audit.runner import (
    any_failed,
    format_json_report,
    format_text_report,
    raise_on_failure,
    run_audits,
)

__all__ = [
    "HEADLESS_REGISTRY",
    "REGISTRY",
    "AuditKind",
    "AuditOutcome",
    "AuditScope",
    "AuditStatus",
    "Finding",
    "HeadlessContext",
    "HeadlessSpec",
    "LintSpec",
    "any_failed",
    "audit",
    "format_json_report",
    "format_text_report",
    "headless_specs",
    "raise_on_failure",
    "resolve_scope",
    "run_audits",
    "run_headless_audits",
    "spec_by_slug",
    "static_specs",
]
