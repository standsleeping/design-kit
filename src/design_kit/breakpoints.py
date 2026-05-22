"""Build-time breakpoint substitution.

CSS variables don't resolve inside ``@media`` / ``@container`` preludes by
spec, so the design-kit tokens that drive responsive breakpoints can't be
plain CSS variables. Instead they live in ``tokens.json`` under
``primitive.breakpoint`` and are substituted into source CSS / HTML at
build time via the ``$bp-<name>`` dialect.

Example source:

    @media (max-width: $bp-tablet) { ... }
    @container (max-width: $bp-container-narrow) { ... }

After substitution:

    @media (max-width: 600px) { ... }
    @container (max-width: 200px) { ... }

Unknown breakpoint names raise ``ValueError`` so typos fail loudly at
build time rather than silently disabling a responsive rule.
"""

from __future__ import annotations

import json
import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from pathlib import Path

_BP_REF_RE = re.compile(r"\$bp-([a-z0-9-]+)")


def load_breakpoints(tokens_path: Path) -> dict[str, str]:
    """Load ``primitive.breakpoint`` from the tokens JSON file."""
    data = json.loads(tokens_path.read_text(encoding="utf-8"))
    primitive = data.get("primitive", {})
    breakpoints = primitive.get("breakpoint", {})
    if not isinstance(breakpoints, dict):
        raise ValueError(
            "tokens.json: primitive.breakpoint must be a flat object of name → value"
        )
    return {k: str(v) for k, v in breakpoints.items()}


def substitute_breakpoints(text: str, breakpoints: dict[str, str]) -> str:
    """Replace every ``$bp-<name>`` reference with its breakpoint value.

    Raises ``ValueError`` if a referenced name is not defined.
    """

    def _replace(m: re.Match[str]) -> str:
        name = m.group(1)
        if name not in breakpoints:
            raise ValueError(
                f"Unknown breakpoint reference $bp-{name}; defined names: "
                f"{', '.join(sorted(breakpoints))}"
            )
        return breakpoints[name]

    return _BP_REF_RE.sub(_replace, text)
