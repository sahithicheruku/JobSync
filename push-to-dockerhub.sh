#!/usr/bin/env bash
set -euo pipefail
: "${DOCKER_USERNAME:?Set DOCKER_USERNAME and authenticate with docker login first}"
: "${TAG:?Set an immutable release tag}"
docker buildx build --platform linux/amd64 -t "$DOCKER_USERNAME/jobsync-app:$TAG" -f Dockerfile . --push
docker buildx build --platform linux/amd64 -t "$DOCKER_USERNAME/jobsync-ml-service:$TAG" -f ml-service/Dockerfile ml-service --push
