from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Создаем роутер для ViewSet'ов
router = DefaultRouter()
router.register(r'invoices', views.InvoiceViewSet, basename='invoice')
router.register(r'invoice-lines', views.InvoiceLineViewSet, basename='invoiceline')

urlpatterns = [
    # API маршруты
    path('api/', include(router.urls)),
    
    # Дополнительные маршруты можно добавить здесь
]

# Именованные паттерны для удобства
app_name = 'sales'