import json
import logging
from django.http import HttpRequest, HttpResponse, JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import time

try:
    import agui_agent
    agui_app = agui_agent.agui_app
    app = agui_agent.app
    AGUI_AVAILABLE = True
except ImportError as e:
    logging.error(f"AG-UI агент недоступен: {e}")
    AGUI_AVAILABLE = False
    agui_app = None
    app = None

logger = logging.getLogger(__name__)

@ensure_csrf_cookie
@require_http_methods(["GET", "OPTIONS"])
def get_csrf_token(request):
    """
    Эндпоинт для получения CSRF токена для CopilotKit
    """
    # Определяем разрешенный origin
    allow_origin = get_allowed_origin(request)
    
    # Обработка CORS preflight запроса
    if request.method == "OPTIONS":
        response = JsonResponse({})
        response["Access-Control-Allow-Origin"] = allow_origin
        response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, X-CSRFToken"
        response["Access-Control-Max-Age"] = "3600"
        response["Access-Control-Allow-Credentials"] = "true"
        return response
    
    # Получаем CSRF токен
    csrf_token = get_token(request)
    
    response = JsonResponse({
        'csrfToken': csrf_token,
        'message': 'CSRF токен успешно получен'
    })
    
    # Устанавливаем CORS заголовки
    response["Access-Control-Allow-Origin"] = allow_origin
    response["Access-Control-Allow-Credentials"] = "true"
    
    return response

def get_allowed_origin(request):
    """
    Определяет разрешенный origin для CORS заголовков
    """
    origin = request.META.get('HTTP_ORIGIN', '')
    allowed_origins = [
        'https://jiman.ru', 
        'http://localhost:3000', 
        'http://localhost:3001', 
        'http://127.0.0.1:3000', 
        'http://127.0.0.1:3001',
        'http://localhost:5173',  # Vite dev server
        'http://127.0.0.1:5173'   # Vite dev server
    ]
    
    # Проверяем, разрешен ли origin
    if origin in allowed_origins or origin.startswith('http://localhost:') or origin.startswith('http://127.0.0.1:'):
        return origin
    else:
        return "https://jiman.ru"

@csrf_exempt
@require_http_methods(["GET", "POST", "OPTIONS"])
def agui_endpoint(request: HttpRequest) -> HttpResponse:
    """
    Endpoint для AG-UI интеграции с CopilotKit
    """
    # Обработка CORS preflight запросов
    if request.method == "OPTIONS":
        response = HttpResponse()
        response["Access-Control-Allow-Origin"] = get_allowed_origin(request)
        response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, x-copilotkit-runtime-client-gql-version, x-copilotkit-frontend-version, x-csrftoken"
        response["Access-Control-Allow-Credentials"] = "true"
        return response
    
    if not AGUI_AVAILABLE:
        return JsonResponse({
            "error": "AG-UI агент недоступен",
            "message": "Проверьте конфигурацию OPENROUTER_API_KEY"
        }, status=500)
    
    try:
        if request.method == "GET":
            # Информация о агенте
            return JsonResponse({
                "agent_id": "sales_agent",
                "name": "Sales Assistant AG-UI",
                "status": "ready",
                "description": "AI помощник по продажам и маркетингу"
            })
        
        elif request.method == "POST":
            # Проксируем запрос к AG-UI приложению
            if not app:
                return JsonResponse({
                    "error": "AG-UI приложение не инициализировано"
                }, status=500)
            
            # Получаем данные из запроса
            try:
                request_data = json.loads(request.body.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError):
                return JsonResponse({
                    "error": "Неверный формат JSON в запросе"
                }, status=400)
            
            # Логируем запрос для отладки
            logger.info(f"AG-UI request data: {request_data}")
            
            # Здесь должна быть логика обработки запроса через AG-UI
            # Пока возвращаем базовый ответ
            return JsonResponse({
                "success": True,
                "message": "AG-UI endpoint работает",
                "request_received": request_data
            })
            
    except Exception as e:
        logger.error(f"Ошибка в AG-UI endpoint: {str(e)}")
        return JsonResponse({
            "error": "Внутренняя ошибка сервера",
            "message": str(e)
        }, status=500)
    
    # Добавляем CORS заголовки ко всем ответам
    response = JsonResponse({"error": "Метод не поддерживается"}, status=405)
    response["Access-Control-Allow-Origin"] = get_allowed_origin(request)
    return response

