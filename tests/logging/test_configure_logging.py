"""Tests for the configure_logging function."""

import logging
import sys

from design_kit.logging.logger import configure_logging


def test_configure_logging() -> None:
    """Sets up the root logger correctly."""
    # Capture the handlers before we run the test
    root_logger = logging.getLogger()
    old_handlers = root_logger.handlers.copy()
    old_level = root_logger.level

    try:
        # Clear handlers for clean test
        for handler in root_logger.handlers[:]:
            root_logger.removeHandler(handler)

        # Test with default level
        configure_logging()

        assert root_logger.level == logging.INFO
        assert len(root_logger.handlers) == 1
        assert isinstance(root_logger.handlers[0], logging.StreamHandler)
        assert root_logger.handlers[0].stream == sys.stderr

        # Test with custom level
        for handler in root_logger.handlers[:]:
            root_logger.removeHandler(handler)

        configure_logging(level=logging.DEBUG)
        assert root_logger.level == logging.DEBUG
    finally:
        # Restore original handlers
        for handler in root_logger.handlers[:]:
            root_logger.removeHandler(handler)

        for handler in old_handlers:
            root_logger.addHandler(handler)

        root_logger.setLevel(old_level)
