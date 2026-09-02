#!/bin/bash

set -eou pipefail

readonly BWS_URL="https://vault.bitwarden.eu"

readonly _VAULT_NAME=${VAULT_NAME:='Obitrain-prd'}
readonly _ENV_NAME=${ENV_NAME:=".env"}
readonly _GITLAB_TOKEN_NAME="GITLAB_REGISTRY_TOKEN_DESIGN"
readonly _GITHUB_TOKEN_NAME="GITHUB_TOKEN"

cd "$(dirname "$0")/.." || exit 1

readonly PROJECT_ID=$(bws project list -u "$BWS_URL" | jq --raw-output ".[] | select( .name == \"$_VAULT_NAME\") | .id")
if [ -z "$PROJECT_ID" ]
then
    echo "Project $_VAULT_NAME not found"
    exit 1
fi

echo "Loading $_GITLAB_TOKEN_NAME and $_GITHUB_TOKEN_NAME from $_VAULT_NAME"
bws secret list -u "$BWS_URL" | jq -c -r ".[] | select( .projectId == \"$PROJECT_ID\" and (.key == \"$_GITLAB_TOKEN_NAME\" or .key == \"$_GITHUB_TOKEN_NAME\")) | \"\\(.key)=\\(.value)\"" > "$_ENV_NAME"
set -a  # automatically export all variables
source "$_ENV_NAME"
set +a  # turn off automatic export

