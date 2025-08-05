from django.urls import path
import agui_views

app_name = 'agui'

urlpatterns = [
    # AG-UI endpoint для CopilotKit интеграции
    path('agui/', agui_views.agui_endpoint, name='agui_endpoint'),
    
    # DRF API endpoints для AG-UI
    path('api/agui/', agui_views.agui_api_endpoint, name='agui_api'),
    path('api/agui/stream/', agui_views.agui_stream_endpoint, name='agui_stream'),
    path('api/agui/health/', agui_views.agui_health, name='agui_health'),
    
    # CSRF токен для CopilotKit
    path('api/agui/csrf-token/', agui_views.get_csrf_token, name='csrf_token'),
    
    # CopilotKit runtime endpoint
    path('api/agui/copilotkit/', agui_views.copilotkit_runtime_endpoint, name='copilotkit_runtime'),
]