#!/bin/bash

# This script generates a docker-compose.yml file based on the specified environment.
# Usage: ./generate-compose.sh <production|staging|all>

set -e

# --- YAML Templates ---

# Common properties for all services
COMMON_PROPERTIES='x-heimdall-common: &heimdall-common-properties
  build: .
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8778/"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
  ulimits:
    nofile:
      soft: 65536
      hard: 65536
  deploy:
    resources:
      limits:
        memory: 512M
      reservations:
        memory: 256M'

# Production service definition
PROD_SERVICE='  heimdall-prod:
    <<: *heimdall-common-properties
    ports:
      - "8778:8778"
    volumes:
      - heimdall_db_prod:/usr/src/app/.db
      - heimdall_data_prod:/usr/src/app/.data
    environment:
      - NODE_ENV=production
      - BUN_ENV=production'

# Staging service definition
STAGING_SERVICE='  heimdall-staging:
    <<: *heimdall-common-properties
    ports:
      - "8779:8778"
    volumes:
      - heimdall_db_staging:/usr/src/app/.db
      - heimdall_data_staging:/usr/src/app/.data
    environment:
      - NODE_ENV=staging
      - BUN_ENV=staging'

# Production volumes
PROD_VOLUMES='  heimdall_db_prod:
  heimdall_data_prod:'

# Staging volumes
STAGING_VOLUMES='  heimdall_db_staging:
  heimdall_data_staging:'

# --- Script Logic ---

if [[ "$1" != "production" && "$1" != "staging" && "$1" != "all" ]]; then
  echo "Error: Invalid argument."
  echo "Usage: $0 <production|staging|all>"
  exit 1
fi

ENV=$1
OUTPUT_FILE="docker-compose.yml"

# Start writing the docker-compose.yml file
{
  echo "version: '3.8'"
  echo ""
  echo "$COMMON_PROPERTIES"
  echo ""
  echo "services:"

  if [[ "$ENV" == "production" || "$ENV" == "all" ]]; then
    echo "$PROD_SERVICE"
  fi

  if [[ "$ENV" == "staging" || "$ENV" == "all" ]]; then
    echo "$STAGING_SERVICE"
  fi

  echo ""
  echo "volumes:"

  if [[ "$ENV" == "production" || "$ENV" == "all" ]]; then
    echo "$PROD_VOLUMES"
  fi

  if [[ "$ENV" == "staging" || "$ENV" == "all" ]]; then
    echo "$STAGING_VOLUMES"
  fi

} > "$OUTPUT_FILE"

echo "Generated '$OUTPUT_FILE' for '$ENV' environment."