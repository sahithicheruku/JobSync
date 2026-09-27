#!/usr/bin/env bash
set -euo pipefail
: "${PROJECT_ID:?Set PROJECT_ID}"
: "${VM_NAME:?Set VM_NAME}"
: "${ZONE:?Set ZONE}"
# Deploy only to an existing, configured VM. Never overwrite its secrets.
# Install the repo and its .env in ~/jobsync before invoking this helper.
gcloud compute ssh "$VM_NAME" --project="$PROJECT_ID" --zone="$ZONE" \
  --command='cd ~/jobsync && test -s .env && docker compose config --quiet && docker compose up --build -d && docker compose ps'
