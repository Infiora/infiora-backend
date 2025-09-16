# Code Quality Setup

This project uses a comprehensive code quality setup to maintain high standards for code consistency, security, and reliability.

## Tools Included

### 🖤 Black - Code Formatting
- Automatically formats Python code to a consistent style
- Line length: 88 characters
- Configuration: `pyproject.toml`

### 🔢 isort - Import Sorting
- Automatically sorts and organizes imports
- Compatible with Black formatting
- Django-aware import organization

### 🔍 Flake8 - Linting
- Checks for Python syntax errors and style violations
- Includes Django-specific checks
- Docstring validation
- Configuration: `.flake8`

### 🔒 Bandit - Security Scanning
- Scans for common security issues in Python code
- Excludes test files and migrations
- Generates JSON reports for CI/CD

### 🏷️ MyPy - Type Checking
- Static type checking for Python
- Django stub support
- Excludes migration files

### 🧪 Pytest - Testing Framework
- Unit testing with coverage reporting
- Django test integration
- Coverage threshold: 80%

## Installation and Setup

### 1. Install Development Dependencies
```bash
pip install -r requirements/dev.txt
```

### 2. Install Pre-commit Hooks
```bash
pre-commit install
```

### 3. Run Initial Check
```bash
pre-commit run --all-files
```

## Usage

### Manual Code Quality Checks

#### Format Code
```bash
# Check formatting
black --check src/

# Apply formatting
black src/
```

#### Sort Imports
```bash
# Check import sorting
isort --check-only src/

# Apply import sorting
isort src/
```

#### Linting
```bash
flake8 src/
```

#### Security Check
```bash
bandit -r src/
```

#### Type Checking
```bash
mypy src/
```

#### Run Tests
```bash
cd src
pytest --cov=. --cov-report=html
```

### Automated Checks

#### Pre-commit Hooks
- Automatically run on every commit
- Prevents commits with quality issues
- Can be bypassed with `git commit --no-verify` (not recommended)

#### GitHub Actions
- Runs on every push and pull request
- Code Quality workflow includes all tools
- Generates coverage reports and security artifacts

## Configuration Files

- `pyproject.toml` - Black, isort, pytest, mypy, bandit configuration
- `.flake8` - Flake8 linting rules
- `.pre-commit-config.yaml` - Pre-commit hook configuration
- `.github/workflows/code-quality.yml` - CI/CD quality checks

## IDE Integration

### VS Code
Install these extensions for better integration:
- Python (Microsoft)
- Black Formatter
- isort
- Flake8
- MyPy Type Checker

### PyCharm
- Enable Black as external tool
- Configure isort in code style settings
- Enable Flake8 inspection
- Configure MyPy as external tool

## Quality Standards

### Code Coverage
- Minimum coverage: 80%
- Run `pytest --cov=. --cov-report=html` to generate coverage report
- View report in `htmlcov/index.html`

### Code Style
- Follow PEP 8 with Black modifications
- Line length: 88 characters
- Use Google-style docstrings
- Type hints encouraged for public APIs

### Security
- No hardcoded secrets or credentials
- Use environment variables for configuration
- Regular security scanning with Bandit

## Troubleshooting

### Common Issues

#### Pre-commit Hook Failures
```bash
# Update hook versions
pre-commit autoupdate

# Run specific hook
pre-commit run black --all-files
```

#### Import Sorting Conflicts
```bash
# Check isort configuration
isort --show-diff src/

# Apply isort with Black profile
isort --profile black src/
```

#### Type Checking Errors
```bash
# Install missing type stubs
pip install types-requests types-pyyaml

# Check specific file
mypy src/core/views.py
```

### Disabling Checks (Use Sparingly)

#### Flake8
```python
# noqa: E501  # Line too long
def long_function_name():  # noqa: E501
    pass
```

#### MyPy
```python
# type: ignore
variable = some_untyped_function()  # type: ignore
```

#### Bandit
```python
# nosec B101
password = "hardcoded"  # nosec B101
```

## Contributing

1. Install development dependencies
2. Set up pre-commit hooks
3. Write tests for new features
4. Ensure all quality checks pass
5. Maintain or improve code coverage

For questions about code quality setup, check the configuration files or create an issue.