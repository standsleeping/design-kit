"""Logging configuration for the package."""

import inspect
import logging
import sys


def configure_logging(level: int | None = None) -> None:
    """Configure the root logger for the application.

    Sets up the root logger with appropriate handlers and formatting.
    This should be called once at application startup.

    Args:
        level: The logging level (defaults to INFO)
    """
    if level is None:
        level = logging.INFO

    # Get the root logger
    root_logger = logging.getLogger()

    # Clear any existing handlers to avoid duplicates
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Set the root logger level
    root_logger.setLevel(level)

    # Create handler to stderr (standard practice)
    handler = logging.StreamHandler(sys.stderr)

    # Set up formatter
    formatter = logging.Formatter("%(asctime)s [%(name)s] [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)

    # Add the handler to the root logger
    root_logger.addHandler(handler)


def get_logger(name: str | None = None) -> logging.Logger:
    """Get a logger instance with the specified name.

    If name is not provided, automatically infers the module name from the calling module.

    Args:
        name: The name for the logger, typically __name__ (optional)

    Returns:
        A configured logger instance
    """
    if name is None:
        # Inspect the call stack to get the module name of the calling module
        frame = inspect.currentframe()
        if frame:
            try:
                frame = frame.f_back
                if frame:
                    module = inspect.getmodule(frame)
                    if module:
                        name = module.__name__
            finally:
                # Always make sure to delete the frame reference to avoid reference cycles
                del frame

    # If we still don't have a name (unlikely), use a default
    if name is None:
        name = "design_kit"

    return logging.getLogger(name)
