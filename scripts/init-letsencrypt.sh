#!/bin/bash

set -e

# Загрузка переменных окружения
source .env.prod

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== Инициализация Let's Encrypt ===${NC}"

# Путь к данным
data_path="./certbot"
rsa_key_size=4096

# Проверка существования сертификата
if [ -d "$data_path/conf/live/$DOMAIN" ]; then
  echo -e "${YELLOW}Сертификат для $DOMAIN уже существует. Пропускаем...${NC}"
  exit 0
fi

# Создание директорий
echo -e "${YELLOW}Создание директорий...${NC}"
mkdir -p "$data_path/conf" "$data_path/www"

# Загрузка рекомендуемых TLS параметров
echo -e "${YELLOW}Загрузка рекомендуемых TLS параметров...${NC}"
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"

# Создание временного самоподписанного сертификата
echo -e "${YELLOW}Создание временного сертификата...${NC}"
path="/etc/letsencrypt/live/$DOMAIN"
mkdir -p "$data_path/conf/live/$DOMAIN"

docker run --rm \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  --entrypoint openssl certbot/certbot \
  req -x509 -nodes -newkey rsa:$rsa_key_size -days 1 \
  -keyout "$path/privkey.pem" \
  -out "$path/fullchain.pem" \
  -subj "/CN=$DOMAIN"

# Запуск nginx
echo -e "${YELLOW}Запуск nginx...${NC}"
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d nginx

# Удаление временного сертификата
echo -e "${YELLOW}Удаление временного сертификата...${NC}"
docker run --rm \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  --entrypoint rm certbot/certbot \
  -rf /etc/letsencrypt/live/$DOMAIN

# Запрос сертификата Let's Encrypt
echo -e "${GREEN}Запрос сертификата Let's Encrypt...${NC}"
docker run --rm \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  certbot/certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  --force-renewal \
  -d $DOMAIN

# Перезагрузка nginx с новым сертификатом
echo -e "${YELLOW}Перезагрузка nginx...${NC}"
docker compose -f docker-compose.prod.yml --env-file .env.prod exec nginx nginx -s reload

echo -e "${GREEN}SSL сертификат успешно получен!${NC}" 