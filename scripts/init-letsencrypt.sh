#!/bin/bash

# Скрипт для первоначального получения SSL сертификатов от Let's Encrypt

# Настройки
domains=(jiman.ru)
rsa_key_size=4096
data_path="./data/certbot"
email="admin@jiman.ru" # Замените на ваш email
staging=0 # Установите 1 для тестирования

echo "### Инициализация Let's Encrypt для $domains ..."

if [ -d "$data_path" ]; then
  read -p "Существующие данные найдены для $domains. Продолжить и заменить существующий сертификат? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi

if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  echo "### Загрузка рекомендуемых параметров TLS от Let's Encrypt ..."
  mkdir -p "$data_path/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
  echo
fi

echo "### Подготовка папок для Let's Encrypt ..."
mkdir -p "$data_path/conf/live/$domains"
echo

echo "### Запрос Let's Encrypt сертификата для $domains ..."
#Join $domains to -d args
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

# Выбор между staging и production Let's Encrypt
# Обратите внимание, что у Let's Encrypt есть лимиты скорости - используйте staging для тестов
case "$email" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="--email $email" ;;
esac

if [ $staging != "0" ]; then staging_arg="--staging"; fi

docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $email_arg \
    $domain_args \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal" certbot
echo

echo "### Настройка символических ссылок ..."
./scripts/setup-certs.sh

echo "### Запуск nginx с новыми сертификатами ..."
docker compose up --force-recreate -d nginx

echo "### ✅ Let's Encrypt сертификаты успешно получены и настроены!" 