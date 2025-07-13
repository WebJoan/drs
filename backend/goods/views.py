from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.conf import settings
from meilisearch import Client
from .models import Product, Brand, ProductSubgroup, ProductGroup
from .serializers import (
    ProductSerializer, 
    ProductCreateSerializer, 
    ProductUpdateSerializer,
    BrandSerializer,
    ProductSubgroupSerializer,
    ProductGroupSerializer
)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('subgroup', 'brand', 'product_manager').all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ProductCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ProductUpdateSerializer
        return ProductSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Поиск по названию
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(brand__name__icontains=search) |
                Q(subgroup__name__icontains=search)
            )
        
        # Фильтрация по бренду
        brand_id = self.request.query_params.get('brand_id', None)
        if brand_id:
            queryset = queryset.filter(brand_id=brand_id)
        
        # Фильтрация по подгруппе
        subgroup_id = self.request.query_params.get('subgroup_id', None)
        if subgroup_id:
            queryset = queryset.filter(subgroup_id=subgroup_id)
        
        # Фильтрация по менеджеру
        manager_id = self.request.query_params.get('manager_id', None)
        if manager_id:
            queryset = queryset.filter(
                Q(product_manager_id=manager_id) |
                Q(brand__product_manager_id=manager_id) |
                Q(subgroup__product_manager_id=manager_id)
            )
        
        return queryset.distinct()
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        
        # Возвращаем полную информацию о продукте
        response_serializer = ProductSerializer(product)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        
        # Возвращаем полную информацию о продукте
        response_serializer = ProductSerializer(product)
        return Response(response_serializer.data)
    
    @action(detail=False, methods=['delete'])
    def bulk_delete(self, request):
        """Массовое удаление товаров"""
        ids = request.data.get('ids', [])
        if not ids:
            return Response(
                {'error': 'Не переданы ID товаров для удаления'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        deleted_count = Product.objects.filter(id__in=ids).count()
        Product.objects.filter(id__in=ids).delete()
        
        return Response({
            'message': f'Удалено {deleted_count} товаров',
            'deleted_count': deleted_count
        })
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Поиск товаров через MeiliSearch"""
        query = request.query_params.get('q', '')
        
        if not query:
            return Response({'results': []})
        
        try:
            # Подключаемся к MeiliSearch
            client = Client(settings.MEILISEARCH_HOST, settings.MEILISEARCH_API_KEY)
            
            # Строим фильтры для поиска
            filters = []
            
            # Фильтр по бренду
            brand_id = request.query_params.get('brand_id')
            if brand_id:
                filters.append(f'brand_id = {brand_id}')
            
            # Фильтр по подгруппе
            subgroup_id = request.query_params.get('subgroup_id')
            if subgroup_id:
                filters.append(f'subgroup_id = {subgroup_id}')
            
            # Фильтр по менеджеру
            manager_id = request.query_params.get('manager_id')
            if manager_id:
                filters.append(f'product_manager_id = {manager_id}')
            
            # Фильтр по группе
            group_id = request.query_params.get('group_id')
            if group_id:
                filters.append(f'group_id = {group_id}')
            
            # Объединяем фильтры
            filter_str = ' AND '.join(filters) if filters else None
            
            # Параметры поиска
            search_params = {
                'limit': int(request.query_params.get('limit', 50)),
                'offset': int(request.query_params.get('offset', 0)),
                'attributesToHighlight': ['name', 'brand_name', 'subgroup_name'],
                'highlightPreTag': '<mark>',
                'highlightPostTag': '</mark>',
            }
            
            if filter_str:
                search_params['filter'] = filter_str
            
            # Выполняем поиск
            search_results = client.index('products').search(query, search_params)
            
            return Response({
                'results': search_results['hits'],
                'total': search_results['nbHits'],
                'query': query,
                'processing_time': search_results['processingTimeMs']
            })
            
        except Exception as e:
            return Response(
                {'error': f'Ошибка поиска: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.select_related('product_manager').all()
    serializer_class = BrandSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Поиск по названию
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset


class ProductSubgroupViewSet(viewsets.ModelViewSet):
    queryset = ProductSubgroup.objects.select_related('group', 'product_manager').all()
    serializer_class = ProductSubgroupSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Поиск по названию
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(group__name__icontains=search)
            )
        
        # Фильтрация по группе
        group_id = self.request.query_params.get('group_id', None)
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        
        return queryset


class ProductGroupViewSet(viewsets.ModelViewSet):
    queryset = ProductGroup.objects.all()
    serializer_class = ProductGroupSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Поиск по названию
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset 