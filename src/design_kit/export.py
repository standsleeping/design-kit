"""Export command: copy generated tokens.css and manifest to a target directory.

Consumers run this from the design-kit repo to vendor tokens into their own
projects without copy-pasting:

    cd ~/Developer/design-kit
    design-kit build
    design-kit export-tokens --to ~/some-consumer/vendor/dk
"""

import shutil
from pathlib import Path

from design_kit.logging import get_logger

logger = get_logger(__name__)

TOKENS_FILENAME = "tokens.css"
MANIFEST_FILENAME = "tokens.manifest.json"


def export_tokens(source_dir: Path, target_dir: Path) -> None:
    """Copy tokens.css and the token manifest from source_dir to target_dir.

    Raises FileNotFoundError if tokens.css or the manifest is missing. Those
    are produced by `design-kit build`, which must be run first.
    """
    src_tokens = source_dir / TOKENS_FILENAME
    src_manifest = source_dir / MANIFEST_FILENAME

    if not src_tokens.exists():
        raise FileNotFoundError(
            f"{src_tokens} not found. Run `design-kit build` first"
        )
    if not src_manifest.exists():
        raise FileNotFoundError(
            f"{src_manifest} not found. Run `design-kit build` first"
        )

    target_dir.mkdir(parents=True, exist_ok=True)
    dest_tokens = target_dir / TOKENS_FILENAME
    dest_manifest = target_dir / MANIFEST_FILENAME
    shutil.copy2(src_tokens, dest_tokens)
    shutil.copy2(src_manifest, dest_manifest)
    logger.info(f"Exported {dest_tokens}")
    logger.info(f"Exported {dest_manifest}")
