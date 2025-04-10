#!/bin/bash

echo "Pulling latest changes..."
git pull

echo "Building and starting containers..."
docker-compose down
docker-compose build
docker-compose up -d

echo "Deployment completed successfully!"