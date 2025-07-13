#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Production Setup для Django React Starter ===${NC}"
echo ""

# Проверка наличия необходимых файлов
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}Ошибка: docker-compose.prod.yml не найден!${NC}"
    exit 1
fi

# Запрос домена
echo -e "${YELLOW}Введите ваш домен (например: example.com):${NC}"
read -p "Домен: " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Ошибка: Домен не может быть пустым!${NC}"
    exit 1
fi

# Запрос IP адреса сервера
echo -e "${YELLOW}Введите IP адрес вашего сервера:${NC}"
read -p "IP: " SERVER_IP

if [ -z "$SERVER_IP" ]; then
    echo -e "${RED}Ошибка: IP адрес не может быть пустым!${NC}"
    exit 1
fi

# Запрос email для Let's Encrypt
echo -e "${YELLOW}Введите email для Let's Encrypt (для уведомлений о сертификатах):${NC}"
read -p "Email: " CF_API_EMAIL

if [ -z "$CF_API_EMAIL" ]; then
    echo -e "${RED}Ошибка: Email не может быть пустым!${NC}"
    exit 1
fi

# Опциональные настройки Cloudflare
echo -e "${YELLOW}Используете ли вы Cloudflare для DNS? (y/n):${NC}"
read -p "Cloudflare: " USE_CLOUDFLARE

if [ "$USE_CLOUDFLARE" = "y" ] || [ "$USE_CLOUDFLARE" = "Y" ]; then
    echo -e "${YELLOW}Введите Cloudflare API Token:${NC}"
    read -s -p "API Token: " CF_DNS_API_TOKEN
    echo ""
else
    CF_DNS_API_TOKEN=""
fi

# Генерация паролей
echo -e "${GREEN}Генерация безопасных паролей...${NC}"
POSTGRES_PASSWORD=$(openssl rand -base64 32)
RABBITMQ_PASSWORD=$(openssl rand -base64 32)
MEILI_MASTER_KEY=$(openssl rand -base64 32)
DJANGO_SECRET_KEY=$(openssl rand -base64 50)

# Генерация пользователя и пароля для Traefik Dashboard
TRAEFIK_USER="admin"
TRAEFIK_PASSWORD_PLAIN=$(openssl rand -base64 12)
# Генерация htpasswd для Traefik (требуется apache2-utils)
if command -v htpasswd &> /dev/null; then
    TRAEFIK_PASSWORD=$(htpasswd -nb $TRAEFIK_USER $TRAEFIK_PASSWORD_PLAIN | sed -e s/\\$/\\$\\$/g)
else
    echo -e "${YELLOW}htpasswd не найден. Устанавливаю apache2-utils...${NC}"
    sudo apt-get update && sudo apt-get install -y apache2-utils
    TRAEFIK_PASSWORD=$(htpasswd -nb $TRAEFIK_USER $TRAEFIK_PASSWORD_PLAIN | sed -e s/\\$/\\$\\$/g)
fi

# Создание .env.prod файла
echo -e "${GREEN}Создание .env.prod файла...${NC}"
cat > .env.prod << EOF
# Domain Configuration
DOMAIN=$DOMAIN
SERVER_IP=$SERVER_IP

# Let's Encrypt / Cloudflare
CF_API_EMAIL=$CF_API_EMAIL
CF_DNS_API_TOKEN=$CF_DNS_API_TOKEN

# Traefik Dashboard
TRAEFIK_USER=$TRAEFIK_USER
TRAEFIK_PASSWORD=$TRAEFIK_PASSWORD

# Database
POSTGRES_USER=django_react_starter
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=django_react_starter_prod

# RabbitMQ
RABBITMQ_USER=django_react_starter
RABBITMQ_PASSWORD=$RABBITMQ_PASSWORD

# Meilisearch
MEILI_MASTER_KEY=$MEILI_MASTER_KEY

# Django
DJANGO_SECRET_KEY=$DJANGO_SECRET_KEY
EOF

# Создание backend/.env.prod
echo -e "${GREEN}Создание backend/.env.prod файла...${NC}"
cat > backend/.env.prod << EOF
# Django Settings
DEBUG=False
SECRET_KEY=$DJANGO_SECRET_KEY
ALLOWED_HOSTS=$DOMAIN,www.$DOMAIN,$SERVER_IP

# Database
DATABASE_URL=postgres://django_react_starter:$POSTGRES_PASSWORD@postgres:5432/django_react_starter_prod

# RabbitMQ
RABBITMQ_URL=amqp://django_react_starter:$RABBITMQ_PASSWORD@rabbitmq:5672//

