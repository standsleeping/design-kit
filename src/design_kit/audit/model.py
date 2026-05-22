"""Uniform result model for the audit set.

Every audit — the thirteen static audits today, the headless audits later — normalizes
its native result into an :class:`AuditOutcome` so one runner can collect them and one
report can present them. The per-audit variation (which inputs it reads, how a violation
reads as a line, what the remediation says) lives in the registry rows, not here.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path


class AuditKind(Enum):
    """Execution model. STATIC needs no browser; HEADLESS renders a real page."""

    STATIC = "static"
    HEADLESS = "headless"


class AuditStatus(Enum):
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass(frozen=True)
class Finding:
    """One violation, normalized to a locator and a human detail string."""

    locator: str  # e.g. "components/app-shell.css:64" or "page foo.html"
    detail: str


@dataclass(frozen=True)
class AuditOutcome:
    """The uniform result of running one audit against a scope."""

    slug: str  # machine id, e.g. "scroll-axis"
    name: str  # human label, e.g. "Scroll axis"
    principle: str  # SP principle or doc ref enforced
    kind: AuditKind
    status: AuditStatus
    findings: tuple[Finding, ...] = ()
    # One-line "see X — fix by Y; mark exceptions with /* … */" hint, shown when failed.
    remediation: str = ""
    # Optional note for SKIPPED/degraded runs (missing dir, no browser).
    note: str = ""


@dataclass(frozen=True)
class AuditScope:
    """The inputs the audits read.

    During ``build`` this is the DK repo's own ``components/`` + ``pages/`` plus the
    preview generator. The ``audit`` command derives it from ``--scope`` so a consumer
    can run the same audits against its own tree.
    """

    components_dir: Path
    pages_dir: Path
    tokens_css: Path
    extra_files: tuple[Path, ...] = field(default_factory=tuple)

    @classmethod
    def for_repo(
        cls,
        tokens_css: Path,
        *,
        components_dir: Path = Path("components"),
        pages_dir: Path = Path("pages"),
        extra_files: tuple[Path, ...] = (Path("src/design_kit/preview.py"),),
    ) -> AuditScope:
        """DK's own tree. ``tokens_css`` is the freshly generated file during build."""
        return cls(
            components_dir=components_dir,
            pages_dir=pages_dir,
            tokens_css=tokens_css,
            extra_files=extra_files,
        )

    @classmethod
    def for_dir(cls, base: Path) -> AuditScope:
        """A consumer directory: ``base/components``, ``base/pages``, ``base/dist``.

        No ``extra_files`` — the preview generator is DK-internal; a consumer has none.
        """
        return cls(
            components_dir=base / "components",
            pages_dir=base / "pages",
            tokens_css=base / "dist" / "tokens.css",
            extra_files=(),
        )