@api_view(['GET', 'POST', 'OPTIONS'])
@permission_classes([AllowAny])
def agui_api_endpoint(request):
    """
    DRF API endpoint для AG-UI интеграции
    """
    # Определяем разрешенный origin
    allow_origin = get_allowed_origin(request)
    
    # Обработка CORS preflight запроса
    if request.method == "OPTIONS":
        response = Response(status=status.HTTP_200_OK)
        response["Access-Control-Allow-Origin"] = allow_origin
        response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, x-copilotkit-runtime-client-gql-version, x-copilotkit-frontend-version"
        response["Access-Control-Max-Age"] = "3600"
        response["Access-Control-Allow-Credentials"] = "true"
        return response
    
    if not AGUI_AVAILABLE:
        response = Response({
            "error": "AG-UI агент недоступен",
            "message": "Проверьте конфигурацию OPENROUTER_API_KEY"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        response["Access-Control-Allow-Origin"] = allow_origin
        return response
    
    try:
        if request.method == "GET":
            # Информация о агенте
            response = Response({
                "agent_id": "sales_agent",
                "name": "Sales Assistant AG-UI",
                "status": "ready",
                "description": "AI помощник по продажам и маркетингу",
                "capabilities": [
                    "Создание персонализированных email кампаний",
                    "Анализ данных о продажах",
                    "Консультирование по CRM",
                    "Маркетинговые стратегии"
                ]
            })
            response["Access-Control-Allow-Origin"] = allow_origin
            return response
        
        elif request.method == "POST":
            # Обработка запроса от CopilotKit
            request_data = request.data
            
            # Логируем запрос для отладки
            logger.info(f"AG-UI API request data: {request_data}")
            
            # Извлекаем сообщение пользователя
            message = request_data.get('message', '')
            conversation_id = request_data.get('conversation_id', '')
            
            if not message:
                response = Response({
                    "error": "Сообщение не может быть пустым"
                }, status=status.HTTP_400_BAD_REQUEST)
                response["Access-Control-Allow-Origin"] = allow_origin
                return response
            
            # Используем реального агента для генерации ответа
            try:
                # Используем уже созданный глобальный экземпляр агента
                if agui_app and hasattr(agui_app, 'agent'):
                    agent = agui_app.agent
                else:
                    # Fallback: создаем новый агент если глобальный недоступен
                    agent = agui_agent.create_agno_agent()
                
                # Генерируем ответ через агента
                agent_response = agent.run(message)
                
                # Извлекаем текст ответа
                if hasattr(agent_response, 'content'):
                    response_text = agent_response.content
                elif isinstance(agent_response, str):
                    response_text = agent_response
                else:
                    response_text = str(agent_response)
                
                logger.info(f"Agent response: {response_text}")
                
                response = Response({
                    "success": True,
                    "response": response_text,
                    "conversation_id": conversation_id,
                    "agent_id": "sales_agent"
                })
                response["Access-Control-Allow-Origin"] = allow_origin
                return response
                
            except Exception as agent_error:
                logger.error(f"Ошибка при работе с агентом: {str(agent_error)}")
                response = Response({
                    "error": "Ошибка при генерации ответа агентом",
                    "message": str(agent_error)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                response["Access-Control-Allow-Origin"] = allow_origin
                return response
            
    except Exception as e:
        logger.error(f"Ошибка в AG-UI API endpoint: {str(e)}")
        response = Response({
            "error": "Внутренняя ошибка сервера",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        response["Access-Control-Allow-Origin"] = allow_origin
        return response

@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def agui_stream_endpoint(request: HttpRequest) -> StreamingHttpResponse:
    """
    Streaming endpoint для AG-UI интеграции с поддержкой Server-Sent Events
    """
    # Обработка CORS preflight запросов
    if request.method == "OPTIONS":
        response = HttpResponse()
        response["Access-Control-Allow-Origin"] = get_allowed_origin(request)
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, x-copilotkit-runtime-client-gql-version, x-copilotkit-frontend-version, x-csrftoken"
        response["Access-Control-Allow-Credentials"] = "true"
        return response
    
    if not AGUI_AVAILABLE:
        def error_generator():
            yield f"data: {json.dumps({'error': 'AG-UI агент недоступен'})}\n\n"
        
        response = StreamingHttpResponse(error_generator(), content_type='text/event-stream')
        response["Access-Control-Allow-Origin"] = get_allowed_origin(request)
        response["Cache-Control"] = "no-cache"
        return response
    
    try:
        # Получаем данные из запроса
        try:
            request_data = json.loads(request.body.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            def error_generator():
                yield f"data: {json.dumps({'error': 'Неверный формат JSON в запросе'})}\n\n"
            
            response = StreamingHttpResponse(error_generator(), content_type='text/event-stream')
            response["Access-Control-Allow-Origin"] = get_allowed_origin(request)
            return response
        
        message = request_data.get('message', '')
        conversation_id = request_data.get('conversation_id', '')
        
        if not message:
            def error_generator():
                yield f"data: {json.dumps({'error': 'Сообщение не может быть пустым'})}\n\n"
            
            response = StreamingHttpResponse(error_generator(), content_type='text/event-stream')
            response["Access-Control-Allow-Origin"] = get_allowed_origin(request)
            return response
        
        def stream_response():
            try:
                # Используем уже созданный глобальный экземпляр агента
                if agui_app and hasattr(agui_app, 'agent'):
                    agent = agui_app.agent
                else:
                    agent = agui_agent.create_agno_agent()
                
                logger.info(f"Streaming request: {message}")
                
                # Получаем полный ответ от агента
                full_response = agent.run(message)
                
                # Извлекаем текст ответа
                if hasattr(full_response, 'content'):
                    response_text = full_response.content
                elif isinstance(full_response, str):
                    response_text = full_response
                else:
                    response_text = str(full_response)
                
                logger.info(f"Agent response: {response_text}")
                
                # Эмулируем эффект печатания, разбивая по словам
                words = response_text.split(' ')
                
                for i, word in enumerate(words):
                    # Добавляем пробел после каждого слова (кроме последнего)
                    content = word + (' ' if i < len(words) - 1 else '')
                    yield f"data: {json.dumps({'content': content, 'type': 'chunk'})}\n\n"
                    time.sleep(0.08)  # Задержка между словами для эффекта печатания
                
                # Отправляем сигнал окончания
                yield f"data: {json.dumps({'type': 'done', 'conversation_id': conversation_id})}\n\n"
                
            except Exception as e:
                logger.error(f"Ошибка при стриминге: {str(e)}")
                yield f"data: {json.dumps({'error': f'Ошибка при генерации ответа: {str(e)}'})}\n\n"
        
        response = StreamingHttpResponse(stream_response(), content_type='text/event-stream')
        response["Access-Control-Allow-Origin"] = get_allowed_origin(request)
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"  # Отключаем буферизацию nginx
        return response
        
    except Exception as e:
        logger.error(f"Ошибка в streaming endpoint: {str(e)}")
        
        def error_generator():
            yield f"data: {json.dumps({'error': f'Внутренняя ошибка сервера: {str(e)}'})}\n\n"
        
        response = StreamingHttpResponse(error_generator(), content_type='text/event-stream')
        response["Access-Control-Allow-Origin"] = get_allowed_origin(request)
        return response

@api_view(['GET', 'OPTIONS'])
@permission_classes([AllowAny])
def agui_health(request):
    """
    Health check для AG-UI сервиса
    """
    # Обработка CORS preflight запроса
    if request.method == "OPTIONS":
        response = Response(status=status.HTTP_200_OK)
        response["Access-Control-Allow-Origin"] = get_allowed_origin(request)
        response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response["Access-Control-Max-Age"] = "3600"
        response["Access-Control-Allow-Credentials"] = "true"
        return response
    
    response = Response({
        "status": "healthy" if AGUI_AVAILABLE else "unavailable",
        "agui_available": AGUI_AVAILABLE,
        "agent_id": "sales_agent" if AGUI_AVAILABLE else None
    })
    response["Access-Control-Allow-Origin"] = get_allowed_origin(request)
    response["Access-Control-Allow-Credentials"] = "true"
    return response


@csrf_exempt
@api_view(['POST', 'OPTIONS'])
@permission_classes([AllowAny])
def copilotkit_runtime_endpoint(request):
    """
    CopilotKit runtime endpoint для интеграции с официальными компонентами
    """
    # Определяем разрешенный origin
    allow_origin = get_allowed_origin(request)
    
    # Обработка CORS preflight запроса
    if request.method == "OPTIONS":
        response = Response(status=status.HTTP_200_OK)
        response["Access-Control-Allow-Origin"] = allow_origin
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = (
            "Content-Type, Authorization, X-CSRFToken, "
            "x-copilotkit-runtime-client-gql-version, "
            "x-copilotkit-frontend-version, "
            "accept, accept-encoding, accept-language, "
            "cache-control, dnt, origin, pragma, user-agent"
        )
        response["Access-Control-Max-Age"] = "3600"
        response["Access-Control-Allow-Credentials"] = "true"
        return response
    
    if not AGUI_AVAILABLE:
        response = Response({
            "error": "AG-UI агент недоступен",
            "message": "Проверьте конфигурацию OPENROUTER_API_KEY"
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        response["Access-Control-Allow-Origin"] = allow_origin
        return response
    
    try:
        # Получаем данные из CopilotKit GraphQL формата
        request_data = request.data
        
        # CopilotKit отправляет GraphQL запрос в формате:
        # {"variables": {"data": {"messages": [{"textMessage": {"role": "user", "content": "text"}}]}}}
        
        # Проверяем если это GraphQL запрос
        copilot_data = None
        if 'variables' in request_data and 'data' in request_data['variables']:
            copilot_data = request_data['variables']['data']
            raw_messages = copilot_data.get('messages', [])
            stream_response = copilot_data.get('stream', True)  # По умолчанию streaming
            
            # Преобразуем формат CopilotKit в стандартный формат
            messages = []
            for msg in raw_messages:
                if 'textMessage' in msg:
                    text_msg = msg['textMessage']
                    messages.append({
                        'role': text_msg.get('role'),
                        'content': text_msg.get('content')
                    })
                    
        else:
            # Стандартный REST формат (для совместимости)
            messages = request_data.get('messages', [])
            stream_response = request_data.get('stream', False)
            
        logger.info(f"Parsed messages: {messages}")
        logger.info(f"Stream response: {stream_response}")
        
        if not messages:
            # Возвращаем ошибку в GraphQL формате
            error_response = {
                "errors": [{
                    "message": "Сообщения не найдены в запросе",
                    "extensions": {
                        "code": "NO_MESSAGES"
                    }
                }],
                "data": {
                    "generateCopilotResponse": None
                }
            }
            
            response = Response(error_response, status=status.HTTP_400_BAD_REQUEST)
            response["Access-Control-Allow-Origin"] = allow_origin
            return response
        
        # Берем последнее сообщение пользователя
        last_message = None
        for msg in reversed(messages):
            if msg.get('role') == 'user':
                last_message = msg.get('content', '')
                break
        
        if not last_message:
            # Возвращаем ошибку в GraphQL формате
            error_response = {
                "errors": [{
                    "message": "Сообщение пользователя не найдено",
                    "extensions": {
                        "code": "NO_USER_MESSAGE"
                    }
                }],
                "data": {
                    "generateCopilotResponse": None
                }
            }
            
            response = Response(error_response, status=status.HTTP_400_BAD_REQUEST)
            response["Access-Control-Allow-Origin"] = allow_origin
            return response
        
        logger.info(f"CopilotKit runtime request: {last_message}")
        
        # Используем агента для генерации ответа
        try:
            if agui_app and hasattr(agui_app, 'agent'):
                agent = agui_app.agent
            else:
                agent = agui_agent.create_agno_agent()
            
            # Генерируем ответ
            agent_response = agent.run(last_message)
            
            # Извлекаем текст ответа
            if hasattr(agent_response, 'content'):
                response_text = agent_response.content
            elif isinstance(agent_response, str):
                response_text = agent_response
            else:
                response_text = str(agent_response)
            
            logger.info(f"CopilotKit agent response: {response_text}")
            
            # Возвращаем ответ в формате GraphQL, ожидаемом CopilotKit
            import uuid
            from datetime import datetime
            
            thread_id = copilot_data.get('threadId', str(uuid.uuid4())) if copilot_data else str(uuid.uuid4())
            run_id = str(uuid.uuid4())
            message_id = str(uuid.uuid4())
            
            graphql_response = {
                "data": {
                    "generateCopilotResponse": {
                        "threadId": thread_id,
                        "runId": run_id,
                        "extensions": {
                            "openaiAssistantAPI": None,
                            "__typename": "CopilotResponseExtensions"
                        },
                        "status": {
                            "code": "SUCCESS",
                            "__typename": "BaseResponseStatus"
                        },
                        "messages": [{
                            "__typename": "TextMessageOutput",
                            "id": message_id,
                            "createdAt": datetime.utcnow().isoformat() + "Z",
                            "content": [response_text] if isinstance(response_text, str) else response_text,
                            "role": "assistant",
                            "parentMessageId": None,
                            "status": {
                                "code": "SUCCESS",
                                "__typename": "SuccessMessageStatus"
                            }
                        }],
                        "metaEvents": [],
                        "__typename": "CopilotResponse"
                    }
                }
            }
            
            response = Response(graphql_response)
            response["Access-Control-Allow-Origin"] = allow_origin
            response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
            response["Access-Control-Allow-Headers"] = (
                "Content-Type, Authorization, X-CSRFToken, "
                "x-copilotkit-runtime-client-gql-version, "
                "x-copilotkit-frontend-version, "
                "accept, accept-encoding, accept-language, "
                "cache-control, dnt, origin, pragma, user-agent"
            )
            response["Access-Control-Allow-Credentials"] = "true"
            return response
            
        except Exception as agent_error:
            logger.error(f"Ошибка агента в CopilotKit runtime: {str(agent_error)}")
            
            # Возвращаем ошибку в GraphQL формате
            error_response = {
                "errors": [{
                    "message": f"Agent error: {str(agent_error)}",
                    "extensions": {
                        "code": "AGENT_ERROR"
                    }
                }],
                "data": {
                    "generateCopilotResponse": None
                }
            }
            
            response = Response(error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            response["Access-Control-Allow-Origin"] = allow_origin
            return response
            
    except Exception as e:
        logger.error(f"Ошибка в CopilotKit runtime endpoint: {str(e)}")
        
        # Возвращаем общую ошибку в GraphQL формате
        error_response = {
            "errors": [{
                "message": f"Server error: {str(e)}",
                "extensions": {
                    "code": "SERVER_ERROR"
                }
            }],
            "data": {
                "generateCopilotResponse": None
            }
        }
        
        response = Response(error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        response["Access-Control-Allow-Origin"] = allow_origin
        return response