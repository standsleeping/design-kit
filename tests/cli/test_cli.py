"""Tests for the command-line interface."""

from design_kit.cli import parse_args


def test_parse_args_defaults() -> None:
    """Test default argument parsing."""
    args = parse_args([])
    assert args.log_level == "INFO"
    assert args.command is None


def test_parse_args_log_level() -> None:
    """Test log level argument."""
    args = parse_args(["--log-level", "DEBUG"])
    assert args.log_level == "DEBUG"


def test_parse_args_build_defaults() -> None:
    """Parses build subcommand with default values."""
    args = parse_args(["build"])
    assert args.command == "build"
    assert args.output_dir == "dist"
    assert args.tokens_path == "tokens/design-tokens.json"


def test_parse_args_build_custom() -> None:
    """Parses build subcommand with custom output dir and tokens path."""
    args = parse_args(
        ["build", "--output-dir", "out", "--tokens-path", "my-tokens.json"]
    )
    assert args.command == "build"
    assert args.output_dir == "out"
    assert args.tokens_path == "my-tokens.json"


def test_parse_args_log_level_with_build() -> None:
    """Parses top-level log level alongside build subcommand."""
    args = parse_args(["--log-level", "DEBUG", "build"])
    assert args.log_level == "DEBUG"
    assert args.command == "build"
