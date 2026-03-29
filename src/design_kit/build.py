"""Build command: generate CSS and preview pages into an output directory."""

import shutil
from pathlib import Path

from design_kit.components_preview import generate_components_preview_html
from design_kit.logging import get_logger
from design_kit.preview import generate_preview_html
from design_kit.token_css import generate_token_css

logger = get_logger(__name__)

COMPONENTS_DIR = Path("components")


def build(tokens_path: Path, output_dir: Path) -> None:
    """Generate tokens.css and preview pages into output_dir.

    Also copies component JS files so the preview can import them.
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    css = generate_token_css(tokens_path)
    css_path = output_dir / "tokens.css"
    css_path.write_text(css, encoding="utf-8")
    logger.info(f"Generated {css_path}")

    html = generate_preview_html()
    html_path = output_dir / "preview.html"
    html_path.write_text(html, encoding="utf-8")
    logger.info(f"Generated {html_path}")

    components_html = generate_components_preview_html()
    components_html_path = output_dir / "components.html"
    components_html_path.write_text(components_html, encoding="utf-8")
    logger.info(f"Generated {components_html_path}")

    if COMPONENTS_DIR.is_dir():
        dest_components = output_dir / "components"
        if dest_components.exists():
            shutil.rmtree(dest_components)
        shutil.copytree(COMPONENTS_DIR, dest_components)
        logger.info(f"Copied components to {dest_components}")
    else:
        logger.warning(f"Components directory not found: {COMPONENTS_DIR}")
