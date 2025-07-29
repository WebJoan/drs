#!/bin/bash

# Скрипт для настройки символических ссылок на SSL сертификаты Let's Encrypt

DOMAIN="jiman.ru"
NGINX_CERTS_DIR="./nginx/certs"
LETSENCRYPT_LIVE_DIR="./data/certbot/conf/live/$DOMAIN"

echo "### Настройка SSL сертификатов Let's Encrypt ..."

# Создаем папку если не существует
mkdir -p "$NGINX_CERTS_DIR"

# Удаляем старые ссылки если есть
rm -f "$NGINX_CERTS_DIR/fullchain.pem"
rm -f "$NGINX_CERTS_DIR/privkey.pem"

# Проверяем есть ли Let's Encrypt сертификаты
if [ -f "$LETSENCRYPT_LIVE_DIR/fullchain.pem" ] && [ -f "$LETSENCRYPT_LIVE_DIR/privkey.pem" ]; then
    echo "### Найдены Let's Encrypt сертификаты, создаем ссылки ..."
    # Создаем ссылки с путями, которые работают внутри nginx контейнера
    # В контейнере nginx: /etc/nginx/certs -> ./nginx/certs и /etc/letsencrypt -> ./data/certbot/conf
    # Из /etc/nginx/certs нужно подняться на 2 уровня вверх: ../../letsencrypt
    ln -sf "../../letsencrypt/live/$DOMAIN/fullchain.pem" "$NGINX_CERTS_DIR/fullchain.pem"
    ln -sf "../../letsencrypt/live/$DOMAIN/privkey.pem" "$NGINX_CERTS_DIR/privkey.pem"
    echo "### Let's Encrypt сертификаты настроены успешно"
else
    echo "❌ ОШИБКА: Let's Encrypt сертификаты не найдены!"
    echo "Для получения сертификатов выполните: make init.letsencrypt"
    echo "Или убедитесь что домен jiman.ru указывает на ваш сервер"
    exit 1
fi

echo "### Настройка сертификатов завершена!" 