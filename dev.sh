#!/usr/bin/env bash
# Build design-kit and serve dist/. Ctrl-C to stop.
#
# To preview components from another project in the storybook, that project
# declares a pool entry in components/storybook.config.local.json (gitignored)
# and runs its own CORS-enabled dev server. design-kit is agnostic to which
# projects do this.

set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
port="${DESIGN_KIT_PORT:-8787}"

cd "$here"
uv run design-kit build

echo ""
echo "design-kit storybook:  http://localhost:$port/storybook.html"
echo "design-kit preview:    http://localhost:$port/preview.html"
echo "contract tests:        http://localhost:$port/contract-tests.html"
echo "Ctrl-C to stop."
echo ""

exec python3 -m http.server "$port" -d dist
