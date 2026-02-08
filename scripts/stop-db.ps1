#!/usr/bin/env pwsh

Write-Host "Stopping Qaflaty database services..." -ForegroundColor Yellow

docker-compose down

Write-Host "Services stopped successfully!" -ForegroundColor Green
