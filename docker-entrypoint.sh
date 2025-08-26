#!/bin/sh
set -e

APP_DIR=/usr/src/app
DB_DIR="$APP_DIR/.db"
DATA_DIR="$APP_DIR/.data"

# Ensure data directories exist
mkdir -p "$DB_DIR" "$DATA_DIR"

# Start the app
exec bun run src/index.ts
