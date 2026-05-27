"""The audit registry: one inspectable list of every audit.

Each row wraps an existing ``run_*_lint`` and declares how to read its violations as
uniform :class:`Finding`s. ``build`` and the ``audit`` command both iterate this list, so
the set of audits is defined once and cannot drift. Adding an audit is one row here, not an
edit to the build orchestrator (HOIST_DECISIONS, PUSH_VARIATION_INTO_DATA).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, TypeVar

from design_kit.audit.model import (
    AuditKind,
    AuditOutcome,
    AuditScope,
    AuditStatus,
    Finding,
)
from design_kit.border_width_lint import run_border_width_lint
from design_kit.contrast_self_test import run as run_contrast_lint
from design_kit.dimension_lint import run_dimension_lint
from design_kit.focus_ring_lint import run_focus_ring_lint
from design_kit.interactive_state_lint import run_interactive_state_lint
from design_kit.margin_lint import run_margin_lint
from design_kit.padding_lint import run_padding_lint
from design_kit.page_lint import run_page_lint
from design_kit.peer_edge_lint import run_peer_edge_lint
from design_kit.radius_lint import run_radius_lint
from design_kit.scroll_axis_lint import run_scroll_axis_lint
from design_kit.scrollbar_hidden_lint import run_scrollbar_hidden_lint
from design_kit.token_leak_lint import run_token_leak_lint

if TYPE_CHECKING:
    from collections.abc import Callable, Iterable
    from pathlib import Path


@dataclass(frozen=True)
class LintSpec:
    """One static audit (a source lint or the contrast check) runnable against any :class:`AuditScope`."""

    slug: str
    name: str
    principle: str
    kind: AuditKind
    run: Callable[[AuditScope], AuditOutcome]


_R = TypeVar("_R")


def _static_spec(
    *,
    slug: str,
    name: str,
    principle: str,
    primary: Callable[[AuditScope], Path],
    runner: Callable[[AuditScope], _R],
    to_findings: Callable[[_R], Iterable[Finding]],
    remediation: str,
) -> LintSpec:
    """Build a static-lint spec from its ``run_*_lint`` and a violation→Finding mapper.

    ``primary`` names the path the lint reads first; when it is absent the audit reports
    SKIPPED (a consumer scope missing ``components/``) rather than a misleading PASS.
    Status is derived from the findings: a lint fails iff it has violations.
    """

    def run(scope: AuditScope) -> AuditOutcome:
        target = primary(scope)
        if not target.exists():
            return AuditOutcome(
                slug=slug,
                name=name,
                principle=principle,
                kind=AuditKind.STATIC,
                status=AuditStatus.SKIPPED,
                remediation=remediation,
                note=f"{target} not found",
            )
        findings = tuple(to_findings(runner(scope)))
        status = AuditStatus.FAILED if findings else AuditStatus.PASSED
        return AuditOutcome(
            slug=slug,
            name=name,
            principle=principle,
            kind=AuditKind.STATIC,
            status=status,
            findings=findings,
            remediation=remediation,
        )

    return LintSpec(
        slug=slug, name=name, principle=principle, kind=AuditKind.STATIC, run=run
    )


# --- contrast: the one spec that reads generated tokens.css, not a source dir ---

_CONTRAST_REMEDIATION = (
    "see TOKEN_PAIR_CONTRAST: a foreground/background pair must clear its WCAG floor "
    "in every theme; a failure is two tokens collapsing to one primitive or the wrong "
    "token chosen for an adjacency."
)


def _run_contrast(scope: AuditScope) -> AuditOutcome:
    if not scope.tokens_css.exists():
        return AuditOutcome(
            slug="contrast",
            name="Token-pair contrast",
            principle="TOKEN_PAIR_CONTRAST",
            kind=AuditKind.STATIC,
            status=AuditStatus.SKIPPED,
            remediation=_CONTRAST_REMEDIATION,
            note=f"{scope.tokens_css} not found; run design-kit build first",
        )
    results, _ = run_contrast_lint(scope.tokens_css)
    findings = tuple(
        Finding(
            locator=f"--{r.pair.a} x --{r.pair.b} ({r.theme})",
            detail=f"{r.ratio:.2f} < {r.pair.min_ratio}: {r.pair.reason}",
        )
        for r in results
        if not r.passed
    )
    status = AuditStatus.FAILED if findings else AuditStatus.PASSED
    return AuditOutcome(
        slug="contrast",
        name="Token-pair contrast",
        principle="TOKEN_PAIR_CONTRAST",
        kind=AuditKind.STATIC,
        status=status,
        findings=findings,
        remediation=_CONTRAST_REMEDIATION,
    )


_CONTRAST_SPEC = LintSpec(
    slug="contrast",
    name="Token-pair contrast",
    principle="TOKEN_PAIR_CONTRAST",
    kind=AuditKind.STATIC,
    run=_run_contrast,
)


# --- the twelve source-scanning lints, as registry rows ---

REGISTRY: tuple[LintSpec, ...] = (
    _CONTRAST_SPEC,
    _static_spec(
        slug="token-leak",
        name="Token leak",
        principle="TOKEN_DRIVEN_DESIGN",
        primary=lambda s: s.components_dir,
        runner=lambda s: run_token_leak_lint(
            s.components_dir, pages_dir=s.pages_dir, extra_files=list(s.extra_files)
        ),
        to_findings=lambda r: (
            Finding(f"{lk.file}:{lk.line}", f"{lk.value}: {lk.snippet}")
            for lk in r.leaks
        ),
        remediation=(
            "see TOKEN_DRIVEN_DESIGN: every surface consumes colors via var(--color-*). "
            "Mark documented exceptions with /* token-leak: ok */"
        ),
    ),
    _static_spec(
        slug="focus-ring",
        name="Focus ring",
        principle="INSET_FOCUS_RING",
        primary=lambda s: s.components_dir,
        runner=lambda s: run_focus_ring_lint(s.components_dir),
        to_findings=lambda r: (
            Finding(f"{v.file}:{v.line}", f"{v.selector}: {v.snippet}")
            for v in r.violations
        ),
        remediation=(
            "see INSET_FOCUS_RING: use negative outline-offset, or "
            "mark genuinely standalone controls with /* focus-ring: standalone */"
        ),
    ),
    _static_spec(
        slug="interactive-state",
        name="Interactive state",
        principle="STATE_BELONGS_TO_INTERACTIVE",
        primary=lambda s: s.components_dir,
        runner=lambda s: run_interactive_state_lint(s.components_dir),
        to_findings=lambda r: (
            Finding(f"{v.file}:{v.line}", f"{v.selector}: {v.snippet}")
            for v in r.violations
        ),
        remediation=(
            "see STATE_BELONGS_TO_INTERACTIVE: pair the rule with a :focus-visible "
            "declaration on the same base, target a natively focusable element, or mark "
            "drag-only handles with /* state-lint: ok */"
        ),
    ),
    _static_spec(
        slug="peer-edge",
        name="Peer edge",
        principle="PEER_EDGE_RESERVATION",
        primary=lambda s: s.components_dir,
        runner=lambda s: run_peer_edge_lint(s.components_dir),
        to_findings=lambda r: (
            Finding(
                f"{v.file}:{v.line}", f"{v.selector} → {v.declaration}: {v.snippet}"
            )
            for v in r.violations
        ),
        remediation=(
            "see PEER_EDGE_RESERVATION: the rest state must declare the same "
            "border-(side) with solid transparent so the modifier recolours a reserved "
            "channel. Mark documented exceptions with /* peer-edge: ok */"
        ),
    ),
    _static_spec(
        slug="scrollbar-hidden",
        name="Scrollbar hidden",
        principle="SCROLLBAR_HIDDEN_BY_DEFAULT",
        primary=lambda s: s.components_dir,
        runner=lambda s: run_scrollbar_hidden_lint(s.components_dir),
        to_findings=lambda r: (
            Finding(
                f"{v.file}:{v.line}", f"{v.selector} → {v.kind.value}: {v.snippet}"
            )
            for v in r.violations
        ),
        remediation=(
            "see SCROLLBAR_HIDDEN_BY_DEFAULT: every scroll container hides its "
            "bar with scrollbar-width: none plus ::-webkit-scrollbar { display: none }. "
            "Use overflow-(x|y): auto, never scroll. Do not set scrollbar-gutter, "
            "scrollbar-color, or scrollbar-width to anything other than none. "
            "Mark documented exceptions with /* scrollbar: ok */"
        ),
    ),
    _static_spec(
        slug="scroll-axis",
        name="Scroll axis",
        principle="SCROLL_CONTAINMENT",
        primary=lambda s: s.components_dir,
        runner=lambda s: run_scroll_axis_lint(s.components_dir),
        to_findings=lambda r: (
            Finding(
                f"{v.file}:{v.line}",
                f"{v.selector} → overflow: {v.value}: {v.snippet}",
            )
            for v in r.violations
        ),
        remediation=(
            "see SCROLL_CONTAINMENT: a scroll container scrolls exactly one axis, "
            "declared explicitly (overflow-y: auto). Mark a genuine two-axis scroller "
            "with /* scroll-axis: ok */"
        ),
    ),
    _static_spec(
        slug="padding",
        name="Padding",
        principle="PADDING_IS_INSET_ONLY",
        primary=lambda s: s.components_dir,
        runner=lambda s: run_padding_lint(s.components_dir),
        to_findings=lambda r: (
            Finding(
                f"{v.file}:{v.line}",
                f"{v.selector}: {v.snippet}  [{', '.join(k.value for k in v.kinds)}]",
            )
            for v in r.violations
        ),
        remediation=(
            "see PADDING_IS_INSET_ONLY: padding is square; horizontal/vertical asymmetry "
            "lives in min-width/gap. Mark documented exceptions with /* padding-lint: ok */"
        ),
    ),
    _static_spec(
        slug="radius",
        name="Radius",
        principle="square-corners",
        primary=lambda s: s.components_dir,
        runner=lambda s: run_radius_lint(s.components_dir),
        to_findings=lambda r: (
            Finding(f"{v.file}:{v.line}", f"{v.snippet}  [value: {v.value}]")
            for v in r.violations
        ),
        remediation=(
            "the visual language is square-cornered. Remove the declaration (zero is the "
            "default), or mark genuine circles with /* radius-lint: ok */"
        ),
    ),
    _static_spec(
        slug="margin",
        name="Margin",
        principle="NEVER_MARGIN",
        primary=lambda s: s.components_dir,
        runner=lambda s: run_margin_lint(
            s.components_dir, pages_dir=s.pages_dir, extra_files=list(s.extra_files)
        ),
        to_findings=lambda r: (
            Finding(f"{v.file}:{v.line}", f"{v.declaration}: {v.value}: {v.snippet}")
            for v in r.violations
        ),
        remediation=(
            "see NEVER_MARGIN: rhythm lives in the parent's gap. Permitted: margin: 0 "
            "and margin-(side): auto. Mark documented exceptions with /* margin-lint: ok */"
        ),
    ),
    _static_spec(
        slug="border-width",
        name="Border width",
        principle="TOKEN_DRIVEN_DESIGN",
        primary=lambda s: s.components_dir,
        runner=lambda s: run_border_width_lint(
            s.components_dir, pages_dir=s.pages_dir, extra_files=list(s.extra_files)
        ),
        to_findings=lambda r: (
            Finding(f"{v.file}:{v.line}", f"{v.declaration} → {v.literal}: {v.snippet}")
            for v in r.violations
        ),
        remediation=(
            "see TOKEN_DRIVEN_DESIGN: borders bind to var(--border-width-*). Mark "
            "documented exceptions with /* token-leak: ok */"
        ),
    ),
    _static_spec(
        slug="dimension",
        name="Dimension",
        principle="JUSTIFY_EVERY_DIMENSION",
        primary=lambda s: s.components_dir,
        runner=lambda s: run_dimension_lint(
            s.components_dir, pages_dir=s.pages_dir, extra_files=list(s.extra_files)
        ),
        to_findings=lambda r: (
            Finding(f"{v.file}:{v.line}", f"{v.declaration} → {v.literal}: {v.snippet}")
            for v in r.violations
        ),
        remediation=(
            "see TOKEN_DRIVEN_DESIGN / JUSTIFY_EVERY_DIMENSION: widths, heights, gaps, "
            "and offsets bind to tokens. Permitted: 0, auto, %, viewport/container units, "
            "lh, fr. Mark documented exceptions with /* dimension-lint: ok */"
        ),
    ),
    _static_spec(
        slug="page",
        name="Page contract",
        principle="page-contract",
        primary=lambda s: s.pages_dir,
        runner=lambda s: run_page_lint(s.pages_dir),
        to_findings=lambda r: (
            Finding(f"page {v.page}", f"{v.rule}: {v.message}") for v in r.violations
        ),
        remediation="see docs/reference/page-contract.md",
    ),
)


def spec_by_slug(slug: str) -> LintSpec:
    for spec in REGISTRY:
        if spec.slug == slug:
            return spec
    raise KeyError(f"no audit registered with slug {slug!r}")


def static_specs() -> tuple[LintSpec, ...]:
    return tuple(s for s in REGISTRY if s.kind == AuditKind.STATIC)
