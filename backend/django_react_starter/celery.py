import os
from celery import Celery
from django.conf import settings
from kombu import Exchange, Queue

# Настройка Django settings перед использованием settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_react_starter.settings.development')

import django
django.setup()

from django_react_starter.settings.base import CELERY_CONFIG_PREFIX

app = Celery("django_react_starter")
app.config_from_object("django.conf:settings", namespace=CELERY_CONFIG_PREFIX)
app.autodiscover_tasks()

app.conf.task_queues = [
    Queue(
        settings.RABBITMQ_USER_QUEUE,
        Exchange(settings.RABBITMQ_USER_QUEUE),
        routing_key=settings.RABBITMQ_USER_QUEUE,
    ),
    Queue(
        settings.RABBITMQ_GOODS_QUEUE,
        Exchange(settings.RABBITMQ_GOODS_QUEUE),
        routing_key=settings.RABBITMQ_GOODS_QUEUE,
    ),
    Queue(
        settings.RABBITMQ_EMAIL_QUEUE,
        Exchange(settings.RABBITMQ_EMAIL_QUEUE),
        routing_key=settings.RABBITMQ_EMAIL_QUEUE,
    ),
    Queue(
        settings.RABBITMQ_CUSTOMER_QUEUE,
        Exchange(settings.RABBITMQ_CUSTOMER_QUEUE),
        routing_key=settings.RABBITMQ_CUSTOMER_QUEUE,
    ),
]

# Импортируем задачи после настройки Django
from user.tasks import scheduled_cron_tasks as user_schedule

app.conf.beat_schedule = {
    **user_schedule,
}

app.conf.timezone = "UTC"
