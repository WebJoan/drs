from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CurrencyViewSet, RFQViewSet, RFQItemViewSet, QuotationViewSet
)

router = DefaultRouter()
router.register(r'currencies', CurrencyViewSet)
router.register(r'rfqs', RFQViewSet)
router.register(r'rfq-items', RFQItemViewSet)
router.register(r'quotations', QuotationViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 