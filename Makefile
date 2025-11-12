.PHONY: help build up up-build down restart logs logs-<service> clean ps shell shell-<service> dev dev-<service> rebuild-<service> health

# ----------------------------
# Default target
# ----------------------------
help:
	@echo "Distributed Notification System - Docker Commands"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Production Commands:"
	@echo "  build                Build all Docker images"
	@echo "  up                   Start all services (production)"
	@echo "  up-build             Build and start all services (production)"
	@echo "  down                 Stop all services"
	@echo "  restart              Restart all services"
	@echo "  logs                 View logs from all services"
	@echo "  logs-<service>       View logs for a specific service (gateway, email, template, user, push, rabbitmq, mysql)"
	@echo "  clean                Stop services and remove volumes + prune system"
	@echo "  ps                   List running containers"
	@echo "  shell-<service>      Access container shell for a specific service"
	@echo ""
	@echo "Development Mode (Merged with docker-compose.dev.yml):"
	@echo "  dev                  Start all services in dev mode"
	@echo "  dev-build            Build and start all services in dev mode"
	@echo "  dev-down             Stop all dev services"
	@echo "  dev-logs             View logs from all dev services"
	@echo "  dev-logs-<service>   View dev logs for a single service"
	@echo "  dev-<service>        Start a single service in dev mode"
	@echo ""
	@echo "Rebuild Specific Service:"
	@echo "  rebuild-<service>    Rebuild and restart a specific service"

# ----------------------------
# Docker management (production)
# ----------------------------
build:
	docker-compose build

up:
	docker-compose up -d

up-build:
	docker-compose up -d --build

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

logs-gateway:
	docker-compose logs -f gateway

logs-email:
	docker-compose logs -f email-service

logs-template:
	docker-compose logs -f template-service

logs-user:
	docker-compose logs -f user-service

logs-push:
	docker-compose logs -f push-service

logs-rabbitmq:
	docker-compose logs -f rabbitmq

logs-mysql:
	docker-compose logs -f mysql

clean:
	docker-compose down -v
	docker system prune -f

ps:
	docker-compose ps

# ----------------------------
# Single service shells
# ----------------------------
shell-gateway:
	docker-compose exec gateway sh

shell-email:
	docker-compose exec email-service sh

shell-template:
	docker-compose exec template-service sh

shell-user:
	docker-compose exec user-service sh

shell-push:
	docker-compose exec push-service sh

shell-mysql:
	docker-compose exec mysql mysql -u template_user -p

# ----------------------------
# Development mode (merged with docker-compose.dev.yml)
# ----------------------------
DEV_COMPOSE=-f docker-compose.yml -f docker-compose.dev.yml

dev:
	docker-compose $(DEV_COMPOSE) up -d

dev-build:
	docker-compose $(DEV_COMPOSE) up -d --build

dev-down:
	docker-compose $(DEV_COMPOSE) down

dev-logs:
	docker-compose $(DEV_COMPOSE) logs -f

dev-logs-gateway:
	docker-compose $(DEV_COMPOSE) logs -f gateway

dev-logs-email:
	docker-compose $(DEV_COMPOSE) logs -f email-service

dev-logs-template:
	docker-compose $(DEV_COMPOSE) logs -f template-service

dev-logs-user:
	docker-compose $(DEV_COMPOSE) logs -f user-service

dev-logs-push:
	docker-compose $(DEV_COMPOSE) logs -f push-service

# Single service dev starts
dev-gateway:
	docker-compose $(DEV_COMPOSE) up -d gateway

dev-email:
	docker-compose $(DEV_COMPOSE) up -d email-service

dev-template:
	docker-compose $(DEV_COMPOSE) up -d template-service

dev-user:
	docker-compose $(DEV_COMPOSE) up -d user-service

dev-push:
	docker-compose $(DEV_COMPOSE) up -d push-service

# ----------------------------
# Rebuild specific service
# ----------------------------
rebuild-gateway:
	docker-compose build --no-cache gateway
	docker-compose up -d gateway

rebuild-email:
	docker-compose build --no-cache email-service
	docker-compose up -d email-service

rebuild-template:
	docker-compose build --no-cache template-service
	docker-compose up -d template-service

rebuild-user:
	docker-compose build --no-cache user-service
	docker-compose up -d user-service

rebuild-push:
	docker-compose build --no-cache push-service
	docker-compose up -d push-service

# ----------------------------
# Health check
# ----------------------------
health:
	@echo "Checking service health..."
	@curl -f http://localhost:3000/health || echo "Gateway: DOWN"
	@curl -f http://localhost:3001/health || echo "Email Service: DOWN"
	@curl -f http://localhost:3002/health || echo "Template Service: DOWN"
	@curl -f http://localhost:8000/health || echo "User Service: DOWN"
	@curl -f http://localhost:3003/health || echo "Push Service: DOWN"