# Meilisearch
MEILISEARCH_HOST=http://meilisearch:7700
MEILISEARCH_API_KEY=$MEILI_MASTER_KEY

# CORS
CORS_ALLOWED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_BROWSER_XSS_FILTER=True
SECURE_CONTENT_TYPE_NOSNIFF=True
X_FRAME_OPTIONS=DENY

# Static/Media
STATIC_URL=/static/
STATIC_ROOT=/home/app/backend/static
MEDIA_URL=/media/
MEDIA_ROOT=/home/app/backend/media
EOF

# Создание Dockerfile для frontend
echo -e "${GREEN}Создание Dockerfile для frontend...${NC}"
cat > shadcn-admin/Dockerfile << 'EOF'
# Build stage
FROM node:22.14.0-slim AS builder

WORKDIR /app

# Копируем package.json и lock файлы
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Устанавливаем pnpm и зависимости
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Копируем исходный код
COPY . .

# Build аргументы
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Сборка приложения
RUN pnpm run build

# Production stage
FROM nginx:alpine

# Копируем собранное приложение
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF

# Создание nginx.conf для frontend
echo -e "${GREEN}Создание nginx.conf для frontend...${NC}"
cat > shadcn-admin/nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

# Создание acme.json с правильными правами
echo -e "${GREEN}Создание acme.json для сертификатов...${NC}"
touch traefik-data/acme.json
chmod 600 traefik-data/acme.json

# Создание скрипта для деплоя
echo -e "${GREEN}Создание deploy.sh скрипта...${NC}"
cat > scripts/deploy.sh << 'EOF'
#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== Деплой Production ===${NC}"

# Загрузка переменных окружения
if [ -f ".env.prod" ]; then
    export $(cat .env.prod | grep -v '^#' | xargs)
else
    echo -e "${RED}Ошибка: .env.prod не найден! Запустите сначала setup-prod.sh${NC}"
    exit 1
fi

# Остановка старых контейнеров
echo -e "${YELLOW}Остановка старых контейнеров...${NC}"
docker-compose -f docker-compose.prod.yml down

# Сборка и запуск
echo -e "${YELLOW}Сборка и запуск контейнеров...${NC}"
docker-compose -f docker-compose.prod.yml up -d --build

# Ожидание запуска
echo -e "${YELLOW}Ожидание запуска сервисов...${NC}"
sleep 10

# Миграции
echo -e "${YELLOW}Выполнение миграций...${NC}"
docker exec django_react_starter_api_prod bash -c "cd backend && python manage.py migrate"

# Сбор статики
echo -e "${YELLOW}Сбор статических файлов...${NC}"
docker exec django_react_starter_api_prod bash -c "cd backend && python manage.py collectstatic --noinput"

# Создание суперпользователя
echo -e "${YELLOW}Создать суперпользователя Django? (y/n):${NC}"
read -p "Ответ: " CREATE_SUPERUSER

if [ "$CREATE_SUPERUSER" = "y" ] || [ "$CREATE_SUPERUSER" = "Y" ]; then
    docker exec -it django_react_starter_api_prod bash -c "cd backend && python manage.py createsuperuser"
fi

echo -e "${GREEN}=== Деплой завершен! ===${NC}"
echo ""
echo -e "${GREEN}Ваше приложение доступно по адресу: https://$DOMAIN${NC}"
echo -e "${GREEN}Traefik Dashboard: https://traefik.$DOMAIN${NC}"
echo -e "${YELLOW}Логин для Traefik: admin${NC}"
echo -e "${YELLOW}Пароль для Traefik сохранен в .env.prod${NC}"
EOF

chmod +x scripts/deploy.sh

# Вывод информации
echo -e "${GREEN}=== Настройка завершена! ===${NC}"
echo ""
echo -e "${YELLOW}Сохраненные настройки:${NC}"
echo "Домен: $DOMAIN"
echo "IP сервера: $SERVER_IP"
echo "Email: $CF_API_EMAIL"
echo ""
echo -e "${YELLOW}Traefik Dashboard:${NC}"
echo "URL: https://traefik.$DOMAIN"
echo "Логин: $TRAEFIK_USER"
echo "Пароль: $TRAEFIK_PASSWORD_PLAIN"
echo ""
echo -e "${GREEN}Следующие шаги:${NC}"
echo "1. Настройте DNS записи для $DOMAIN и *.${DOMAIN} на IP $SERVER_IP"
echo "2. Скопируйте файлы на сервер"
echo "3. Запустите: ${YELLOW}bash scripts/deploy.sh${NC}"
echo ""
echo -e "${RED}ВАЖНО: Сохраните пароли из .env.prod в безопасном месте!${NC}" 