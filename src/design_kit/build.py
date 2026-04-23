"""Build command: generate CSS and preview pages into an output directory."""

import json
import shutil
import time
from pathlib import Path

from design_kit.contrast_self_test import run as run_contrast_audit
from design_kit.logging import get_logger
from design_kit.preview import generate_preview_html
from design_kit.token_css import generate_token_css

logger = get_logger(__name__)

COMPONENTS_DIR = Path("components")
PAGES_DIR = Path("pages")
# Runtime / infrastructure JS files that live alongside components but are
# not themselves contract-conformant components.
NON_COMPONENT_JS = {"storybook.js"}


def build(tokens_path: Path, output_dir: Path) -> None:
    """Generate tokens.css and preview pages into output_dir.

    Also copies component JS files so the preview can import them.
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    css = generate_token_css(tokens_path)
    css_path = output_dir / "tokens.css"
    css_path.write_text(css, encoding="utf-8")
    logger.info(f"Generated {css_path}")

    audit_results, audit_report = run_contrast_audit(css_path)
    audit_failures = [r for r in audit_results if not r.passed]
    if audit_failures:
        logger.error(
            f"Token-pair contrast audit found {len(audit_failures)} failure(s)"
        )
        print(audit_report)
        for f in audit_failures:
            logger.error(
                f"  --{f.pair.a} x --{f.pair.b} ({f.theme}): "
                f"{f.ratio:.2f} < {f.pair.min_ratio} - {f.pair.reason}"
            )
        raise RuntimeError(
            f"tokens.css violates {len(audit_failures)} palette contract(s)"
        )
    logger.info(f"Contrast audit passed ({len(audit_results)} checks)")

    html = generate_preview_html()
    html_path = output_dir / "preview.html"
    html_path.write_text(html, encoding="utf-8")
    logger.info(f"Generated {html_path}")

    cache_bust = str(int(time.time()))
    if PAGES_DIR.is_dir():
        for page in PAGES_DIR.glob("*.html"):
            dest = output_dir / page.name
            text = page.read_text(encoding="utf-8")
            text = text.replace("{{CACHE_BUST}}", cache_bust)
            dest.write_text(text, encoding="utf-8")
            logger.info(f"Copied {dest}")

    if COMPONENTS_DIR.is_dir():
        dest_components = output_dir / "components"
        if dest_components.exists():
            shutil.rmtree(dest_components)
        shutil.copytree(COMPONENTS_DIR, dest_components)
        logger.info(f"Copied components to {dest_components}")

        manifest = sorted(
            p.name
            for p in dest_components.glob("*.js")
            if p.name not in NON_COMPONENT_JS
        )
        manifest_path = dest_components / "manifest.json"
        manifest_path.write_text(
            json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
        )
        logger.info(f"Generated {manifest_path} ({len(manifest)} components)")
    else:
        logger.warning(f"Components directory not found: {COMPONENTS_DIR}")
