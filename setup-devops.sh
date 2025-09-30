#!/bin/bash

# 🚀 DevOps Setup Script for Angular Expense Tracker
# This script helps set up and validate the entire DevOps pipeline

set -e

echo "🚀 Angular Expense Tracker DevOps Setup"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
echo ""
print_status "Checking prerequisites..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 20 or higher."
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm found: $NPM_VERSION"
else
    print_error "npm not found. Please install npm."
    exit 1
fi

# Check Docker
if command -v docker &> /dev/null; then
    if docker info &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_success "Docker found and running: $DOCKER_VERSION"
        DOCKER_AVAILABLE=true
    else
        print_warning "Docker found but not running. Please start Docker Desktop."
        DOCKER_AVAILABLE=false
    fi
else
    print_warning "Docker not found. Install Docker Desktop for containerization features."
    DOCKER_AVAILABLE=false
fi

# Install dependencies
echo ""
print_status "Installing dependencies..."
npm ci
print_success "Dependencies installed successfully"

# Run tests
echo ""
print_status "Running test suite..."
npm run test:ci
print_success "All tests passed!"

# Run linting
echo ""
print_status "Running code quality checks..."
npm run lint
print_success "Code quality checks passed!"

# Build application
echo ""
print_status "Building application for production..."
npm run build:prod
print_success "Application built successfully!"

# Test Docker if available
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo ""
    print_status "Testing Docker containerization..."
    
    # Build production image
    print_status "Building production Docker image..."
    docker build -t angular-expense-tracker:test --target production .
    print_success "Docker production image built successfully!"
    
    # Test production container
    print_status "Testing production container..."
    docker run -d -p 8080:80 --name expense-tracker-test angular-expense-tracker:test
    
    # Wait for container to start
    sleep 5
    
    # Test health endpoint
    if curl -f http://localhost:8080/health &> /dev/null; then
        print_success "Production container is healthy!"
    else
        print_warning "Container health check failed"
    fi
    
    # Cleanup test container
    docker stop expense-tracker-test &> /dev/null || true
    docker rm expense-tracker-test &> /dev/null || true
    print_status "Test container cleaned up"
    
    # Test development environment
    print_status "Testing development Docker Compose..."
    docker-compose up -d
    
    # Wait for services to start
    sleep 10
    
    # Test frontend
    if curl -f http://localhost:4200 &> /dev/null; then
        print_success "Development frontend is running!"
    else
        print_warning "Development frontend health check failed"
    fi
    
    # Test backend
    if curl -f http://localhost:3000/expenses &> /dev/null; then
        print_success "Development backend is running!"
    else
        print_warning "Development backend health check failed"
    fi
    
    # Cleanup
    docker-compose down
    print_status "Development environment cleaned up"
fi

# Security audit
echo ""
print_status "Running security audit..."
npm run security:audit
print_success "Security audit completed!"

# Bundle analysis
echo ""
print_status "Analyzing bundle size..."
npm run bundle:analyze &> /dev/null || true
print_success "Bundle analysis completed!"

echo ""
print_success "🎉 DevOps setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Set up GitHub repository secrets for deployment"
echo "2. Configure Vercel or Netlify for production deployment"
echo "3. Enable GitHub Actions in your repository"
echo "4. Push changes to trigger the CI/CD pipeline"
echo ""
echo "For detailed setup instructions, see: README.md"