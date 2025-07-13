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
