import logging
import sys
from pathlib import Path

from design_kit.build import build
from design_kit.cli import parse_args
from design_kit.logging import configure_logging, get_logger

logger = get_logger(__name__)


def main(args: list[str] | None = None) -> int:
    """Main entry point for the CLI."""
    parsed_args = parse_args(args)

    log_level = getattr(logging, parsed_args.log_level)
    configure_logging(level=log_level)

    try:
        if parsed_args.command == "build":
            build(
                tokens_path=Path(parsed_args.tokens_path),
                output_dir=Path(parsed_args.output_dir),
            )
        else:
            print(
                "usage: design-kit <command>\n\ncommands:\n  build  Generate tokens.css, preview.html, and components.html"
            )
        return 0
    except Exception as e:
        logger.error(f"Error during execution: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
