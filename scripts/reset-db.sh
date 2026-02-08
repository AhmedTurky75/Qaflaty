#!/bin/bash

echo "Resetting Qaflaty database..."
echo "WARNING: This will delete all data!"
read -p "Are you sure? (y/N): " confirmation

if [ "$confirmation" != "y" ]; then
    echo "Operation cancelled."
    exit 0
fi

echo "Stopping services..."
docker-compose down

echo "Removing database volume..."
docker volume rm qaflaty_qaflaty-postgres-data -f

echo "Starting services..."
docker-compose up -d

echo ""
echo "Database reset successfully!"
echo "PostgreSQL: localhost:5432"
echo "pgAdmin: http://localhost:5050"
