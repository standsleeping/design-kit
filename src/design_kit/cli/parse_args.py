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

    return parser.parse_args(args)
