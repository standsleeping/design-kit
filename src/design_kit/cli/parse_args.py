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
        help="Generate tokens.css and preview.html into an output directory",
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

    return parser.parse_args(args)
