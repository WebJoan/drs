#!/bin/bash

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Настройка продакшн окружения ===${NC}"

# Запрос параметров у пользователя
read -p "Введите IP адрес сервера: " SERVER_IP
read -p "Введите домен (например, example.com): " DOMAIN
read -p "Введите email для Let's Encrypt: " EMAIL
read -p "Введите название проекта (для контейнеров): " PROJECT_NAME

# Дополнительные параметры БД
read -p "Введите имя пользователя БД [django_user]: " DB_USER
DB_USER=${DB_USER:-django_user}

read -sp "Введите пароль БД: " DB_PASSWORD
echo
read -p "Введите имя БД [django_db]: " DB_NAME
DB_NAME=${DB_NAME:-django_db}

# Генерация SECRET_KEY для Django (без зависимости от Django)
SECRET_KEY=$(python3 -c 'import secrets; import string; print("".join(secrets.choice(string.ascii_letters + string.digits + "!@#$%^&*(-_=+)") for _ in range(50)))')

echo -e "\n${YELLOW}Создание конфигурационных файлов...${NC}"

# Создание .env файла для продакшена
cat > .env.prod <<EOF
# Основные настройки
PROJECT_NAME=${PROJECT_NAME}
DOMAIN=${DOMAIN}
SERVER_IP=${SERVER_IP}
EMAIL=${EMAIL}

# База данных
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
EOF

# Создание .env.prod для backend
cat > backend/.env.prod <<EOF
# Django settings
SECRET_KEY=${SECRET_KEY}
DEBUG=False
ALLOWED_HOSTS=${DOMAIN},${SERVER_IP},localhost

# Database
DATABASE_URL=postgres://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}

# Redis
REDIS_URL=redis://redis:6379/0

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# CORS
CORS_ALLOWED_ORIGINS=https://${DOMAIN}

# CSRF
CSRF_TRUSTED_ORIGINS=https://${DOMAIN}

# Static files
STATIC_ROOT=/home/app/backend/static
MEDIA_ROOT=/home/app/backend/media
EOF

# Создание директорий
mkdir -p nginx/conf.d nginx/ssl certbot/conf certbot/www frontend/dist

# Создание временного nginx конфига для получения сертификата
cat > nginx/conf.d/default.conf <<EOF
server {
    listen 80;
    server_name ${DOMAIN};
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}
EOF

echo -e "${GREEN}Конфигурационные файлы созданы!${NC}"
echo -e "${YELLOW}Для запуска продакшн окружения используйте: make prod.deploy${NC}" 