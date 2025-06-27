#!/bin/bash

set -eou pipefail

readonly _VAULT_NAME='Obitrain-prd'
readonly _ENV_VAR_NAME='GITLAB_REGISTRY_TOKEN_DESIGN'
cd "$(dirname "$0")/.." || exit 1


readonly PROJECT_ID=$(bws project list | jq --raw-output ".[] | select( .name == \"$_VAULT_NAME\") | .id")
if [ -z "$PROJECT_ID" ]
then
    echo "Project $_VAULT_NAME not found"
    exit 1
fi

echo "Loading $_ENV_VAR_NAME from $_VAULT_NAME"
bws secret list | jq -c -r ".[] | select( .projectId == \"$PROJECT_ID\" and .key == \"$_ENV_VAR_NAME\") | \"\\(.key)=\\(.value)\"" > .env
set -a  # automatically export all variables
source .env
set +a  # turn off automatic export

