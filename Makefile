# AI Task Management Agent Makefile

# Variables
COMPOSE_FILE = docker-compose.yml
DEV_COMPOSE_FILE = docker-compose.dev.yml
PROJECT_NAME = ai_task_manager

# Default target
.DEFAULT_GOAL := help

# Help
help: ## Show this help message
	@echo "AI Task Management Agent - Available Commands:"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

# Development commands
dev: ## Start development environment (database only)
	@echo "Starting development environment..."
	docker-compose -f $(DEV_COMPOSE_FILE) up -d
	@echo "Development database and Redis are running!"
	@echo "Run 'make dev-backend' and 'make dev-frontend' in separate terminals"

dev-backend: ## Start backend development server
	@echo "Starting backend development server..."
	cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend: ## Start frontend development server
	@echo "Starting frontend development server..."
	cd frontend && npm run dev

dev-stop: ## Stop development environment
	docker-compose -f $(DEV_COMPOSE_FILE) down

# Production commands
up: ## Start all services in production mode
	@echo "Starting all services..."
	docker-compose up -d
	@echo "All services are running!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:8000"
	@echo "API Docs: http://localhost:8000/docs"

build: ## Build all Docker images
	@echo "Building Docker images..."
	docker-compose build

down: ## Stop all services
	@echo "Stopping all services..."
	docker-compose down

restart: ## Restart all services
	@echo "Restarting all services..."
	docker-compose restart

logs: ## Show logs for all services
	docker-compose logs -f

logs-backend: ## Show backend logs
	docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	docker-compose logs -f frontend

# Database commands
migrate: ## Run database migrations
	@echo "Running database migrations..."
	docker-compose exec backend alembic upgrade head

migrate-create: ## Create new migration
	@echo "Creating new migration..."
	@read -p "Migration description: " desc; \
	docker-compose exec backend alembic revision --autogenerate -m "$$desc"

db-reset: ## Reset database (WARNING: This will delete all data)
	@echo "Resetting database..."
	@read -p "Are you sure you want to reset the database? This will delete all data. (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		docker-compose down; \
		docker volume rm $(PROJECT_NAME)_postgres_data || true; \
		docker-compose up -d postgres; \
		sleep 5; \
		docker-compose exec backend alembic upgrade head; \
		echo "Database reset complete!"; \
	else \
		echo "Database reset cancelled."; \
	fi

# Installation and setup
install: ## Install all dependencies
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Dependencies installed!"

setup: ## Initial project setup
	@echo "Setting up AI Task Management Agent..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Created .env file from .env.example"; \
		echo "Please edit .env file and add your GEMINI_API_KEY"; \
	fi
	@make install
	@echo "Setup complete!"

# Testing
test: ## Run all tests
	@echo "Running backend tests..."
	cd backend && python -m pytest
	@echo "Running frontend tests..."
	cd frontend && npm test

test-backend: ## Run backend tests only
	cd backend && python -m pytest -v

test-frontend: ## Run frontend tests only
	cd frontend && npm test

# Utility commands
clean: ## Clean up Docker resources
	@echo "Cleaning up Docker resources..."
	docker system prune -f
	docker volume prune -f

status: ## Show service status
	@echo "Service Status:"
	docker-compose ps

shell-backend: ## Open shell in backend container
	docker-compose exec backend /bin/bash

shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend /bin/sh

shell-db: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U postgres -d taskdb

# Backup and restore
backup: ## Backup database
	@echo "Creating database backup..."
	@mkdir -p backups
	docker-compose exec postgres pg_dump -U postgres taskdb > backups/taskdb_backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup created in backups/ directory"

restore: ## Restore database from backup
	@echo "Available backups:"
	@ls -la backups/*.sql 2>/dev/null || echo "No backups found"
	@read -p "Enter backup filename: " backup; \
	if [ -f "backups/$$backup" ]; then \
		docker-compose exec -T postgres psql -U postgres taskdb < backups/$$backup; \
		echo "Database restored from $$backup"; \
	else \
		echo "Backup file not found!"; \
	fi

# Health checks
health: ## Check service health
	@echo "Checking service health..."
	@echo "Backend: $$(curl -s http://localhost:8000/health | jq -r '.status' 2>/dev/null || echo 'Not responding')"
	@echo "Frontend: $$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>/dev/null || echo 'Not responding')"
	@echo "Database: $$(docker-compose exec postgres pg_isready -U postgres 2>/dev/null && echo 'Ready' || echo 'Not ready')"

# Documentation
docs: ## Generate documentation
	@echo "Generating API documentation..."
	@echo "API docs available at: http://localhost:8000/docs"
	@echo "WebSocket interface at: ws://localhost:8000/ws"

.PHONY: help dev dev-backend dev-frontend dev-stop up build down restart logs logs-backend logs-frontend migrate migrate-create db-reset install setup test test-backend test-frontend clean status shell-backend shell-frontend shell-db backup restore health docs
