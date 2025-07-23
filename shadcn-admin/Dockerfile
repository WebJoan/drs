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
