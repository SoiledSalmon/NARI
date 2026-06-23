# NARI Windows Setup Script
# Run this in PowerShell to prepare the environment for development

$ErrorActionPreference = "Stop"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "          NARI Safety Platform Setup         " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Check prerequisites
Write-Host "`n[1/5] Checking prerequisites..." -ForegroundColor Yellow

# Node.js check
try {
    $nodeVer = node --version
    Write-Host "[OK] Node.js is installed: $nodeVer" -ForegroundColor Green
} catch {
    Write-Error "Node.js is not installed! Please install Node.js >= 18."
    Exit 1
}

# Python check
try {
    $pythonVer = python --version
    Write-Host "[OK] Python is installed: $pythonVer" -ForegroundColor Green
} catch {
    Write-Error "Python is not installed! Please install Python >= 3.10."
    Exit 1
}

# 2. Setup virtual environment
Write-Host "`n[2/5] Setting up Python virtual environment..." -ForegroundColor Yellow
if (-not (Test-Path ".\.venv")) {
    Write-Host "Creating .venv virtual environment..." -ForegroundColor Gray
    python -m venv .venv
    Write-Host "[OK] Virtual environment .venv created successfully." -ForegroundColor Green
} else {
    Write-Host "[OK] Virtual environment .venv already exists." -ForegroundColor Green
}

# 3. Install backend dependencies
Write-Host "`n[3/5] Installing backend dependencies..." -ForegroundColor Yellow
try {
    Write-Host "Installing requirements via pip..." -ForegroundColor Gray
    & ".\.venv\Scripts\pip.exe" install -r backend/requirements.txt
    Write-Host "[OK] Backend dependencies installed successfully." -ForegroundColor Green
} catch {
    Write-Error "Failed to install backend dependencies!"
    Exit 1
}

# 4. Install frontend dependencies
Write-Host "`n[4/5] Installing frontend dependencies..." -ForegroundColor Yellow
try {
    Write-Host "Installing npm packages in frontend..." -ForegroundColor Gray
    Set-Location frontend
    & npm.cmd install
    Set-Location ..
    Write-Host "[OK] Frontend dependencies installed successfully." -ForegroundColor Green
} catch {
    Set-Location ..
    Write-Error "Failed to install frontend dependencies!"
    Exit 1
}

# 5. Environment configuration setup
Write-Host "`n[5/5] Checking environment configuration..." -ForegroundColor Yellow

# Root .env setup
if (-not (Test-Path ".\.env")) {
    Write-Host "Creating root .env from .env.example..." -ForegroundColor Gray
    Copy-Item ".env.example" ".env"
    Write-Host "[OK] Created root .env" -ForegroundColor Green
} else {
    Write-Host "[OK] Root .env already exists" -ForegroundColor Green
}

# Backend .env setup
if (-not (Test-Path ".\backend\.env")) {
    Write-Host "Creating backend/.env from .env.example..." -ForegroundColor Gray
    Copy-Item ".env.example" "backend/.env"
    Write-Host "[OK] Created backend/.env" -ForegroundColor Green
} else {
    Write-Host "[OK] Backend/.env already exists" -ForegroundColor Green
}

# Frontend .env setup
if (-not (Test-Path ".\frontend\.env")) {
    Write-Host "Creating frontend/.env from .env.example..." -ForegroundColor Gray
    Copy-Item ".env.example" "frontend/.env"
    Write-Host "[OK] Created frontend/.env" -ForegroundColor Green
} else {
    Write-Host "[OK] Frontend/.env already exists" -ForegroundColor Green
}

# Verify backend modules can be imported
Write-Host "`nChecking backend import status..." -ForegroundColor Yellow
try {
    & ".\.venv\Scripts\python.exe" -c "import fastapi, torch, numpy, firebase_admin, pydantic, dotenv; print('All modules imported successfully')"
    Write-Host "[OK] Backend verification passed." -ForegroundColor Green
} catch {
    Write-Error "Backend import verification failed! Please check python dependencies."
    Exit 1
}

Write-Host "`n=============================================" -ForegroundColor Green
Write-Host "      Setup Completed Successfully!          " -ForegroundColor Green
Write-Host "   To run NARI backend:                      " -ForegroundColor Green
Write-Host "     .\.venv\Scripts\python.exe -m uvicorn main:app --app-dir backend --port 8000 --reload" -ForegroundColor White
Write-Host "   To run NARI frontend:                     " -ForegroundColor Green
Write-Host "     cd frontend; npm run web                " -ForegroundColor White
Write-Host "=============================================" -ForegroundColor Green
