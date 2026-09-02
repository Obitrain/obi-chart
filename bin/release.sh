#!/bin/bash

# DESCRIPTION
#   Publishes @obitrain/charts to npm (public) and creates the GitHub release via release-it.
#
# USAGE
#   bin/release.sh [release-it args...]
#
#   Needs `npm login` (npm publish) and GITHUB_TOKEN (GitHub release), optionally from .env.
#
# EXAMPLES
#   bin/release.sh
#   bin/release.sh minor

set -euo pipefail

cd "$(dirname "$0")/.." || exit 1

if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo "Error: GITHUB_TOKEN is not set (needed for the GitHub release)." >&2
    exit 1
fi

if ! npm whoami > /dev/null 2>&1; then
    echo "Error: not logged in to npm. Run 'npm login' first." >&2
    exit 1
fi

yarn release-it "$@"
