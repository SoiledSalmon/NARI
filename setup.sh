#!/bin/bash
# NARI Setup Script for Bash/Linux

set -e

# Colors
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0;30m' # No Color
NC_BOLD='\033[1m'

echo -e "${CYAN}=============================================${NC}"
echo -e "${CYAN}          NARI Safety Platform Setup         ${NC}"
echo -e "${CYAN}=============================================${NC}"

# 1. Check prerequisites
echo -e "\n${YELLOW}[1/5] Checking prerequisites...${NC}"

# Node.js check
if command -v node >/dev/null 2>&1; then
    echo -e "✓ Node.js is installed: $(node --version)"
else
    echo -e "${RED}Node.js is not installed! Please install Node.js >= 18.${NC}"
    exit 1
fi

# Python check
if command -v python3 >/dev/null 2>&1; then
    echo -e "✓ Python is installed: $(python3 --version)"
elif command -v python >/dev/null 2>&1; then
    echo -e "✓ Python is installed: $(python --version)"
else
    echo -e "${RED}Python is not installed! Please install Python >= 3.10.${NC}"
    exit 1
fi

# 2. Setup virtual environment
echo -e "\n${YELLOW}[2/5] Setting up Python virtual environment...${NC}"
if [ ! -d ".venv" ]; then
    echo "Creating .venv virtual environment..."
    python3 -m venv .venv || python -m venv .venv
    echo -e "✓ Virtual environment .venv created successfully."
else
    echo -e "✓ Virtual environment .venv already exists."
fi

# 3. Install backend dependencies
echo -e "\n${YELLOW}[3/5] Installing backend dependencies...${NC}"
source .venv/bin/activate || source .venv/Scripts/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
echo -e "✓ Backend dependencies installed successfully."

# 4. Install frontend dependencies
echo -e "\n${YELLOW}[4/5] Installing frontend dependencies...${NC}"
cd frontend
npm install
cd ..
echo -e "✓ Frontend dependencies installed successfully."

# 5. Environment configuration setup
echo -e "\n${YELLOW}[5/5] Checking environment configuration...${NC}"

if [ ! -f ".env" ]; then
    echo "Creating root .env from .env.example..."
    cp .env.example .env
    echo -e "✓ Created root .env"
else
    echo -e "✓ Root .env already exists"
fi

if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env from .env.example..."
    cp .env.example backend/.env
    echo -e "✓ Created backend/.env"
else
    echo -e "✓ Backend/.env already exists"
fi

if [ ! -f "frontend/.env" ]; then
    echo "Creating frontend/.env from .env.example..."
    cp .env.example frontend/.env
    echo -e "✓ Created frontend/.env"
else
    echo -e "✓ Frontend/.env already exists"
fi

# Verify backend modules can be imported
echo -e "\nChecking backend import status..."
python -c "import fastapi, torch, numpy, firebase_admin, pydantic, dotenv; print('✓ All modules imported successfully')"

echo -e "\n${GREEN}=============================================${NC}"
echo -e "${GREEN}      Setup Completed Successfully!          ${NC}"
echo -e "${GREEN}   To run NARI backend:                      ${NC}"
echo -e "     source .venv/bin/activate"
echo -e "     uvicorn main:app --app-dir backend --port 8000 --reload"
echo -e "${GREEN}   To run NARI frontend:                     ${NC}"
echo -e "     cd frontend && npm run web"
echo -e "${GREEN}=============================================${NC}"
