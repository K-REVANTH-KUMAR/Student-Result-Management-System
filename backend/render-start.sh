#!/usr/bin/env bash
set -o errexit
gunicorn --workers 1 --threads 4 --timeout 120 app:app
