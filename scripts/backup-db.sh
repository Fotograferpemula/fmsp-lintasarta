#!/bin/bash
# ════════════════════════════════════════════════════════
# FMSP Lintasarta — Database Backup Script
# Runs pg_dump with 7-day rotation
# Usage: ./scripts/backup-db.sh
# Cron:  0 2 * * * /path/to/scripts/backup-db.sh
# ════════════════════════════════════════════════════════

set -euo pipefail

# ── Configuration ─────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${KEEP_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="${CONTAINER_NAME:-fmsp-lintasarta-postgres-1}"

# Load .env if available
if [ -f .env ]; then
  export $(grep -E '^(POSTGRES_USER|POSTGRES_DB|POSTGRES_PASSWORD)=' .env | xargs)
fi

DB_USER="${POSTGRES_USER:-fmsp_user}"
DB_NAME="${POSTGRES_DB:-fmsp_db}"

# ── Create backup directory ───────────────────────────
mkdir -p "$BACKUP_DIR"

# ── Run backup ────────────────────────────────────────
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "[$(date)] Starting backup of $DB_NAME..."

docker exec "$CONTAINER_NAME" pg_dump \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  | gzip > "$BACKUP_FILE"

FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup complete: $BACKUP_FILE ($FILESIZE)"

# ── Rotate old backups ────────────────────────────────
echo "[$(date)] Removing backups older than $KEEP_DAYS days..."
find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +"$KEEP_DAYS" -delete

REMAINING=$(ls -1 "$BACKUP_DIR"/*.sql.gz 2>/dev/null | wc -l)
echo "[$(date)] Done. $REMAINING backup(s) retained."
