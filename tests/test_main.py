"""Tests for the main function."""

from design_kit.main import main


def test_main() -> None:
    """Test the main function exits successfully."""
    exit_code = main([])
    assert exit_code == 0
