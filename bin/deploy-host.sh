#!/usr/bin/env bash
# Run on the production EC2 via SSM Run Command.
# CI prepends required env vars (IMAGE_URL, IMAGE_TAG, COMPOSE_B64, CADDYFILE_B64)
# before invoking this script body.
set -euo pipefail

: "${IMAGE_URL:?IMAGE_URL required}"
: "${IMAGE_TAG:?IMAGE_TAG required}"
: "${COMPOSE_B64:?COMPOSE_B64 required}"
: "${CADDYFILE_B64:?CADDYFILE_B64 required}"

DEPLOY_DIR="/etc/hflogo"
SSM_PATH="/hflogo/prod"

mkdir -p "$DEPLOY_DIR"

echo ">> Materializing docker-compose.yml and Caddyfile"
echo "$COMPOSE_B64"   | base64 -d > "$DEPLOY_DIR/docker-compose.yml"
echo "$CADDYFILE_B64" | base64 -d > "$DEPLOY_DIR/Caddyfile"
chmod 0644 "$DEPLOY_DIR/docker-compose.yml" "$DEPLOY_DIR/Caddyfile"

echo ">> Fetching runtime secrets from SSM ($SSM_PATH)"
TMP_ENV="$(mktemp)"
aws ssm get-parameters-by-path \
  --path "$SSM_PATH" --with-decryption --recursive \
  --query 'Parameters[].{Name:Name,Value:Value}' --output json \
  | jq -r --arg p "$SSM_PATH/" '.[] | "\(.Name | sub($p; ""))=\(.Value)"' \
  > "$TMP_ENV"

# Append CI-provided + host-known vars consumed by docker-compose.yml
{
  echo "IMAGE_URL=$IMAGE_URL"
  echo "IMAGE_TAG=$IMAGE_TAG"
  cat /etc/hflogo.env
} >> "$TMP_ENV"

install -m 0600 "$TMP_ENV" "$DEPLOY_DIR/runtime.env"
rm -f "$TMP_ENV"

# Source runtime env to get registry creds for docker login.
set -a; . "$DEPLOY_DIR/runtime.env"; set +a

REGISTRY_HOST="${IMAGE_URL%%/*}"
echo ">> Logging into $REGISTRY_HOST"
echo "$GITLAB_DEPLOY_TOKEN" | docker login "$REGISTRY_HOST" \
  -u "$GITLAB_DEPLOY_TOKEN_USERNAME" --password-stdin

COMPOSE=(docker compose -f "$DEPLOY_DIR/docker-compose.yml" --env-file "$DEPLOY_DIR/runtime.env")

echo ">> Pulling $IMAGE_URL:$IMAGE_TAG"
"${COMPOSE[@]}" pull

echo ">> Starting db"
"${COMPOSE[@]}" up -d db

echo ">> Preparing database"
"${COMPOSE[@]}" run --rm app bin/rails db:prepare

echo ">> Starting services"
"${COMPOSE[@]}" up -d --remove-orphans

echo ">> Waiting for app health"
APP_CID="$("${COMPOSE[@]}" ps -q app)"
for i in $(seq 1 60); do
  status="$(docker inspect --format '{{.State.Health.Status}}' "$APP_CID" 2>/dev/null || echo starting)"
  echo "  attempt $i: $status"
  case "$status" in
    healthy)   break ;;
    unhealthy) echo "ERR: app container unhealthy"; "${COMPOSE[@]}" logs --tail=200 app; exit 1 ;;
  esac
  sleep 5
done

echo ""
echo ">> Deploy complete: $IMAGE_URL:$IMAGE_TAG"
"${COMPOSE[@]}" ps
