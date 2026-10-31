#!/usr/bin/env bash
# Deploy Java 21 Spring Boot Church Backend to Google Cloud Run

set -e

# Configuration
SERVICE_NAME="church-app-backend"
REGION="us-east1"

echo "=========================================================="
echo " Deploying Java 21 Spring Boot Backend to Google Cloud Run"
echo "=========================================================="

# Check if gcloud CLI is authenticated
if ! command -v gcloud &> /dev/null; then
    echo "Error: Google Cloud SDK (gcloud) is not installed."
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Deploy directly from source using the included Dockerfile
# Cloud Build will package and deploy to Cloud Run automatically
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5

echo "=========================================================="
echo " Deployment Complete! Your Cloud Run URL is listed above."
echo "=========================================================="
