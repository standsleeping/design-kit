"""Static scan of pages/*.html for conformance to the Design-kit page contract.

The contract is documented in docs/reference/page-contract.md. This lint runs
as part of `design-kit build` and fails the build if any non-allowlisted page
violates the contract.

Each conformant page satisfies eight rules: the dk-app-shell root, the main
slot, the system-nav slot, the system-sidebar script, the viewport lock, and
the three stylesheet links (tokens, app-shell, sidebar+nav-stack).
"""

from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass
from enum import Enum
from pathlib import Path


class PageLintOutcome(Enum):
    PASSED = "passed"
    FAILED = "failed"


@dataclass(frozen=True)
class PageViolation:
    page: Path
    rule: str
    message: str


@dataclass(frozen=True)
class PageLintResult:
    outcome: PageLintOutcome
    violations: tuple[PageViolation, ...]
    scanned: int
    deferred: tuple[str, ...]
    stale_allowlist: tuple[str, ...]


# Pages that do not yet conform to the Design-kit page contract.
# Each entry is a migration target; remove the entry when the page conforms.
# See docs/reference/page-contract.md for the contract and migration order.
KNOWN_NON_CONFORMANT: frozenset[str] = frozenset()


CheckFn = Callable[[str], str | None]

_HEIGHT_RE = re.compile(r"height\s*:\s*(100%|100vh)")
_OVERFLOW_HIDDEN_RE = re.compile(r"overflow\s*:\s*hidden")


def _check_app_shell_root(text: str) -> str | None:
    if 'class="dk-app-shell"' not in text:
        return 'missing <div class="dk-app-shell"> root'
    return None


def _check_main_slot(text: str) -> str | None:
    if 'class="dk-app-shell-main"' not in text:
        return 'missing <main class="dk-app-shell-main">'
    return None


def _check_system_nav_slot(text: str) -> str | None:
    if "data-system-nav" not in text:
        return "missing element with [data-system-nav] (system sidebar slot)"
    return None


def _check_system_sidebar_script(text: str) -> str | None:
    if "system/system-sidebar.js" not in text:
        return 'missing <script ... src="components/system/system-sidebar.js">'
    return None


def _check_viewport_lock(text: str) -> str | None:
    if not _HEIGHT_RE.search(text):
        return "missing html/body { height: 100% } viewport lock"
    if not _OVERFLOW_HIDDEN_RE.search(text):
        return "missing overflow: hidden on html/body"
    return None


def _check_tokens_css(text: str) -> str | None:
    if "tokens.css" not in text:
        return "missing tokens.css stylesheet link"
    return None


def _check_app_shell_css(text: str) -> str | None:
    if "app-shell.css" not in text:
        return "missing app-shell.css stylesheet link"
    return None


def _check_sidebar_css(text: str) -> str | None:
    if "sidebar.css" not in text or "nav-stack.css" not in text:
        return "missing sidebar.css or nav-stack.css stylesheet link"
    return None


CHECKS: tuple[tuple[str, CheckFn], ...] = (
    ("app-shell-root", _check_app_shell_root),
    ("main-slot", _check_main_slot),
    ("system-nav-slot", _check_system_nav_slot),
    ("system-sidebar-script", _check_system_sidebar_script),
    ("viewport-lock", _check_viewport_lock),
    ("tokens-css", _check_tokens_css),
    ("app-shell-css", _check_app_shell_css),
    ("sidebar-css", _check_sidebar_css),
)


def run_page_lint(pages_dir: Path) -> PageLintResult:
    """Scan pages_dir for HTML files and check each against the contract."""
    violations: list[PageViolation] = []
    deferred: list[str] = []
    stale: list[str] = []
    scanned = 0
    if not pages_dir.is_dir():
        return PageLintResult(
            outcome=PageLintOutcome.PASSED,
            violations=(),
            scanned=0,
            deferred=(),
            stale_allowlist=(),
        )
    for page in sorted(pages_dir.glob("*.html")):
        scanned += 1
        text = page.read_text(encoding="utf-8")
        page_violations: list[tuple[str, str]] = []
        for rule_name, check in CHECKS:
            problem = check(text)
            if problem is not None:
                page_violations.append((rule_name, problem))
        is_allowlisted = page.name in KNOWN_NON_CONFORMANT
        if is_allowlisted:
            if page_violations:
                deferred.append(page.name)
            else:
                stale.append(page.name)
        else:
            for rule, problem in page_violations:
                violations.append(
                    PageViolation(page=page, rule=rule, message=problem)
                )
    outcome = (
        PageLintOutcome.FAILED if violations else PageLintOutcome.PASSED
    )
    return PageLintResult(
        outcome=outcome,
        violations=tuple(violations),
        scanned=scanned,
        deferred=tuple(deferred),
        stale_allowlist=tuple(stale),
    )
