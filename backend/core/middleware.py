import logging
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class CopilotKitCSRFExemptMiddleware(MiddlewareMixin):
    """
    Middleware для исключения CopilotKit эндпоинтов из CSRF проверки
    """
    
    def process_request(self, request):
        # Список путей, которые должны быть исключены из CSRF проверки
        exempt_paths = [
            '/api/agui/copilotkit/',
            '/api/agui/copilotkit',  # Без trailing slash
            '/api/agui/stream/',
            '/api/agui/',
            '/api/agui/csrf-token/',
            '/agui/',  # Добавляем все возможные варианты
        ]
        
        # Проверяем, попадает ли текущий путь в список исключений
        for path in exempt_paths:
            if request.path.startswith(path):
                # Логируем для отладки
                logger.info(f"CSRF exempt for CopilotKit path: {request.path}")
                logger.info(f"Request method: {request.method}")
                logger.info(f"Origin: {request.META.get('HTTP_ORIGIN', 'No origin')}")
                logger.info(f"Request headers: {dict(request.headers)}")
                
                # Помечаем запрос как освобожденный от CSRF проверки
                setattr(request, '_dont_enforce_csrf_checks', True)
                
                # Для cross-origin запросов также устанавливаем флаг для CORS
                if request.META.get('HTTP_ORIGIN'):
                    setattr(request, '_copilotkit_cors_request', True)
                
                break
        
        return None