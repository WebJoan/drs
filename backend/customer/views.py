from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Count
from django_utils_kit.viewsets import ImprovedViewSet

from .models import Company
from .serializers import (
    CompanyListSerializer, CompanyDetailSerializer,
    CompanyCreateSerializer, CompanyUpdateSerializer
)
from .permissions import CompanyPermission


class CompanyPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


class CompanyViewSet(viewsets.ModelViewSet):
    """ViewSet для работы с компаниями"""
    
    queryset = Company.objects.select_related('sales_manager').prefetch_related('employees')
    permission_classes = [CompanyPermission]
    pagination_class = CompanyPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'short_name', 'inn', 'email', 'industry']
    ordering_fields = ['name', 'created_at', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия"""
        if self.action == 'list':
            return CompanyListSerializer
        elif self.action == 'create':
            return CompanyCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return CompanyUpdateSerializer
        return CompanyDetailSerializer
    
    def get_queryset(self):
        """Фильтрация queryset в зависимости от роли пользователя"""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Sales менеджеры видят только свои компании
        if user.role == 'sales':
            queryset = queryset.filter(sales_manager=user)
        
        # Фильтрация по статусу
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Фильтрация по типу компании
        company_type = self.request.query_params.get('company_type')
        if company_type:
            queryset = queryset.filter(company_type=company_type)
        
        # Фильтрация по назначенному менеджеру
        manager_id = self.request.query_params.get('sales_manager')
        if manager_id:
            queryset = queryset.filter(sales_manager_id=manager_id)
        
        return queryset.annotate(
            employees_count_actual=Count('employees')
        )
    
    def perform_create(self, serializer):
        """Автоматически назначаем текущего sales менеджера при создании"""
        user = self.request.user
        if user.role == 'sales' and not serializer.validated_data.get('sales_manager'):
            serializer.save(sales_manager=user)
        else:
            serializer.save()
    
    @action(detail=True, methods=['get'])
    def employees(self, request, pk=None):
        """Получение списка сотрудников компании"""
        company = self.get_object()
        employees = company.employees.all()
        
        # Простая сериализация сотрудников
        from person.serializers import PersonListSerializer
        serializer = PersonListSerializer(employees, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def rfqs(self, request, pk=None):
        """Получение списка RFQ компании"""
        company = self.get_object()
        rfqs = company.rfqs.all()
        
        # Простая сериализация RFQ
        from rfq.serializers import RFQListSerializer
        serializer = RFQListSerializer(rfqs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_companies(self, request):
        """Получение компаний текущего sales менеджера"""
        if request.user.role != 'sales':
            return Response(
                {'error': 'Only sales managers can access this endpoint'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        companies = self.get_queryset().filter(sales_manager=request.user)
        page = self.paginate_queryset(companies)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(companies, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Статистика по компаниям"""
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'by_status': {},
            'by_type': {},
            'by_manager': {}
        }
        
        # Статистика по статусам
        for status_choice in Company.StatusChoices:
            count = queryset.filter(status=status_choice[0]).count()
            stats['by_status'][status_choice[0]] = {
                'count': count,
                'label': status_choice[1]
            }
        
        # Статистика по типам
        for type_choice in Company.CompanyTypeChoices:
            count = queryset.filter(company_type=type_choice[0]).count()
            stats['by_type'][type_choice[0]] = {
                'count': count,
                'label': type_choice[1]
            }
        
        return Response(stats) 