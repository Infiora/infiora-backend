#!/bin/bash
set -e

# Wait for database
echo "Waiting for PostgreSQL..."
while ! pg_isready -h $DB_HOST -p $DB_PORT; do
  sleep 1
done
echo "PostgreSQL is ready!"

# Run migrations
python src/manage.py migrate

# Collect static files in production
if [ "$DEBUG" = "False" ]; then
    python src/manage.py collectstatic --noinput
fi

# Start server
if [ "$DEBUG" = "True" ]; then
    exec python src/manage.py runserver 0.0.0.0:8000
else
    exec gunicorn --chdir src --bind 0.0.0.0:8000 core.wsgi:application
fi