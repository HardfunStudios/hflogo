#!/usr/bin/env bash
# Snapshot all hflogo Postgres databases + named Docker volumes + runtime config,
# then sync to S3 under manual-backups/<timestamp>/.
#
# Run on the production EC2:
#   sudo bin/backup.sh
#   # or pre-pipeline, with the locally-deployed copy:
#   sudo /usr/local/bin/backup-hflogo
#
# Recovery is documented at the bottom of the script.
set -euo pipefail

DEPLOY_DIR="/etc/hflogo"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.yml"
ENV_FILE="$DEPLOY_DIR/runtime.env"
BACKUP_ROOT="/var/backups/hflogo"

S3_BUCKET="${BACKUP_S3_BUCKET:-hardfun-hflogo-prod-sae1-bucket-097954291364}"
S3_PREFIX_ROOT="${BACKUP_S3_PREFIX_ROOT:-manual-backups}"
AWS_REGION="${AWS_REGION:-sa-east-1}"

DATABASES=(
  hflogo_production
  hflogo_production_cache
  hflogo_production_queue
  hflogo_production_cable
)

VOLUMES=(
  hflogo_postgres_data
  hflogo_redis_data
  hflogo_caddy_data
  hflogo_caddy_config
)

[ -f "$COMPOSE_FILE" ] || { echo "ERR: $COMPOSE_FILE not found"; exit 1; }

BACKUP_TS="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="$BACKUP_ROOT/$BACKUP_TS"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

DB_CID="$(docker compose -f "$COMPOSE_FILE" ps -q db)"
[ -n "$DB_CID" ] || { echo "ERR: db container not running"; exit 1; }

echo ">> Postgres logical dumps"
for DB in "${DATABASES[@]}"; do
  echo "   - $DB"
  docker exec "$DB_CID" pg_dump -U hflogo -d "$DB" -Fc \
    -f "/tmp/${DB}_${BACKUP_TS}.dump"
  docker cp "$DB_CID:/tmp/${DB}_${BACKUP_TS}.dump" "$BACKUP_DIR/"
  docker exec "$DB_CID" rm -f "/tmp/${DB}_${BACKUP_TS}.dump"
done

echo ">> Docker named volume tarballs"
for VOL in "${VOLUMES[@]}"; do
  echo "   - $VOL"
  docker run --rm \
    -v "${VOL}:/volume:ro" \
    -v "$BACKUP_DIR:/backup" \
    alpine \
    tar czf "/backup/${VOL}_${BACKUP_TS}.tar.gz" -C /volume .
done

echo ">> Runtime config"
[ -f "$COMPOSE_FILE" ] && cp "$COMPOSE_FILE" "$BACKUP_DIR/docker-compose.yml"
[ -f "$DEPLOY_DIR/Caddyfile" ] && cp "$DEPLOY_DIR/Caddyfile" "$BACKUP_DIR/Caddyfile"
[ -f /etc/hflogo.env ] && cp /etc/hflogo.env "$BACKUP_DIR/hflogo.env"
# runtime.env contains decrypted SSM values; include it so the backup is
# self-sufficient for restore, but lock down permissions aggressively.
[ -f "$ENV_FILE" ] && install -m 0600 "$ENV_FILE" "$BACKUP_DIR/runtime.env"

chmod -R go-rwx "$BACKUP_DIR"

S3_PREFIX="$S3_PREFIX_ROOT/$BACKUP_TS"
echo ">> Uploading to s3://$S3_BUCKET/$S3_PREFIX/"
aws s3 sync "$BACKUP_DIR/" "s3://$S3_BUCKET/$S3_PREFIX/" \
  --region "$AWS_REGION" \
  --sse AES256 \
  --no-progress

echo ""
echo "Backup complete:"
echo "  Local: $BACKUP_DIR"
echo "  S3:    s3://$S3_BUCKET/$S3_PREFIX/"

# Restore reference (one of these, pick by need):
#
#   # Restore the primary database from a logical dump:
#   docker cp <local>/hflogo_production_<TS>.dump <db_container>:/tmp/in.dump
#   docker exec <db_container> pg_restore -U hflogo -d hflogo_production \
#       --clean --if-exists --no-owner /tmp/in.dump
#
#   # Restore an entire named volume from tar.gz (destroys current contents):
#   docker compose -f docker-compose.yml down
#   docker volume rm hflogo_postgres_data
#   docker volume create hflogo_postgres_data
#   docker run --rm -v hflogo_postgres_data:/volume \
#       -v "$BACKUP_DIR":/backup alpine \
#       sh -c 'cd /volume && tar xzf /backup/hflogo_postgres_data_<TS>.tar.gz'
#   docker compose -f docker-compose.yml up -d
