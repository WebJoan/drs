import logging
import os
from datetime import datetime
from io import BytesIO
import mysql.connector
from celery import shared_task
from django.db import transaction
from mysql.connector import Error
from django.conf import settings
from customer.models import Company

logger = logging.getLogger(__name__)

mysql_config = {
    "host": os.getenv("MYSQL_HOST"),
    "port": os.getenv("MYSQL_PORT"),
    "user": os.getenv("MYSQL_USER"),
    "password": os.getenv("MYSQL_PASS"),
    "database": os.getenv("MYSQL_DB"),
    "charset": os.getenv("MYSQL_CHARSET"),
}


@shared_task(queue=settings.RABBITMQ_GOODS_QUEUE)
def update_clients_from_mysql():
    """
    Celery-задача для обновления клиентов в локальной базе из удалённой MySQL.
    """
    connection = None
    try:
        connection = mysql.connector.connect(**mysql_config)
        if connection.is_connected():
            cursor = connection.cursor(dictionary=True)
            cursor.execute("SELECT id, kontr1, shortname, inn, adrec, adrec1, telefon, www, email, www1, Email1 FROM kontr WHERE mgroup IN (0, 1, 3)")
            remote_clients = cursor.fetchall()
        else:
            logger.error("MySQL-соединение не установлено")
            return
    except Error as e:
        logger.error(f"Ошибка при подключении к MySQL: {e}")
        return
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

    # Обновляем или создаем клиентов в Django
    with transaction.atomic():
        for client in remote_clients:
            Company.objects.update_or_create(
                ext_id=client["id"], defaults={
                    "name": client["kontr1"],
                    "company_type": Company.CompanyTypeChoices.NOT_DEFINED,
                    "short_name": client["shortname"],
                    "inn": client["inn"],
                    "legal_address": client["adrec"],
                    "actual_address": client["adrec1"],
                    "phone": client["telefon"],
                    "website": client["www"] if client["www"] else client["www1"],
                    "email": client["email"] if client["email"] else client["Email1"],}
            )

    return f"Обновлено {len(remote_clients)} клиентов"