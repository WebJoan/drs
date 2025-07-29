#!/bin/bash

# Скрипт для обновления SSL сертификатов Let's Encrypt

echo "### Обновление Let's Encrypt сертификатов ..."

# Обновляем сертификаты
docker compose run --rm certbot renew

# Перезапускаем nginx для применения новых сертификатов
echo "### Перезапуск nginx для применения новых сертификатов ..."
docker compose exec nginx nginx -s reload

echo "### Обновление сертификатов завершено!" 