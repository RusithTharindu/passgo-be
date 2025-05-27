#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting local CI/CD pipeline test...${NC}\n"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running${NC}"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}Error: pnpm is not installed${NC}"
    exit 1
fi

# Check pnpm version
PNPM_VERSION=$(pnpm --version)
echo -e "${YELLOW}Current pnpm version: ${PNPM_VERSION}${NC}"
if [ "$PNPM_VERSION" != "9.15.1" ]; then
    echo -e "${YELLOW}Warning: pnpm version mismatch. Expected 9.15.1${NC}"
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 1: Install dependencies
echo -e "\n${YELLOW}Step 1: Installing dependencies...${NC}"
pnpm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dependencies installed successfully${NC}"


# Step 4: Build the project
echo -e "\n${YELLOW}Step 4: Building the project...${NC}"
pnpm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}"

# Step 5: Build Docker image
echo -e "\n${YELLOW}Step 5: Building Docker image...${NC}"
docker build -t passgo-be:test .
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Docker build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker image built successfully${NC}"

# Step 6: Test Docker container
echo -e "\n${YELLOW}Step 6: Testing Docker container...${NC}"
docker run -d --name passgo-be-test -p 8080:8080 --env-file .env passgo-be:test
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to start Docker container${NC}"
    exit 1
fi

# Wait for container to start
echo "Waiting for container to start..."
sleep 5

# Test if container is running
if ! docker ps | grep -q passgo-be-test; then
    echo -e "${RED}Error: Container failed to start${NC}"
    docker logs passgo-be-test
    exit 1
fi

# Cleanup
echo -e "\n${YELLOW}Cleaning up...${NC}"
docker stop passgo-be-test
docker rm passgo-be-test
docker rmi passgo-be:test

echo -e "\n${GREEN}✓ All pipeline steps completed successfully!${NC}"
echo -e "${GREEN}Your local CI/CD pipeline test passed!${NC}"  