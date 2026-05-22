"""Runs the JSDoc/TypeScript static type-check (`tsc --noEmit`) over the JS sources.

The components are vanilla JS; TypeScript runs only as a checker (no transpile,
no emit) per tsconfig.json. This wrapper exists so the existing pytest harness
covers it; CI does not need a separate JS runner. Mirrors test_app_runtime_js.py.

Skipped automatically if `node` or the local TypeScript install is absent — run
`npm install` to enable it. During the Phase 4a migration every file carries
`// @ts-nocheck`; the check stays green while annotations are added file by file.
"""

import shutil
import subprocess
from pathlib import Path

import pytest

NODE_BIN = shutil.which("node")
TSC = Path("node_modules/typescript/bin/tsc")
TSCONFIG = Path("tsconfig.json")


@pytest.mark.skipif(NODE_BIN is None, reason="node not installed")
@pytest.mark.skipif(
    not TSC.is_file(), reason="TypeScript not installed — run `npm install`"
)
def test_tsc_noemit_passes():
    assert NODE_BIN is not None  # narrowing for the type-checker; skipif guarantees it
    assert TSCONFIG.is_file()
    result = subprocess.run(
        [NODE_BIN, str(TSC), "--noEmit"],
        capture_output=True,
        text=True,
        timeout=120,
    )
    assert result.returncode == 0, (
        f"tsc --noEmit failed (exit {result.returncode})\n"
        f"--- stdout ---\n{result.stdout}\n"
        f"--- stderr ---\n{result.stderr}"
    )
