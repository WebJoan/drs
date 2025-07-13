#!/bin/bash

set -e

# Загрузка переменных окружения
source .env.prod

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Применение SSL конфигурации NGINX...${NC}"

# Замена переменных в шаблоне и создание конфига
envsubst '${DOMAIN}' < nginx/nginx-ssl.conf.template > nginx/conf.d/default.conf

# Перезагрузка NGINX
docker compose -f docker-compose.prod.yml --env-file .env.prod exec nginx nginx -s reload

echo -e "${GREEN}SSL конфигурация применена!${NC}" 