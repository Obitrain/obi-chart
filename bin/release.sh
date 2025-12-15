#!/bin/bash

set -eou pipefail

cd "$(dirname "$0")/.." || exit 1

if [ ! -f .env ]; then
    yarn env:load
fi

set -a
source .env
set +a


yarn release-it
