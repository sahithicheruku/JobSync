#!/bin/bash

# Docker Hub credentials
DOCKER_USERNAME="your-dockerhub-username"
DOCKER_PAT="your-docker-personal-access-token"

# Image names and tags
APP_IMAGE="praveenpotnurii/jobsync-app"
ML_IMAGE="praveenpotnurii/jobsync-ml-service"
TAG="latest"

echo "================================================"
echo "JobSync Docker Images Push Script"
echo "================================================"
echo ""

# Login to Docker Hub
echo "🔐 Logging in to Docker Hub..."
echo "$DOCKER_PAT" | docker login -u "$DOCKER_USERNAME" --password-stdin

if [ $? -ne 0 ]; then
    echo "❌ Docker login failed!"
    exit 1
fi

echo "✅ Successfully logged in to Docker Hub"
echo ""

# Build and push App image (multi-platform)
echo "🏗️  Building JobSync App image for linux/amd64..."
docker buildx build --platform linux/amd64 -t "$APP_IMAGE:$TAG" -f Dockerfile . --push

if [ $? -ne 0 ]; then
    echo "❌ Failed to build and push app image!"
    exit 1
fi

echo "✅ App image built and pushed successfully"
echo ""

# Build and push ML Service image (multi-platform)
echo "🏗️  Building ML Service image for linux/amd64..."
docker buildx build --platform linux/amd64 -t "$ML_IMAGE:$TAG" -f ml-service/Dockerfile ml-service/ --push

if [ $? -ne 0 ]; then
    echo "❌ Failed to build and push ML service image!"
    exit 1
fi

echo "✅ ML Service image built and pushed successfully"
echo ""

# Logout
echo "🔒 Logging out from Docker Hub..."
docker logout

echo ""
echo "================================================"
echo "✅ All images pushed successfully!"
echo "================================================"
echo ""
echo "Images available at:"
echo "  - $APP_IMAGE:$TAG"
echo "  - $ML_IMAGE:$TAG"
echo ""
echo "To pull these images, use:"
echo "  docker pull $APP_IMAGE:$TAG"
echo "  docker pull $ML_IMAGE:$TAG"
echo ""
