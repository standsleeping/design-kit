import argparse

from design_kit.logging import get_logger

logger = get_logger(__name__)


def parse_args(args: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    logger.debug("Parsing command line arguments")
    parser = argparse.ArgumentParser(
        prog="design-kit",
        description="Design tokens, web components, and CSS generation",
    )

    parser.add_argument(
        "--log-level",
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
        default="INFO",
        help="Set the logging level (default: INFO)",
    )

    subparsers = parser.add_subparsers(dest="command")

    build_parser = subparsers.add_parser(
        "build",
        help="Generate tokens.css and index.html into an output directory",
    )
    build_parser.add_argument(
        "--output-dir",
        default="dist",
        help="Output directory (default: dist)",
    )
    build_parser.add_argument(
        "--tokens-path",
        default="tokens/design-tokens.json",
        help="Path to design tokens JSON file (default: tokens/design-tokens.json)",
    )

    audit_parser = subparsers.add_parser(
        "audit",
        help="Run the static audit set and print one unified report",
    )
    audit_parser.add_argument(
        "--scope",
        default=None,
        help=(
            "Audit a consumer directory (reads DIR/components and DIR/pages) "
            "instead of the design-kit repo root"
        ),
    )
    audit_parser.add_argument(
        "--components-dir",
        default=None,
        help=(
            "Override the directory of component CSS to lint (globbed *.css, one level); "
            "for a consumer whose CSS does not live under <root>/components"
        ),
    )
    audit_parser.add_argument(
        "--pages-dir",
        default=None,
        help="Override the directory of pages to lint (globbed *.html, one level)",
    )
    audit_parser.add_argument(
        "--tokens-css",
        default=None,
        help="Override the built tokens.css the contrast audit reads",
    )
    audit_parser.add_argument(
        "--json",
        action="store_true",
        dest="as_json",
        help="Emit the report as JSON instead of text",
    )
    audit_parser.add_argument(
        "--headless",
        action="store_true",
        help=(
            "Also run the rendered-page audits in headless Chromium against the built "
            "site (dist/, or DIR under --scope); skips cleanly without Playwright/Chromium"
        ),
    )

    export_parser = subparsers.add_parser(
        "export-tokens",
        help="Copy generated tokens.css and manifest to a target directory",
    )
    export_parser.add_argument(
        "--to",
        required=True,
        help="Target directory for tokens.css and tokens.manifest.json",
    )
    export_parser.add_argument(
        "--source-dir",
        default="dist",
        help="Source directory holding the built tokens (default: dist)",
    )

    return parser.parse_args(args)
