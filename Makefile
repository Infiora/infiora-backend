.PHONY: help build up down restart logs shell migrate collectstatic test clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build Docker containers
	docker-compose build

up: ## Start development server
	docker-compose up -d

down: ## Stop all containers
	docker-compose down

restart: ## Restart all containers
	docker-compose restart

logs: ## View logs from all containers
	docker-compose logs -f

logs-web: ## View web container logs only
	docker-compose logs -f web

logs-db: ## View database container logs only
	docker-compose logs -f db

shell: ## Access Django shell in web container
	docker-compose exec web python src/manage.py shell

shell-bash: ## Access bash shell in web container
	docker-compose exec web bash

migrate: ## Run Django migrations
	docker-compose exec web python src/manage.py migrate

makemigrations: ## Create new Django migrations
	docker-compose exec web python src/manage.py makemigrations

collectstatic: ## Collect static files
	docker-compose exec web python src/manage.py collectstatic --noinput

createsuperuser: ## Create Django superuser
	docker-compose exec web python src/manage.py createsuperuser

test: ## Run tests
	docker-compose exec web python src/manage.py test

clean: ## Remove containers and volumes
	docker-compose down -v
	docker system prune -f

dev: ## Start development environment (build + up + logs)
	make build
	make up
	make logs

prod-build: ## Build production containers
	docker-compose -f docker-compose.prod.yml build

prod-up: ## Start production containers
	docker-compose -f docker-compose.prod.yml up -d

prod-down: ## Stop production containers
	docker-compose -f docker-compose.prod.yml down

prod-logs: ## View production logs
	docker-compose -f docker-compose.prod.yml logs -f