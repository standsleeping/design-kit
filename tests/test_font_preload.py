"""Tests for the build-managed font-preload injection."""

from design_kit.font_preload import (
    FONT_PRELOAD,
    PRELOAD_MARKER,
    font_preload_violation,
    inject_font_preload,
)
from design_kit.token_css import FONT_WOFF2_HREF

_PAGE = (
    "<!doctype html>\n<html><head>\n"
    '<meta charset="utf-8">\n'
    '<link rel="stylesheet" href="tokens.css">\n'
    "</head><body></body></html>"
)


def test_injects_before_first_stylesheet() -> None:
    """The preload lands after the metas but before the first stylesheet, so the font
    fetch is discovered alongside the CSS fetch."""
    out = inject_font_preload(_PAGE)
    assert PRELOAD_MARKER in out
    assert out.index(PRELOAD_MARKER) < out.index('<link rel="stylesheet"')
    assert out.index("<meta charset") < out.index(PRELOAD_MARKER)


def test_preload_targets_the_self_hosted_font_with_crossorigin() -> None:
    """The preload points at the same woff2 the @font-face uses (single source), and
    carries crossorigin so it matches the CORS-mode font fetch rather than double-loading."""
    assert FONT_WOFF2_HREF in FONT_PRELOAD
    assert 'as="font"' in FONT_PRELOAD
    assert "crossorigin" in FONT_PRELOAD


def test_idempotent() -> None:
    """A document already carrying the preload is returned unchanged (no double-inject)."""
    once = inject_font_preload(_PAGE)
    twice = inject_font_preload(once)
    assert once == twice
    assert twice.count(PRELOAD_MARKER) == 1


def test_falls_back_to_head_close_without_stylesheet() -> None:
    """With no stylesheet link, the preload is inserted before </head>."""
    page = "<html><head>\n<title>x</title>\n</head><body></body></html>"
    out = inject_font_preload(page)
    assert PRELOAD_MARKER in out
    assert out.index(PRELOAD_MARKER) < out.index("</head>")


def test_no_head_returns_unchanged() -> None:
    """A fragment with no head is left untouched rather than corrupted."""
    fragment = "<div>no head here</div>"
    assert inject_font_preload(fragment) == fragment


def test_anchor_tolerates_attribute_order_and_quoting() -> None:
    """The stylesheet anchor matches regardless of attribute order, quote style, or
    spacing, so injection does not silently depend on one authored form."""
    variants = [
        "<head>\n<link  rel='stylesheet'  href='tokens.css'>\n</head>",
        '<head>\n<link href="tokens.css" rel="stylesheet">\n</head>',
        "<head>\n<link\n  rel=stylesheet\n  href=tokens.css>\n</head>",
    ]
    for page in variants:
        out = inject_font_preload(page)
        assert PRELOAD_MARKER in out
        assert font_preload_violation(out) is None, page


def test_violation_none_when_injected() -> None:
    """A correctly injected page reports no violation."""
    assert font_preload_violation(inject_font_preload(_PAGE)) is None


def test_violation_flags_missing_preload() -> None:
    """A built page with no preload is a violation (the silent-skip guard)."""
    assert font_preload_violation(_PAGE) is not None


def test_violation_flags_preload_after_stylesheet() -> None:
    """A preload placed after the first stylesheet is a violation: the font fetch would
    not start until the CSS is parsed."""
    page = f'<head>\n<link rel="stylesheet" href="tokens.css">\n{FONT_PRELOAD}\n</head>'
    assert font_preload_violation(page) is not None
