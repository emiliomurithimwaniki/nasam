#!/usr/bin/env bash
set -e

# Ensure Python outputs everything (no buffering)
export PYTHONUNBUFFERED=1

# Default to production settings
export DJANGO_DEBUG=${DJANGO_DEBUG:-False}

python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Start Gunicorn bound to the port provided by Railway
exec gunicorn core.wsgi:application \
  --bind 0.0.0.0:${PORT:-8000} \
  --workers ${GUNICORN_WORKERS:-3} \
  --timeout ${GUNICORN_TIMEOUT:-60}
