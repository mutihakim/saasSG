#!/bin/bash

# WhatsApp Legacy Cleanup Script for Family2 (sanjo)
# This script removes the legacy WhatsApp service artifacts after migration to the modular broker.

PROJECT_ROOT="/var/www/html/apps/family2"
LEGACY_SERVICE_DIR="$PROJECT_ROOT/services/whatsapp"
PM2_NAME="sanjo-whatsapp"

echo "Starting WhatsApp Legacy Cleanup for $PM2_NAME..."

# 1. Stop and Delete PM2 process
if pm2 show $PM2_NAME > /dev/null 2>&1; then
    echo "Deleting PM2 process: $PM2_NAME"
    pm2 delete $PM2_NAME
    pm2 save
else
    echo "PM2 process $PM2_NAME not found or already deleted."
fi

# 2. Remove legacy service directory
if [ -d "$LEGACY_SERVICE_DIR" ]; then
    echo "Removing legacy service directory: $LEGACY_SERVICE_DIR"
    # Optional: backup before removing
    # tar -czf "${LEGACY_SERVICE_DIR}_backup_$(date +%F).tar.gz" "$LEGACY_SERVICE_DIR"
    rm -rf "$LEGACY_SERVICE_DIR"
else
    echo "Legacy service directory $LEGACY_SERVICE_DIR not found."
fi

# 3. Clean up any leftover auth files in project storage if not needed
# The new broker uses its own auth directory. 
# project/storage/app/whatsapp-auth might still be used by the app for temporary QR storage or similar?
# We'll leave it for now unless confirmed it's safe to delete.

echo "Cleanup completed successfully."
