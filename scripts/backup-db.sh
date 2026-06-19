#!/bin/bash
# ================================================================
# FMSP Lintasarta — Database Backup Script
# ================================================================
# Dijalankan via cron: 0 19 * * * (= 02:00 WIB = 19:00 UTC)
# Contoh crontab: 0 19 * * * /path/to/backup-db.sh >> /var/log/fmsp-backup.log 2>&1
#
# Atau via GitHub Actions schedule (lihat .github/workflows/backup.yml)
# ================================================================

set -euo pipefail

# Config
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="fmsp_backup_${TIMESTAMP}.sql.gz"

# Validasi
if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable tidak ditemukan."
  echo "   Set DATABASE_URL=postgresql://user:pass@host:port/db"
  exit 1
fi

# Buat direktori backup jika belum ada
mkdir -p "$BACKUP_DIR"

echo "┌─────────────────────────────────────────────┐"
echo "│ 🗄️  FMSP Database Backup                     │"
echo "├─────────────────────────────────────────────┤"
echo "│ Waktu : $(date '+%Y-%m-%d %H:%M:%S %Z')            │"
echo "│ File  : $FILENAME      │"
echo "│ Retensi: ${RETENTION_DAYS} hari                          │"
echo "└─────────────────────────────────────────────┘"

# Jalankan backup
echo "⏳ Menjalankan pg_dump..."
pg_dump "$DATABASE_URL" --no-owner --no-privileges --clean --if-exists | gzip > "$BACKUP_DIR/$FILENAME"

# Cek ukuran file
FILE_SIZE=$(du -h "$BACKUP_DIR/$FILENAME" | cut -f1)
echo "✅ Backup selesai: $FILENAME ($FILE_SIZE)"

# Hapus backup lebih dari N hari
DELETED=$(find "$BACKUP_DIR" -name "fmsp_backup_*.sql.gz" -mtime +"$RETENTION_DAYS" -print -delete | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "🧹 $DELETED file backup lama dihapus (> ${RETENTION_DAYS} hari)"
fi

# List backup yang tersisa
echo ""
echo "📁 Backup tersedia:"
ls -lh "$BACKUP_DIR"/fmsp_backup_*.sql.gz 2>/dev/null || echo "   (tidak ada)"
echo ""
echo "✅ Backup selesai pada $(date '+%Y-%m-%d %H:%M:%S %Z')"
