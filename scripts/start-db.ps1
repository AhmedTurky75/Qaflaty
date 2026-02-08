#!/usr/bin/env pwsh

Write-Host "Starting Qaflaty database services..." -ForegroundColor Green

# Check if .env file exists, if not copy from .env.example
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Host "Creating .env file from .env.example..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
    } else {
        Write-Host "Warning: No .env or .env.example file found!" -ForegroundColor Red
    }
}

# Start Docker Compose services
docker-compose up -d

Write-Host ""
Write-Host "Services started successfully!" -ForegroundColor Green
Write-Host "PostgreSQL: localhost:5432" -ForegroundColor Cyan
Write-Host "pgAdmin: http://localhost:5050" -ForegroundColor Cyan
Write-Host ""
Write-Host "Use 'docker-compose logs -f' to view logs" -ForegroundColor Yellow
