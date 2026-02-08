#!/usr/bin/env pwsh

Write-Host "Resetting Qaflaty database..." -ForegroundColor Red
Write-Host "WARNING: This will delete all data!" -ForegroundColor Red
$confirmation = Read-Host "Are you sure? (y/N)"

if ($confirmation -ne 'y') {
    Write-Host "Operation cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host "Stopping services..." -ForegroundColor Yellow
docker-compose down

Write-Host "Removing database volume..." -ForegroundColor Yellow
docker volume rm qaflaty_qaflaty-postgres-data -f

Write-Host "Starting services..." -ForegroundColor Yellow
docker-compose up -d

Write-Host ""
Write-Host "Database reset successfully!" -ForegroundColor Green
Write-Host "PostgreSQL: localhost:5432" -ForegroundColor Cyan
Write-Host "pgAdmin: http://localhost:5050" -ForegroundColor Cyan
