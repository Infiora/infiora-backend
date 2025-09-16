# Requirements Structure

This directory contains environment-specific Python package requirements.

## Files

### `base.txt`
Core dependencies required for all environments:
- Django framework and database drivers
- Configuration management
- Security and CORS handling
- Monitoring and performance tools

### `prod.txt`
Production-specific dependencies:
- Includes all base requirements (`-r base.txt`)
- Gunicorn WSGI server for production
- AWS S3 storage integration

### `dev.txt`
Development-specific dependencies:
- Includes all base requirements (`-r base.txt`)
- Development and debugging tools (commented out, uncomment as needed)
- Testing frameworks (commented out, uncomment as needed)
- Code quality tools (commented out, uncomment as needed)

## Usage

### Production
```bash
pip install -r requirements/prod.txt
```

### Development
```bash
pip install -r requirements/dev.txt
```

### Base only
```bash
pip install -r requirements/base.txt
```

## Adding New Dependencies

1. **For all environments**: Add to `base.txt`
2. **Production only**: Add to `prod.txt`
3. **Development only**: Add to `dev.txt`

Always pin versions for reproducible builds.