#!/bin/bash
set -e

# Debug: Check current directory and contents
echo "Current working directory: $(pwd)"
echo "Contents of /app:"
ls -la /app/
echo "Contents of /app/src (if exists):"
ls -la /app/src/ || echo "src directory not found"

# Wait for database
echo "Waiting for PostgreSQL..."
while ! pg_isready -h $DB_HOST -p $DB_PORT; do
  sleep 1
done
echo "PostgreSQL is ready!"

# Check if manage.py exists in src directory
if [ -f "/app/src/manage.py" ]; then
    MANAGE_PATH="src/manage.py"
    DJANGO_DIR="src"
elif [ -f "/app/manage.py" ]; then
    MANAGE_PATH="manage.py"
    DJANGO_DIR="."
else
    echo "Error: manage.py not found!"
    exit 1
fi

echo "Using manage.py at: $MANAGE_PATH"

# Run migrations
python $MANAGE_PATH migrate

# Collect static files in production
if [ "$DEBUG" = "False" ]; then
    echo "DEBUG: Checking AWS S3 configuration..."
    echo "AWS_ACCESS_KEY_ID: '${AWS_ACCESS_KEY_ID:-UNSET}'"
    echo "AWS_SECRET_ACCESS_KEY: '${AWS_SECRET_ACCESS_KEY:-UNSET}'"
    echo "AWS_STORAGE_BUCKET_NAME: '${AWS_STORAGE_BUCKET_NAME:-UNSET}'"

    # Temporarily skip collectstatic to get app running - will fix static files later
    echo "⚠️  Temporarily skipping collectstatic to get Django running..."
    echo "Static files will be served from Django's built-in admin/auth static files"
    mkdir -p /app/staticfiles

    # TODO: Re-enable this once we fix the STATIC_ROOT vs S3 configuration issue
    # python $MANAGE_PATH collectstatic --noinput
fi

# Start server
if [ "$DEBUG" = "True" ]; then
    exec python $MANAGE_PATH runserver 0.0.0.0:8000
else
    exec gunicorn --chdir $DJANGO_DIR --bind 0.0.0.0:8000 core.wsgi:application
fi