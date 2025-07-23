from django.apps import AppConfig


class RfqConfig(AppConfig):
    name = "rfq"
    default_auto_field = "django.db.models.BigAutoField"
    
    def ready(self):
        """Инициализация приложения"""
        from django.conf import settings
        
        if settings.ENVIRONMENT == "test":
            return
            
        # Создаем валюты по умолчанию
        try:
            from .utils import create_default_currencies
            create_default_currencies()
        except Exception:
            # Игнорируем ошибки при миграциях
            pass
