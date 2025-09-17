# Infiora Backend - Development Guide

This comprehensive guide covers everything you need to know for developing the Infiora Backend application.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [API Documentation](#api-documentation)
- [Authentication System](#authentication-system)
- [Database Management](#database-management)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Development Workflows](#development-workflows)
- [Environment Configuration](#environment-configuration)
- [Debugging](#debugging)
- [Common Issues](#common-issues)

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Poetry (dependency management)
- Docker & Docker Compose
- PostgreSQL (for local development)

### Initial Setup
```bash
# Clone repository
git clone <repository-url>
cd infiora-backend

# Install dependencies
make install

# Set up pre-commit hooks
make install-pre-commit

# Start database
make up-dependencies-only

# Run migrations
make migrate

# Start development server
make run-server
```

### Access Points
- **API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **Admin Panel**: http://localhost:8000/admin/

## 📁 Project Structure

```
infiora-backend/
├── core/                           # Main application package
│   ├── apps/                       # Django applications
│   │   ├── accounts/               # User authentication & management
│   │   │   ├── tests/              # Comprehensive test suite (88 tests)
│   │   │   │   ├── test_models.py      # Model tests (12 tests)
│   │   │   │   ├── test_serializers.py # Serializer tests (21 tests)
│   │   │   │   ├── test_views.py       # View tests (41 tests)
│   │   │   │   └── test_authentication.py # Auth backend tests (14 tests)
│   │   │   ├── authentication.py   # Custom auth backend
│   │   │   ├── models.py           # User model & image handling
│   │   │   ├── serializers.py      # API serializers
│   │   │   ├── schemas.py          # OpenAPI schemas
│   │   │   ├── views.py            # API endpoints
│   │   │   └── urls.py             # URL routing
│   │   └── health/                 # Health check endpoints
│   ├── general/                    # Shared utilities
│   │   └── utils/                  # Common utilities
│   └── project/                    # Django project configuration
│       └── settings/               # Environment-specific settings
│           ├── base.py             # Base settings
│           ├── envvars.py          # Environment variables
│           ├── rest_framework.py   # DRF configuration
│           ├── cors.py             # CORS settings
│           ├── docker.py           # Docker-specific settings
│           └── ...                 # Other setting modules
├── scripts/                        # Development scripts
├── .github/workflows/              # CI/CD pipelines
├── docs/                          # Documentation
├── Makefile                       # Development commands
├── pyproject.toml                 # Python dependencies & config
├── docker-compose.yml             # Docker services
└── .env.example                   # Environment template
```

## 🛠 Development Setup

### Environment Configuration

1. **Create Environment File**:
```bash
cp .env.example .env
```

2. **Configure Environment Variables**:
```bash
# Development settings
INFIORA_DEBUG=True
INFIORA_SECRET_KEY=your-secret-key-here
INFIORA_ALLOWED_HOSTS=["localhost","127.0.0.1"]

# Database (using Docker)
INFIORA_DATABASES={"default":{"HOST":"localhost","PORT":"5432"}}

# Email (optional for development)
INFIORA_EMAIL_HOST=smtp.gmail.com
INFIORA_EMAIL_PORT=587
INFIORA_EMAIL_HOST_USER=
INFIORA_EMAIL_HOST_PASSWORD=
```

### Development Commands

```bash
# Install dependencies
make install

# Database operations
make migrate                # Run migrations
make migrations            # Create new migrations
make shell                 # Django shell
make superuser            # Create superuser

# Development server
make run-server           # Start development server

# Testing
make test                 # Run all tests (88 tests)
make lint                 # Run code quality checks

# Docker
make up-dependencies-only # Start only database
```

## 📚 API Documentation

### Interactive Documentation
- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

### Postman Collection
Import `Infiora_Backend_API.postman_collection.json` for complete API testing suite with:
- Auto token management
- Environment variables
- Comprehensive endpoint coverage

## 🔐 Authentication System

### Architecture
- **JWT Tokens**: Access + Refresh token system
- **Token Rotation**: Refresh tokens are blacklisted after use
- **Multi-login Support**: Username or email authentication
- **Security Features**: Token blacklisting, user activation checks

### Key Components

1. **Custom Authentication Backend**: `EmailOrUsernameModelBackend`
   - Supports login with username or email
   - Located in `core/apps/accounts/authentication.py`

2. **User Model**: Extended from `AbstractUser`
   - Email verification field
   - Image upload with UUID naming
   - Located in `core/apps/accounts/models.py`

3. **API Endpoints**:
   ```
   POST /api/v1/auth/register/           # User registration
   POST /api/v1/auth/login/              # Login (username/email)
   POST /api/v1/auth/logout/             # Logout with token blacklisting
   POST /api/v1/auth/refresh-token/      # Token refresh with rotation
   POST /api/v1/auth/forgot-password/    # Password reset request
   POST /api/v1/auth/reset-password/     # Password reset
   POST /api/v1/auth/send-verification-email/  # Email verification
   POST /api/v1/auth/verify-email/       # Email confirmation
   GET  /api/v1/auth/user/               # Get user profile
   PUT  /api/v1/auth/user/               # Update user profile
   PATCH /api/v1/auth/user/              # Partial update
   ```

### Security Features
- **Token Blacklisting**: Logout and refresh invalidate old tokens
- **Password Validation**: Strong password requirements
- **Email Verification**: Optional email confirmation
- **Rate Limiting**: Ready for rate limiting middleware
- **CORS Protection**: Configurable CORS settings

## 🗄 Database Management

### Models
- **Account**: Custom user model with email verification
- **Token Blacklisting**: Automatic token management

### Migrations
```bash
# Create migrations
make migrations

# Apply migrations
make migrate

# Reset migrations (development only)
rm core/apps/accounts/migrations/0*.py
make migrations
make migrate
```

### Database Access
```bash
# Django shell
make shell

# Direct PostgreSQL access
docker-compose exec db psql -U postgres -d infiora
```

## 🧪 Testing

### Test Suite Overview
- **Total Tests**: 88 comprehensive tests
- **Coverage**: Models, serializers, views, authentication
- **Test Types**: Unit, integration, API endpoint testing

### Test Structure
```
core/apps/accounts/tests/
├── test_models.py           # 12 tests - Model functionality
├── test_serializers.py      # 21 tests - Serializer validation
├── test_views.py            # 41 tests - API endpoint testing
└── test_authentication.py   # 14 tests - Auth backend testing
```

### Running Tests
```bash
# All tests with verbose output
make test

# Specific test files
poetry run python -m core.manage test core.apps.accounts.tests.test_models --verbosity=2

# Test with coverage
poetry run python -m core.manage test --verbosity=2 --debug-mode

# Parallel testing (faster)
poetry run python -m core.manage test core.apps.accounts.tests --parallel
```

### Test Categories
1. **Model Tests**: User creation, validation, constraints
2. **Serializer Tests**: Input validation, data transformation
3. **View Tests**: API endpoints, authentication, permissions
4. **Authentication Tests**: Login backends, security features
5. **Security Tests**: Token rotation, blacklisting, edge cases

## ✅ Code Quality

### Pre-commit Hooks
Automatically run on every commit:
- **isort**: Import sorting
- **black**: Code formatting
- **flake8**: Linting and style checks
- **mypy**: Static type checking

### Manual Quality Checks
```bash
# Run all quality checks
make lint

# Individual tools
poetry run isort .
poetry run black .
poetry run flake8
poetry run mypy .
```

### Code Standards
- **PEP 8**: Python style guide compliance
- **Type Hints**: Use type annotations where beneficial
- **Docstrings**: Document classes and complex functions
- **Comments**: Explain business logic, not obvious code
- **Naming**: Clear, descriptive variable and function names

## 🔄 Development Workflows

### Feature Development
1. **Create Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Develop with TDD**:
   ```bash
   # Write tests first
   # Implement feature
   # Run tests
   make test
   ```

3. **Quality Checks**:
   ```bash
   make lint
   ```

4. **Commit with Conventional Commits**:
   ```bash
   git commit -m "feat: add new authentication endpoint"
   git commit -m "fix: resolve token validation issue"
   git commit -m "docs: update API documentation"
   ```

### API Development Process
1. **Design API Schema** in `schemas.py`
2. **Create Serializers** in `serializers.py`
3. **Implement Views** in `views.py`
4. **Add URL Routes** in `urls.py`
5. **Write Tests** in appropriate test file
6. **Update Documentation**

### Database Changes
1. **Modify Models** in `models.py`
2. **Create Migration**: `make migrations`
3. **Review Migration** files
4. **Apply Migration**: `make migrate`
5. **Test Changes**: `make test`

## ⚙️ Environment Configuration

### Settings Structure
- **base.py**: Core Django settings
- **envvars.py**: Environment variable loading
- **rest_framework.py**: DRF and JWT configuration
- **cors.py**: CORS settings
- **docker.py**: Docker-specific overrides

### Environment Variables
```bash
# Core Settings
INFIORA_DEBUG=True/False
INFIORA_SECRET_KEY=your-secret-key
INFIORA_ALLOWED_HOSTS=["host1","host2"]

# Database
INFIORA_DATABASES={"default":{"HOST":"localhost"}}

# Authentication
INFIORA_JWT_ACCESS_TOKEN_LIFETIME=minutes
INFIORA_JWT_REFRESH_TOKEN_LIFETIME=days

# Email
INFIORA_EMAIL_HOST=smtp.example.com
INFIORA_EMAIL_PORT=587
INFIORA_EMAIL_HOST_USER=user@example.com
INFIORA_EMAIL_HOST_PASSWORD=password

# CORS
INFIORA_CORS_ALLOWED_ORIGINS=["http://localhost:3000"]
INFIORA_CSRF_TRUSTED_ORIGINS=["http://localhost:3000"]
```

## 🐛 Debugging

### Development Tools
1. **Django Debug Toolbar**: Enabled in development
2. **Django Shell**: `make shell` for interactive debugging
3. **Logging**: Configured for development visibility

### Common Debugging Commands
```bash
# Check system
poetry run python -m core.manage check

# Show SQL queries
poetry run python -m core.manage shell
>>> from django.db import connection
>>> connection.queries

# Debug migrations
poetry run python -m core.manage showmigrations
poetry run python -m core.manage sqlmigrate accounts 0001
```

### Debugging Authentication Issues
```bash
# Test JWT token
poetry run python -m core.manage shell
>>> from rest_framework_simplejwt.tokens import RefreshToken
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> user = User.objects.first()
>>> token = RefreshToken.for_user(user)
>>> print(token.access_token)
```

## ❗ Common Issues

### 1. Database Connection Issues
```bash
# Check if database is running
docker-compose ps

# Restart database
docker-compose down
make up-dependencies-only
```

### 2. Migration Issues
```bash
# Reset migrations (development only)
rm core/apps/accounts/migrations/0*.py
make migrations
make migrate
```

### 3. Token Issues
```bash
# Check token blacklist
poetry run python -m core.manage shell
>>> from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
>>> BlacklistedToken.objects.all()
```

### 4. CORS Issues
```bash
# Check CORS settings in browser console
# Update INFIORA_CORS_ALLOWED_ORIGINS in .env
```

### 5. Import Issues
```bash
# Check if app is in INSTALLED_APPS
# Verify Python path in settings
```

## 🚀 Deployment

### Production Checklist
- [ ] Set `DEBUG=False`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Set secure `SECRET_KEY`
- [ ] Configure database with SSL
- [ ] Set up email backend
- [ ] Configure static files (S3/CDN)
- [ ] Set up logging
- [ ] Configure CORS properly
- [ ] Run security checks: `python manage.py check --deploy`

### Docker Deployment
```bash
# Build and run
docker-compose up --build -d

# Check logs
docker-compose logs -f

# Run migrations in container
docker-compose exec app poetry run python -m core.manage migrate
```

## 📞 Support

### Getting Help
1. **Check Documentation**: Start with this guide
2. **Review Tests**: Look at test files for usage examples
3. **Check Logs**: Application and container logs
4. **Use Django Shell**: Interactive debugging
5. **Review Settings**: Check environment configuration

### Useful Resources
- **Django Documentation**: https://docs.djangoproject.com/
- **DRF Documentation**: https://www.django-rest-framework.org/
- **JWT Documentation**: https://django-rest-framework-simplejwt.readthedocs.io/
- **Poetry Documentation**: https://python-poetry.org/docs/

---

*This development guide is maintained alongside the codebase. Please update it when making significant changes to the development workflow or architecture.*