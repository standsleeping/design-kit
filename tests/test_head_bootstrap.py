"""Tests for the first-paint head bootstrap injection."""

import re
from pathlib import Path

from design_kit.head_bootstrap import (
    BOOTSTRAP_MARKER,
    HEAD_BOOTSTRAP,
    bootstrap_violation,
    inject_head_bootstrap,
)

_COMPONENTS = Path(__file__).parent.parent / "components"


def _js_string_array(source: str, name: str) -> list[str]:
    """Extract a ``const NAME = ['a', 'b'];`` array of string literals from JS source."""
    match = re.search(rf"{name}\s*=\s*\[([^\]]*)\]", source)
    assert match, f"{name} not found in source"
    return re.findall(r"['\"]([^'\"]+)['\"]", match.group(1))


_PAGE = (
    "<!doctype html>\n<html><head>\n"
    '<meta charset="utf-8">\n'
    '<link rel="stylesheet" href="tokens.css">\n'
    "</head><body></body></html>"
)


def test_injects_before_first_stylesheet() -> None:
    """The bootstrap lands after the metas but before the first stylesheet, so the
    document element carries the persisted attributes before any style is computed."""
    out = inject_head_bootstrap(_PAGE)
    assert BOOTSTRAP_MARKER in out
    assert out.index(BOOTSTRAP_MARKER) < out.index('<link rel="stylesheet"')
    assert out.index("<meta charset") < out.index(BOOTSTRAP_MARKER)


def test_is_synchronous_inline_script() -> None:
    """It must be a plain inline script (no defer/module), or it would run after paint."""
    assert HEAD_BOOTSTRAP.startswith("<script>")
    assert "type=" not in HEAD_BOOTSTRAP
    assert "defer" not in HEAD_BOOTSTRAP
    # Mirrors runtime.js: only the explicit non-default values are written.
    assert "data-luminance" in HEAD_BOOTSTRAP
    assert "data-color-theme" in HEAD_BOOTSTRAP


def test_idempotent() -> None:
    """A document already carrying the marker is returned unchanged (no double-inject)."""
    once = inject_head_bootstrap(_PAGE)
    twice = inject_head_bootstrap(once)
    assert once == twice
    assert twice.count(BOOTSTRAP_MARKER) == 1


def test_does_not_collide_with_page_first_paint_script() -> None:
    """Regression: a page with its own first-paint script (e.g. a geometry bootstrap
    whose comment mentions 'first paint') must still receive the universal bootstrap.
    The idempotency marker is specific enough not to match such a script."""
    page = _PAGE.replace(
        '<meta charset="utf-8">\n',
        '<meta charset="utf-8">\n'
        "<script>/* dk-first-paint geometry */ void 0;</script>\n",
    )
    out = inject_head_bootstrap(page)
    assert BOOTSTRAP_MARKER in out
    assert "dk-first-paint geometry" in out


def test_falls_back_to_head_close_without_stylesheet() -> None:
    """With no stylesheet link, the bootstrap is inserted before </head>."""
    page = "<html><head>\n<title>x</title>\n</head><body></body></html>"
    out = inject_head_bootstrap(page)
    assert BOOTSTRAP_MARKER in out
    assert out.index(BOOTSTRAP_MARKER) < out.index("</head>")


def test_no_head_returns_unchanged() -> None:
    """A fragment with no head is left untouched rather than corrupted."""
    fragment = "<div>no head here</div>"
    assert inject_head_bootstrap(fragment) == fragment


def test_anchor_tolerates_attribute_order_and_quoting() -> None:
    """The stylesheet anchor matches regardless of attribute order, quote style, or
    spacing, so injection does not silently depend on one authored form."""
    variants = [
        "<head>\n<link  rel='stylesheet'  href='tokens.css'>\n</head>",
        '<head>\n<link href="tokens.css" rel="stylesheet">\n</head>',
        "<head>\n<link\n  rel=stylesheet\n  href=tokens.css>\n</head>",
    ]
    for page in variants:
        out = inject_head_bootstrap(page)
        assert BOOTSTRAP_MARKER in out
        assert bootstrap_violation(out) is None, page


def test_violation_none_when_injected() -> None:
    """A correctly injected page reports no violation."""
    assert bootstrap_violation(inject_head_bootstrap(_PAGE)) is None


def test_violation_flags_missing_bootstrap() -> None:
    """A built page with no bootstrap is a violation (the silent-skip guard)."""
    assert bootstrap_violation(_PAGE) is not None


def test_violation_flags_bootstrap_after_stylesheet() -> None:
    """A bootstrap placed after the first stylesheet is a violation: styles would
    compute before the persisted state is established."""
    page = (
        f'<head>\n<link rel="stylesheet" href="tokens.css">\n{HEAD_BOOTSTRAP}\n</head>'
    )
    assert bootstrap_violation(page) is not None


def test_bootstrap_theme_set_matches_js_source_of_truth() -> None:
    """The inline bootstrap must set exactly the non-default themes/luminances the JS
    components recognize. Pre-paint JS can't import the runtime module, so the set is
    duplicated; this test guards the duplication (GENERATE_INVARIANTS_LINT_VARIATION):
    add a theme and this fails until the bootstrap learns it."""
    runtime = (_COMPONENTS / "system" / "runtime.js").read_text(encoding="utf-8")
    luminance = (_COMPONENTS / "luminance-toggle.js").read_text(encoding="utf-8")

    color_themes = _js_string_array(runtime, "COLOR_THEMES")
    default_match = re.search(r"DEFAULT_COLOR_THEME\s*=\s*['\"]([^'\"]+)['\"]", runtime)
    assert default_match
    default_theme = default_match.group(1)
    luminances = _js_string_array(luminance, "LUMINANCES")

    non_default_themes = set(color_themes) - {default_theme}
    overrides = set(luminances) - {"auto"}

    # The bootstrap sets exactly the non-default values...
    for theme in non_default_themes:
        assert f"'{theme}'" in HEAD_BOOTSTRAP, f"bootstrap omits theme {theme!r}"
    for lum in overrides:
        assert f"'{lum}'" in HEAD_BOOTSTRAP, f"bootstrap omits luminance {lum!r}"
    # ...and never the defaults, which must stay attribute-absent.
    assert f"'{default_theme}'" not in HEAD_BOOTSTRAP
    assert "'auto'" not in HEAD_BOOTSTRAP
