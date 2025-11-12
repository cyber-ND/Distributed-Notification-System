# =========================
# PHP Production stage
# =========================
FROM php:8.3-cli-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    mysql-client \
    postgresql-dev \
    linux-headers \
    openssl-dev \
    pcre-dev $PHPIZE_DEPS

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_mysql pdo_pgsql pcntl xml gd sockets

# Install Redis extension
RUN pecl install redis \
    && docker-php-ext-enable redis

# Install Swoole extension
RUN pecl install swoole \
    && docker-php-ext-enable swoole

# Install Composer
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# -------------------------
# Composer dependencies (cacheable)
# -------------------------
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --prefer-dist --no-interaction

# -------------------------
# Copy application code
# -------------------------
COPY . .

# Ensure storage and cache directories exist and are writable
RUN mkdir -p storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

# Expose port for Octane
EXPOSE 8000

# Start Octane with Swoole
CMD ["php", "artisan", "octane:start", "--server=swoole", "--host=0.0.0.0", "--port=8000"]
