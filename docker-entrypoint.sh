#!/bin/bash
set -e

# Run migrations (force for production)
php artisan migrate --force
php artisan storage:link

# Start Apache
exec apache2-foreground
