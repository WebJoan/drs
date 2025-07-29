FROM nginx:stable-alpine

# Удаляем дефолтную конфигурацию
RUN rm /etc/nginx/conf.d/default.conf

# Копируем дополнительные файлы конфигурации
COPY include.websocket /etc/nginx/app/include.websocket
COPY include.forwarded /etc/nginx/app/include.forwarded

# Копируем ваш файл nginx.conf в конфигурацию Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Создаем папки для сертификатов и acme-challenge
RUN mkdir -p /etc/nginx/certs /var/www/certbot

# Expose ports
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]

