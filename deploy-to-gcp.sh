#!/bin/bash

# GCP Configuration
PROJECT_ID="bussinessarch"
VM_NAME="jobsync-vm"
ZONE="asia-south1-a"
MACHINE_TYPE="e2-standard-2"
IMAGE_FAMILY="debian-12"
IMAGE_PROJECT="debian-cloud"

# Docker Hub Configuration
DOCKER_USERNAME="praveenpotnurii"
APP_IMAGE="praveenpotnurii/jobsync-app:latest"
ML_IMAGE="praveenpotnurii/jobsync-ml-service:latest"

echo "================================================"
echo "JobSync GCP Deployment Script"
echo "================================================"
echo ""

# Set the project
echo "🔧 Setting GCP project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

if [ $? -ne 0 ]; then
    echo "❌ Failed to set GCP project!"
    exit 1
fi

echo "✅ Project set successfully"
echo ""

# Create firewall rules for ports 3000 and 8000
echo "🔥 Creating firewall rules..."
gcloud compute firewall-rules create jobsync-allow-http \
    --project=$PROJECT_ID \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:3000,tcp:8000 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=jobsync-server \
    --description="Allow HTTP traffic on ports 3000 and 8000 for JobSync" 2>/dev/null || echo "Firewall rule already exists"

echo "✅ Firewall rules configured"
echo ""

# Create the VM instance
echo "🖥️  Creating VM instance: $VM_NAME in zone: $ZONE"
gcloud compute instances create $VM_NAME \
    --project=$PROJECT_ID \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --network-interface=network-tier=PREMIUM,subnet=default \
    --maintenance-policy=MIGRATE \
    --provisioning-model=STANDARD \
    --tags=jobsync-server,http-server,https-server \
    --create-disk=auto-delete=yes,boot=yes,device-name=$VM_NAME,image=projects/$IMAGE_PROJECT/global/images/family/$IMAGE_FAMILY,mode=rw,size=50,type=projects/$PROJECT_ID/zones/$ZONE/diskTypes/pd-balanced \
    --no-shielded-secure-boot \
    --shielded-vtpm \
    --shielded-integrity-monitoring \
    --reservation-affinity=any

if [ $? -ne 0 ]; then
    echo "⚠️  VM might already exist or creation failed"
fi

echo "✅ VM instance created/verified"
echo ""

# Wait for VM to be ready
echo "⏳ Waiting for VM to be ready (30 seconds)..."
sleep 30

# Install Docker and Docker Compose on the VM
echo "🐳 Installing Docker and Docker Compose on VM..."
gcloud compute ssh $VM_NAME --zone=$ZONE --project=$PROJECT_ID --command="
    # Update system
    sudo apt-get update

    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker \$USER

    # Install Docker Compose
    sudo curl -L \"https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose

    # Verify installations
    docker --version
    docker-compose --version
"

if [ $? -ne 0 ]; then
    echo "❌ Failed to install Docker!"
    exit 1
fi

echo "✅ Docker and Docker Compose installed"
echo ""

# Create docker-compose.yml on the VM
echo "📝 Creating docker-compose.yml on VM..."
gcloud compute ssh $VM_NAME --zone=$ZONE --project=$PROJECT_ID --command="
cat > docker-compose.yml <<'EOFCOMPOSE'
version: '3.8'

services:
  app:
    image: $APP_IMAGE
    container_name: jobsync_app
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - ML_SERVICE_URL=http://ml-service:8000
    depends_on:
      - ml-service
    restart: unless-stopped
    networks:
      - jobsync-network

  ml-service:
    image: $ML_IMAGE
    container_name: jobsync_ml
    ports:
      - '8000:8000'
    restart: unless-stopped
    networks:
      - jobsync-network

networks:
  jobsync-network:
    driver: bridge
EOFCOMPOSE
"

if [ $? -ne 0 ]; then
    echo "❌ Failed to create docker-compose.yml!"
    exit 1
fi

echo "✅ docker-compose.yml created"
echo ""

# Create .env file on the VM
echo "📝 Creating .env file on VM..."
gcloud compute ssh $VM_NAME --zone=$ZONE --project=$PROJECT_ID --command="
cat > .env <<'EOFENV'
# Database
DATABASE_URL=\"file:./dev.db\"

# Next Auth
NEXTAUTH_SECRET=\"your-nextauth-secret-here\"
NEXTAUTH_URL=\"http://localhost:3000\"

# OpenAI
OPENAI_API_KEY=\"your-openai-api-key-here\"

# ML Service
ML_SERVICE_URL=\"http://ml-service:8000\"
EOFENV
"

echo "✅ .env file created (you'll need to update it with your actual secrets)"
echo ""

# Pull Docker images and start services
echo "📦 Pulling Docker images and starting services..."
gcloud compute ssh $VM_NAME --zone=$ZONE --project=$PROJECT_ID --command="
    # Pull images
    docker pull $APP_IMAGE
    docker pull $ML_IMAGE

    # Start services with docker-compose
    docker-compose up -d

    # Wait a bit for services to start
    sleep 10

    # Show running containers
    docker ps

    # Show logs
    echo ''
    echo 'App logs:'
    docker logs jobsync_app --tail 20
    echo ''
    echo 'ML Service logs:'
    docker logs jobsync_ml --tail 20
"

if [ $? -ne 0 ]; then
    echo "❌ Failed to start services!"
    exit 1
fi

echo "✅ Services started successfully"
echo ""

# Get the external IP
EXTERNAL_IP=$(gcloud compute instances describe $VM_NAME --zone=$ZONE --project=$PROJECT_ID --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo ""
echo "================================================"
echo "✅ Deployment Complete!"
echo "================================================"
echo ""
echo "VM Details:"
echo "  Name: $VM_NAME"
echo "  Zone: $ZONE"
echo "  External IP: $EXTERNAL_IP"
echo ""
echo "Application URLs:"
echo "  App: http://$EXTERNAL_IP:3000"
echo "  ML Service: http://$EXTERNAL_IP:8000"
echo ""
echo "Useful Commands:"
echo "  SSH into VM: gcloud compute ssh $VM_NAME --zone=$ZONE --project=$PROJECT_ID"
echo "  View logs: gcloud compute ssh $VM_NAME --zone=$ZONE --project=$PROJECT_ID --command='docker logs jobsync_app -f'"
echo "  Stop services: gcloud compute ssh $VM_NAME --zone=$ZONE --project=$PROJECT_ID --command='docker-compose down'"
echo "  Restart services: gcloud compute ssh $VM_NAME --zone=$ZONE --project=$PROJECT_ID --command='docker-compose restart'"
echo ""
echo "⚠️  Important: Update the .env file on the VM with your actual secrets:"
echo "  gcloud compute ssh $VM_NAME --zone=$ZONE --project=$PROJECT_ID --command='nano .env'"
echo ""
