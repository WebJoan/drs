from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.conf import settings
from meilisearch import Client
from .utils import prepare_search_query
from .models import Product, Brand, ProductSubgroup, ProductGroup
from .permissions import ProductPermission, BrandPermission, ProductGroupPermission
from .serializers import (
    ProductSerializer, 
    ProductCreateSerializer, 
    ProductUpdateSerializer,
    BrandSerializer,
    ProductSubgroupSerializer,
    ProductGroupSerializer
)


class ProductPageNumberPagination(PageNumberPagination):
    page_size = 50  # 50 товаров на страницу для оптимальной производительности
    page_size_query_param = 'page_size'
    max_page_size = 200  # Максимум 200 товаров на страницу
    
    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'page': self.page.number,
            'page_size': self.page_size,
            'total_pages': self.page.paginator.num_pages,
            'results': data
        })


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('subgroup', 'brand', 'product_manager').all()
    permission_classes = [ProductPermission]
    pagination_class = ProductPageNumberPagination
    ordering = ['-id']  # Стабильная сортировка (сначала новые товары по ID)
    
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
        
        return queryset.distinct().order_by(*self.ordering)
    
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
        """Поиск товаров через MeiliSearch с приоритизированной транслитерацией"""
        query = request.query_params.get('q', '')
        
        if not query:
            return Response({'results': [], 'total': 0, 'query': query})
        
        try:
            # Подключаемся к MeiliSearch
            client = Client(settings.MEILISEARCH_HOST, settings.MEILISEARCH_API_KEY)
            
            # Подготавливаем запрос с приоритизированными вариантами транслитерации
            search_data = prepare_search_query(query)
            
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
            limit = int(request.query_params.get('limit', 50))
            offset = int(request.query_params.get('offset', 0))
            
            base_search_params = {
                'limit': limit * 2,  # Увеличиваем лимит для фильтрации дубликатов
                'offset': 0,  # Начинаем с начала для каждого запроса
                'attributesToHighlight': ['name', 'brand_name', 'subgroup_name'],
                'highlightPreTag': '<mark>',
                'highlightPostTag': '</mark>',
            }
            
            if filter_str:
                base_search_params['filter'] = filter_str
            
            # Выполняем приоритизированный поиск
            all_results = []
            seen_ids = set()
            
            # Этап 1: Поиск по приоритетным вариантам (оригинал + семантическая транслитерация)
            priority_results = []
            for search_variant in search_data['priority_variants']:
                if search_variant.strip():
                    try:
                        variant_results = client.index('products').search(search_variant, base_search_params)
                        
                        for hit in variant_results['hits']:
                            if hit['id'] not in seen_ids:
                                # Отмечаем как приоритетный результат
                                hit['_search_priority'] = 'high'
                                hit['_search_variant'] = search_variant
                                priority_results.append(hit)
                                seen_ids.add(hit['id'])
                    except Exception as variant_error:
                        print(f"Ошибка поиска для приоритетного варианта '{search_variant}': {variant_error}")
                        continue
            
            # Если приоритетных результатов достаточно, используем только их
            if len(priority_results) >= limit:
                all_results = priority_results
            else:
                # Этап 2: Дополняем запасными вариантами (раскладка клавиатуры)
                all_results = priority_results.copy()
                
                for search_variant in search_data['fallback_variants']:
                    if search_variant.strip() and len(all_results) < limit * 2:
                        try:
                            variant_results = client.index('products').search(search_variant, base_search_params)
                            
                            for hit in variant_results['hits']:
                                if hit['id'] not in seen_ids:
                                    # Отмечаем как запасной результат
                                    hit['_search_priority'] = 'low'
                                    hit['_search_variant'] = search_variant
                                    all_results.append(hit)
                                    seen_ids.add(hit['id'])
                        except Exception as variant_error:
                            print(f"Ошибка поиска для запасного варианта '{search_variant}': {variant_error}")
                            continue
            
            # Сортируем результаты: сначала приоритетные, потом запасные
            # В пределах группы сохраняем сортировку MeiliSearch по релевантности
            priority_results = [r for r in all_results if r.get('_search_priority') == 'high']
            fallback_results = [r for r in all_results if r.get('_search_priority') == 'low']
            
            final_results = priority_results + fallback_results
            
            # Применяем пагинацию
            paginated_results = final_results[offset:offset + limit]
            
            # Убираем служебные поля перед отправкой
            for result in paginated_results:
                result.pop('_search_priority', None)
                result.pop('_search_variant', None)
            
            return Response({
                'results': paginated_results,
                'total': len(final_results),
                'query': query,
                'search_variants': search_data['all_variants'],  # Для отладки
                'priority_count': len(priority_results),  # Для отладки
                'fallback_count': len(fallback_results),  # Для отладки
                'processing_time': 0  # Приблизительное время
            })
            
        except Exception as e:
            return Response(
                {'error': f'Ошибка поиска: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.select_related('product_manager').all()
    serializer_class = BrandSerializer
    permission_classes = [BrandPermission]
    pagination_class = None  # Отключаем пагинацию для брендов
    
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
    permission_classes = [ProductGroupPermission]
    pagination_class = None  # Отключаем пагинацию для подгрупп
    
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
    permission_classes = [ProductGroupPermission]
    pagination_class = None  # Отключаем пагинацию для групп
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Поиск по названию
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset 