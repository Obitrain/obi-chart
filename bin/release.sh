#!/bin/bash

set -eou pipefail

cd "$(dirname "$0")/.." || exit 1

if [ ! -f .env ]; then
    yarn env:load
fi

set -a
source .env
set +a

if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo "Error: GITHUB_TOKEN is not set. GitHub release will fail."
    echo "Please set GITHUB_TOKEN in your .env file."
    exit 1
fi

yarn release-it
