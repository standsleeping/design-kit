"""Tests for the export_tokens command."""

from pathlib import Path

import pytest

from design_kit.export import (
    MANIFEST_FILENAME,
    TOKENS_FILENAME,
    export_tokens,
)


def _seed_source(source: Path, *, tokens: str = "/* test */", manifest: str = "{}") -> None:
    source.mkdir(parents=True, exist_ok=True)
    (source / TOKENS_FILENAME).write_text(tokens, encoding="utf-8")
    (source / MANIFEST_FILENAME).write_text(manifest, encoding="utf-8")


def test_export_writes_tokens_and_manifest_to_target(tmp_path: Path) -> None:
    """Both files appear in the target directory after export."""
    source = tmp_path / "src"
    target = tmp_path / "dst"
    _seed_source(source, tokens="/* tokens */", manifest='{"version":"1.2.3"}')

    export_tokens(source, target)

    assert (target / TOKENS_FILENAME).read_text() == "/* tokens */"
    assert (target / MANIFEST_FILENAME).read_text() == '{"version":"1.2.3"}'


def test_export_creates_target_directory_if_missing(tmp_path: Path) -> None:
    """Target directory and any missing parents are created."""
    source = tmp_path / "src"
    target = tmp_path / "deep" / "nested" / "vendor"
    _seed_source(source)

    export_tokens(source, target)

    assert (target / TOKENS_FILENAME).exists()


def test_export_overwrites_existing_files_at_target(tmp_path: Path) -> None:
    """Re-exporting replaces stale files at the destination."""
    source = tmp_path / "src"
    target = tmp_path / "dst"
    _seed_source(source, tokens="/* fresh */")
    target.mkdir()
    (target / TOKENS_FILENAME).write_text("/* stale */", encoding="utf-8")

    export_tokens(source, target)

    assert (target / TOKENS_FILENAME).read_text() == "/* fresh */"


def test_export_raises_when_tokens_missing(tmp_path: Path) -> None:
    """Missing tokens.css points the caller at `design-kit build`."""
    source = tmp_path / "src"
    source.mkdir()
    (source / MANIFEST_FILENAME).write_text("{}", encoding="utf-8")

    with pytest.raises(FileNotFoundError, match="design-kit build"):
        export_tokens(source, tmp_path / "dst")


def test_export_raises_when_manifest_missing(tmp_path: Path) -> None:
    """Missing manifest also points the caller at `design-kit build`."""
    source = tmp_path / "src"
    source.mkdir()
    (source / TOKENS_FILENAME).write_text("/* tokens */", encoding="utf-8")

    with pytest.raises(FileNotFoundError, match="design-kit build"):
        export_tokens(source, tmp_path / "dst")
