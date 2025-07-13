from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, BrandViewSet, ProductSubgroupViewSet, ProductGroupViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'brands', BrandViewSet)
router.register(r'subgroups', ProductSubgroupViewSet)
router.register(r'groups', ProductGroupViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 