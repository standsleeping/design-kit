"""Tests for the command-line interface."""

from design_kit.cli import parse_args


def test_parse_args_defaults() -> None:
    """Test default argument parsing."""
    args = parse_args([])
    assert args.log_level == "INFO"


def test_parse_args_log_level() -> None:
    """Test log level argument."""
    args = parse_args(["--log-level", "DEBUG"])
    assert args.log_level == "DEBUG"
