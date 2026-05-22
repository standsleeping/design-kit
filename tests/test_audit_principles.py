"""Every audit's `principle` reference resolves to a real target.

Each audit carries a free-text `principle`: either an SP catalog ID (UPPER_SNAKE,
resolving to system-principles/content/<id>.md) or a DK-local doc label (kebab-case,
on the allowlist below). Nothing else checks these strings, so an ID that is mistyped
or has gone out of date would pass unnoticed. These tests are that check.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

from design_kit.audit.headless import headless_specs
from design_kit.audit.registry import static_specs

_REPO_ROOT = Path(__file__).resolve().parent.parent
_SP_CONTENT = _REPO_ROOT.parent / "system-principles" / "content"

# Kebab-case principle values are DK-local labels, not SP catalog IDs. Each is listed
# deliberately; introducing a new one must be a conscious edit here, which is the point.
_DOC_LABELS = {
    "square-corners",  # visual-language: zero border-radius, no SP principle
    "page-contract",  # docs/reference/page-contract.md
    "responsive-table-contract",  # pages/responsive-table-tests.html behavior page
}


def _all_principles() -> set[str]:
    return {spec.principle for spec in (*static_specs(), *headless_specs())}


def _is_sp_id(principle: str) -> bool:
    return re.fullmatch(r"[A-Z][A-Z0-9_]+", principle) is not None


def test_every_audit_principle_is_an_sp_id_or_a_known_doc_label() -> None:
    for principle in _all_principles():
        assert _is_sp_id(principle) or principle in _DOC_LABELS, (
            f"{principle!r} is neither an SP-catalog ID nor a known doc label; "
            "use the catalog ID or add it to _DOC_LABELS"
        )


@pytest.mark.skipif(
    not _SP_CONTENT.is_dir(),
    reason="system-principles repo is not a sibling of design-kit",
)
def test_sp_id_principles_resolve_to_the_system_principles_catalog() -> None:
    missing = sorted(
        p
        for p in _all_principles()
        if _is_sp_id(p) and not (_SP_CONTENT / f"{p.lower()}.md").is_file()
    )
    assert not missing, (
        f"audit principle(s) absent from system-principles/content: {missing}"
    )
