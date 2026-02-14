"""Tests for the get_logger function."""

from unittest.mock import MagicMock, patch

from design_kit.logging.logger import get_logger


def test_get_logger_with_name() -> None:
    """Uses an explicit name."""
    logger = get_logger("test_logger")
    assert logger.name == "test_logger"


@patch("inspect.currentframe")
def test_get_logger_with_auto_name(mock_currentframe) -> None:
    """Infers module name correctly when name is not provided."""
    # Create mock frame with a module
    mock_module = MagicMock()
    mock_module.__name__ = "test_inferred_module"

    mock_frame = MagicMock()
    mock_frame_back = MagicMock()
    mock_currentframe.return_value = mock_frame
    mock_frame.f_back = mock_frame_back

    with patch("inspect.getmodule", return_value=mock_module):
        logger = get_logger()
        assert logger.name == "test_inferred_module"


@patch("inspect.currentframe")
def test_get_logger_fallback(mock_currentframe) -> None:
    """Fallback to default name when inference fails."""
    # Return None to simulate failure to get frame
    mock_currentframe.return_value = None
    logger = get_logger()
    assert logger.name == "design_kit"
