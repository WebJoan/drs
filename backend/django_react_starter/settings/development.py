from .base import *  # noqa

DEBUG = True
ENVIRONMENT = "development"
APP_VERSION = "v0.0.0"
ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "api",  # Name of the django service in docker-compose.yml, used by frontend
    "jiman.ru"
]
CSRF_TRUSTED_ORIGINS = [
    "https://jiman.ru",
    "http://localhost",
    "http://127.0.0.1",
    "http://localhost:5173",  # React dev server
    "http://localhost:8000/",
]
CORS_ALLOWED_ORIGINS = [
    "https://jiman.ru",
    "http://localhost",
    "http://127.0.0.1",
    "http://localhost:5173",  # React dev server
    "http://localhost:8000",
]
SITE_DOMAIN = "http://localhost:5173"  # React dev server
SECRET_KEY = "yq-^$c^8r-^zebn#n+ilw3zegt9^9!b9@)-sv1abpca3i%hrko"
DJANGO_SUPERUSER_EMAIL = "admin@gmail.com"
DJANGO_SUPERUSER_PASSWORD = "password"
