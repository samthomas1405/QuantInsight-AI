#!/bin/bash
# Database backup script

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup"
BACKUP_FILE="${BACKUP_DIR}/quantinsight_${TIMESTAMP}.sql"

echo "Starting database backup at ${TIMESTAMP}"

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

# Perform the backup
pg_dump -h postgres -U ${POSTGRES_USER} -d ${POSTGRES_DB} > ${BACKUP_FILE}

# Compress the backup
gzip ${BACKUP_FILE}

echo "Backup completed: ${BACKUP_FILE}.gz"

# Delete backups older than 7 days
find ${BACKUP_DIR} -name "quantinsight_*.sql.gz" -mtime +7 -delete

echo "Old backups cleaned up"