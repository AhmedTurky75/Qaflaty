#!/bin/bash

echo "Starting Qaflaty database services..."

# Check if .env file exists, if not copy from .env.example
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "Creating .env file from .env.example..."
        cp .env.example .env
    else
        echo "Warning: No .env or .env.example file found!"
    fi
fi

# Start Docker Compose services
docker-compose up -d

echo ""
echo "Services started successfully!"
echo "PostgreSQL: localhost:5432"
echo "pgAdmin: http://localhost:5050"
echo ""
echo "Use 'docker-compose logs -f' to view logs"
