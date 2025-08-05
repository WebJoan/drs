from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AiEmailViewSet, AiEmailAttachmentViewSet

router = DefaultRouter()
router.register(r'ai-emails', AiEmailViewSet, basename='ai-email')
router.register(r'attachments', AiEmailAttachmentViewSet, basename='ai-email-attachment')

urlpatterns = [
    path('', include(router.urls)),
]