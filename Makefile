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

# Code Quality Targets
quality: ## Run all code quality checks
	@echo "🔍 Running code quality checks..."
	make format-check
	make lint
	make type-check
	make security-check
	make test-coverage

format: ## Format code with Black and isort
	@echo "🖤 Formatting code with Black..."
	black src/
	@echo "🔢 Sorting imports with isort..."
	isort src/

format-check: ## Check code formatting
	@echo "🖤 Checking code formatting..."
	black --check --diff src/
	@echo "🔢 Checking import sorting..."
	isort --check-only --diff src/

lint: ## Run linting with Flake8
	@echo "🔍 Running linting..."
	flake8 src/

type-check: ## Run type checking with MyPy
	@echo "🏷️ Running type checking..."
	mypy src/

security-check: ## Run security checks with Bandit
	@echo "🔒 Running security checks..."
	bandit -r src/

test-coverage: ## Run tests with coverage
	@echo "🧪 Running tests with coverage..."
	cd src && pytest --cov=. --cov-report=html --cov-report=term-missing

django-check: ## Run Django system checks
	@echo "🔧 Running Django checks..."
	cd src && python manage.py check

pre-commit-install: ## Install pre-commit hooks
	@echo "🔗 Installing pre-commit hooks..."
	pre-commit install

pre-commit-run: ## Run pre-commit hooks on all files
	@echo "🔗 Running pre-commit hooks..."
	pre-commit run --all-files

pre-commit-update: ## Update pre-commit hooks
	@echo "🔗 Updating pre-commit hooks..."
	pre-commit autoupdate

dev-setup: ## Set up development environment
	@echo "🚀 Setting up development environment..."
	pip install -r requirements/dev.txt
	make pre-commit-install
	@echo "✅ Development environment setup complete!"

clean-cache: ## Clean Python cache files
	@echo "🧹 Cleaning cache files..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
	find . -name "*.pyo" -delete 2>/dev/null || true
	find . -name ".coverage" -delete 2>/dev/null || true
	rm -rf htmlcov/ .pytest_cache/ .mypy_cache/ 2>/dev/null || true

workflow-check: ## Simulate GitHub Actions workflow locally
	@echo "🔄 Running workflow simulation..."
	@echo "1️⃣ Code Quality Phase..."
	make quality
	@echo "2️⃣ Test Phase..."
	make django-check
	@echo "✅ Workflow simulation complete!"

workflow-help: ## Show workflow information
	@echo "🔄 GitHub Actions Workflows:"
	@echo ""
	@echo "📋 Workflow Sequence:"
	@echo "  1. Code Quality (code-quality.yml) - Formatting, linting, security"
	@echo "  2. Application Tests (test.yml) - Django tests and deployment checks"
	@echo "  3. Production Deploy (deploy.yml) - EC2 deployment (main branch only)"
	@echo ""
	@echo "🚀 Local Commands:"
	@echo "  make workflow-check  - Simulate full workflow locally"
	@echo "  make quality        - Run code quality checks"
	@echo "  make django-check   - Run Django system checks"
	@echo ""
	@echo "📖 Documentation: docs/WORKFLOWS.md"