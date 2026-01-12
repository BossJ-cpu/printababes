FROM php:8.2-apache

# Install dependencies
RUN apt-get update && apt-get install -y \
    libzip-dev \
    zip \
    unzip \
    libpng-dev \
    git \
 && docker-php-ext-install pdo_mysql zip gd

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Configure Apache DocumentRoot to point to public
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf
# Explicitly allowing override for the document root
RUN echo "<Directory ${APACHE_DOCUMENT_ROOT}>" >> /etc/apache2/conf-available/laravel.conf \
 && echo "    Options Indexes FollowSymLinks" >> /etc/apache2/conf-available/laravel.conf \
 && echo "    AllowOverride All" >> /etc/apache2/conf-available/laravel.conf \
 && echo "    Require all granted" >> /etc/apache2/conf-available/laravel.conf \
 && echo "</Directory>" >> /etc/apache2/conf-available/laravel.conf \
 && a2enconf laravel

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Configure PHP Upload Limits
COPY uploads.ini /usr/local/etc/php/conf.d/uploads.ini

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY . .

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Create SQLite database file
RUN touch database/database.sqlite
RUN chown -R www-data:www-data /var/www/html/database

# Set permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Configure Apache to listen on Render's PORT
# Render sets the PORT environment variable. We use a startup script to sed it at runtime because 
# Dockerfile ENV vars aren't fully dynamic in the conf file without a script entrypoint usually,
# but using shell syntax in CMD often works. 
# Better: update ports.conf to Listen ${PORT} and let Apache resolve env var.

RUN sed -i 's/Listen 80/Listen ${PORT}/' /etc/apache2/ports.conf
RUN sed -i 's/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/' /etc/apache2/sites-available/000-default.conf

# Initialize environment
RUN cp .env.example .env
# Remove the static key generation during build because Render injects the real APP_KEY at runtime
# RUN php artisan key:generate

# Entrypoint to run migrations and start apache
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
