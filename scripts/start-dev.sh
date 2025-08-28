#!/bin/bash
# Development environment startup script

set -e

echo "Starting QuantInsight AI Development Environment..."

# Check if .env file exists
if [ ! -f ./backend/.env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example ./backend/.env
    echo "Please update ./backend/.env with your actual configuration values!"
fi

# Build and start containers
docker-compose -f docker-compose.dev.yml build
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 10

# Run database migrations
echo "Running database migrations..."
docker-compose -f docker-compose.dev.yml exec backend alembic upgrade head

# Show status
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "Development environment is ready!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8000"
echo "PgAdmin: http://localhost:5050"
echo "Redis Commander: http://localhost:8081"
echo "MailHog: http://localhost:8025"
echo ""
echo "To view logs: docker-compose -f docker-compose.dev.yml logs -f [service_name]"
echo "To stop: docker-compose -f docker-compose.dev.yml down"