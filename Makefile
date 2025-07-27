.ONESHELL:
SHELL:= /bin/bash
.PHONY: test

BACKEND_DOCKER_EXEC=@docker exec -it django_react_starter_api
BACKEND_BASH_EXEC=$(BACKEND_DOCKER_EXEC) bash -c
FRONTEND_DOCKER_EXEC=@docker exec -it django_react_starter_front
FRONTEND_BASH_EXEC=$(FRONTEND_DOCKER_EXEC) bash -c

# Args
cmd=
env_file='.env'
opts=

# --------------------------------------------------
# Private
# --------------------------------------------------
_manage_py:
	$(BACKEND_BASH_EXEC) "\
		cd backend && \
		source $(env_file) && \
		python manage.py $(cmd) \
		$(opts)"

# --------------------------------------------------
# Backend
# --------------------------------------------------
backend.bash:
	$(BACKEND_DOCKER_EXEC) bash

backend.index_products:
	@$(MAKE) -s _manage_py cmd=index_products

backend.reindex_products:
	@$(MAKE) -s _manage_py cmd=reindex_products opts="--clear"

backend.makemigrations:
	@$(MAKE) -s _manage_py cmd=makemigrations

backend.migrate:
	@$(MAKE) -s _manage_py cmd=migrate
	@$(MAKE) -s _manage_py cmd=migrate env_file='.env.test'

backend.quality:
	$(BACKEND_BASH_EXEC) "cd backend \
		&& ruff check --select I . \
		&& ruff check . \
		&& ruff format --check . \
		&& ty check . --error-on-warning \

backend.shell:
	@$(MAKE) -s _manage_py cmd=shell

backend.create_currencies:
	@$(MAKE) -s _manage_py cmd=create_currencies	

backend.test:
	@$(MAKE) -s _manage_py cmd=test env_file='.env.test' opts="--parallel"

backend.test.coverage:
	$(BACKEND_BASH_EXEC) "\
		cd backend && \
		source .env.test && \
		coverage run --source='.' manage.py test --parallel && \
		coverage report && \
		coverage html"


# --------------------------------------------------
# Frontend
# --------------------------------------------------
frontend.bash:
	$(FRONTEND_DOCKER_EXEC) bash

frontend.i18n:
	$(FRONTEND_BASH_EXEC) "yarn i18n"

frontend.quality:
	$(FRONTEND_BASH_EXEC) "yarn quality"

frontend.test:
	$(FRONTEND_BASH_EXEC) "yarn test"

frontend.test.coverage:
	$(FRONTEND_BASH_EXEC) "yarn test:coverage"


# --------------------------------------------------
# Docker
# --------------------------------------------------
start:
	@docker compose --profile=all up --build

start.fast:
	@docker compose --profile=all up

start.lite:
	@docker compose --profile=lite up --build

start.lite.fast:
	@docker compose --profile=lite up

stop:
	@docker compose down


# --------------------------------------------------
# Others
# --------------------------------------------------
setup_hooks:
	@git config core.hooksPath .githooks

# Outputs is not aligned in IDE but will be in terminal
help:
	@echo "Usage: make [TARGET]"
	@echo ""
	@echo "----- BACKEND -------------------------------------------------------------------------"
	@echo "backend.bash:				Opens a bash session in the api container"
	@echo "backend.makemigrations:			Generates new migrations based on models"
	@echo "backend.migrate:			Runs the migration"
	@echo "backend.quality:			Runs ruff and ty"
	@echo "backend.shell: 				Opens the Django shell for the running instance"
	@echo "backend.test:				Runs tests"
	@echo "backend.test.coverage:			Runs tests and generates coverage report"
	@echo "----- FRONTEND ------------------------------------------------------------------------"
	@echo "frontend.bash: 				Opens a bash session in the frontend container"
	@echo "frontend.i18n: 				Runs i18n to generate translations"
	@echo "frontend.quality: 			Runs biome, tsc, and translation checks"
	@echo "frontend.test: 				Runs tests"
	@echo "frontend.test.coverage:			Runs tests and generates coverage report"
	@echo "----- DOCKER --------------------------------------------------------------------------"
	@echo "start: 					Starts all containers using docker compose"
	@echo "start.lite: 				Starts only dependencies containers using docker compose"
	@echo "					(postgres, rabbitmq, meilisearch, ...)"
	@echo "stop: 					Stops the containers using docker compose"
	@echo "----- PRODUCTION ----------------------------------------------------------------------"
	@echo "prod.deploy: 				🚀 Полный деплой на продакшн (настройка, SSL, запуск)"
	@echo "prod.setup: 				Интерактивная настройка продакшн окружения"
	@echo "prod.build: 				Сборка продакшн образов"
	@echo "prod.start: 				Запуск продакшн контейнеров"
	@echo "prod.stop: 				Остановка продакшн контейнеров"
	@echo "prod.restart: 				Перезапуск продакшн контейнеров"
	@echo "prod.update: 				Обновление кода и перезапуск"
	@echo "prod.logs: 				Просмотр логов продакшн контейнеров"
	@echo "----- OTHERS --------------------------------------------------------------------------"
	@echo "setup_hooks: 				Setups the git pre-commit hooks"
	@echo "help: 					Prints this help message"

# --------------------------------------------------
# Production
# --------------------------------------------------
prod.setup:
	@chmod +x scripts/setup-prod.sh
	@chmod +x scripts/init-letsencrypt.sh
	@chmod +x scripts/apply-nginx-ssl.sh
	@./scripts/setup-prod.sh

prod.ssl:
	@./scripts/init-letsencrypt.sh
	@./scripts/apply-nginx-ssl.sh

prod.build:
	@docker compose -f docker-compose.prod.yml --env-file .env.prod build

prod.migrate:
	@docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm api python backend/manage.py migrate
	@docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm api python backend/manage.py collectstatic --noinput

prod.start:
	@docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

prod.stop:
	@docker compose -f docker-compose.prod.yml --env-file .env.prod down

prod.logs:
	@docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f

prod.deploy: prod.setup
	@echo "Сборка образов..."
	@$(MAKE) -s prod.build
	@echo "Сборка фронтенда..."
	@docker compose -f docker-compose.prod.yml --env-file .env.prod --profile build up front
	@echo "Запуск базовых сервисов..."
	@docker compose -f docker-compose.prod.yml --env-file .env.prod up -d postgres redis
	@sleep 5
	@echo "Выполнение миграций..."
	@$(MAKE) -s prod.migrate
	@echo "Получение SSL сертификата..."
	@$(MAKE) -s prod.ssl
	@echo "Запуск всех сервисов..."
	@$(MAKE) -s prod.start
	@echo "✅ Деплой завершен! Сайт доступен по адресу: https://$$(grep DOMAIN .env.prod | cut -d '=' -f2)"

prod.restart:
	@$(MAKE) -s prod.stop
	@$(MAKE) -s prod.start

prod.update:
	@git pull
	@$(MAKE) -s prod.build
	@docker compose -f docker-compose.prod.yml --env-file .env.prod --profile build up front
	@$(MAKE) -s prod.migrate
	@$(MAKE) -s prod.restart
