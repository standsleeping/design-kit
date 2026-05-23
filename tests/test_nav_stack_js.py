"""Runs NavStack's selection-transform tests via Node's built-in test runner.

The selection rules in components/nav-stack.js (selectInLevels) are pure data —
no DOM — so node:test exercises them without a browser. This wrapper exists so
the existing pytest harness covers them; CI does not need a separate JS runner.
Skipped automatically if `node` is not on PATH.
"""

import shutil
import subprocess
from pathlib import Path

import pytest

NODE_TEST = Path("tests/static_js/nav_stack.test.mjs")
NODE_BIN = shutil.which("node")


@pytest.mark.skipif(NODE_BIN is None, reason="node not installed")
def test_nav_stack_node_tests_pass():
    assert NODE_BIN is not None  # narrowing for the type-checker; skipif guarantees it
    assert NODE_TEST.is_file()
    result = subprocess.run(
        [NODE_BIN, "--test", str(NODE_TEST)],
        capture_output=True,
        text=True,
        timeout=30,
    )
    assert result.returncode == 0, (
        f"node --test failed (exit {result.returncode})\n"
        f"--- stdout ---\n{result.stdout}\n"
        f"--- stderr ---\n{result.stderr}"
    )
    assert "# fail 0" in result.stdout, result.stdout
    assert "# pass 6" in result.stdout, result.stdout
