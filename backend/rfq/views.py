from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q, Count, Sum
from django.shortcuts import get_object_or_404

from .models import (
    Currency, RFQ, RFQItem, RFQItemFile,
    Quotation, QuotationItem
)
from .serializers import (
    CurrencySerializer, RFQListSerializer, RFQDetailSerializer,
    RFQCreateSerializer, RFQItemCreateSerializer, RFQItemDetailSerializer,
    RFQItemFileSerializer, QuotationListSerializer, QuotationDetailSerializer,
    QuotationCreateSerializer, QuotationItemCreateSerializer
)
from .permissions import RFQPermission, QuotationPermission


class RFQPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class CurrencyViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для валют (только чтение)"""
    
    queryset = Currency.objects.filter(is_active=True)
    serializer_class = CurrencySerializer
    permission_classes = [RFQPermission]


class RFQViewSet(viewsets.ModelViewSet):
    """ViewSet для работы с RFQ"""
    
    queryset = RFQ.objects.select_related(
        'company', 'contact_person', 'sales_manager'
    ).prefetch_related('items', 'quotations')
    permission_classes = [RFQPermission]
    pagination_class = RFQPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['number', 'title', 'company__name']
    ordering_fields = ['created_at', 'deadline', 'status', 'priority']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия"""
        if self.action == 'list':
            return RFQListSerializer
        elif self.action == 'create':
            return RFQCreateSerializer
        return RFQDetailSerializer
    
    def get_queryset(self):
        """Фильтрация queryset в зависимости от роли пользователя"""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Sales менеджеры видят только свои RFQ и RFQ своих компаний
        if user.role == 'sales':
            queryset = queryset.filter(
                Q(sales_manager=user) | Q(company__sales_manager=user)
            )
        
        # Фильтрация по статусу
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Фильтрация по приоритету
        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        
        # Фильтрация по компании
        company_id = self.request.query_params.get('company')
        if company_id:
            queryset = queryset.filter(company_id=company_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """Автоматически назначаем текущего sales менеджера при создании"""
        user = self.request.user
        if user.role == 'sales':
            serializer.save(sales_manager=user)
        else:
            serializer.save()
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Отправка RFQ на рассмотрение (изменение статуса с draft на submitted)"""
        rfq = self.get_object()
        
        if rfq.status != 'draft':
            return Response(
                {'error': 'Only draft RFQs can be submitted'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not rfq.items.exists():
            return Response(
                {'error': 'RFQ must have at least one item before submission'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        rfq.status = 'submitted'
        rfq.save()
        
        serializer = self.get_serializer(rfq)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def items(self, request, pk=None):
        """Получение строк RFQ"""
        rfq = self.get_object()
        items = rfq.items.all().order_by('line_number')
        serializer = RFQItemDetailSerializer(items, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        """Добавление строки в RFQ"""
        rfq = self.get_object()
        
        if rfq.status not in ['draft', 'submitted']:
            return Response(
                {'error': 'Cannot add items to RFQ in current status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Автоматически определяем номер строки
        last_item = rfq.items.order_by('-line_number').first()
        line_number = (last_item.line_number + 1) if last_item else 1
        
        serializer = RFQItemCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(rfq=rfq, line_number=line_number)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def my_rfqs(self, request):
        """Получение RFQ текущего sales менеджера"""
        if request.user.role != 'sales':
            return Response(
                {'error': 'Only sales managers can access this endpoint'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        rfqs = self.get_queryset().filter(sales_manager=request.user)
        page = self.paginate_queryset(rfqs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(rfqs, many=True)
        return Response(serializer.data)


class RFQItemViewSet(viewsets.ModelViewSet):
    """ViewSet для работы со строками RFQ"""
    
    queryset = RFQItem.objects.select_related('rfq', 'product')
    permission_classes = [RFQPermission]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return RFQItemCreateSerializer
        return RFQItemDetailSerializer
    
    @action(detail=True, methods=['post'])
    def upload_file(self, request, pk=None):
        """Загрузка файла к строке RFQ"""
        rfq_item = self.get_object()
        
        file_data = {
            'rfq_item': rfq_item.id,
            'file': request.FILES.get('file'),
            'file_type': request.data.get('file_type', 'other'),
            'description': request.data.get('description', '')
        }
        
        serializer = RFQItemFileSerializer(data=file_data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class QuotationViewSet(viewsets.ModelViewSet):
    """ViewSet для работы с предложениями"""
    
    queryset = Quotation.objects.select_related(
        'rfq', 'product_manager', 'currency'
    ).prefetch_related('items')
    permission_classes = [QuotationPermission]
    pagination_class = RFQPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['number', 'title', 'rfq__number', 'rfq__company__name']
    ordering_fields = ['created_at', 'valid_until', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия"""
        if self.action == 'list':
            return QuotationListSerializer
        elif self.action == 'create':
            return QuotationCreateSerializer
        return QuotationDetailSerializer
    
    def get_queryset(self):
        """Фильтрация queryset в зависимости от роли пользователя"""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Product менеджеры видят только свои предложения
        if user.role == 'product':
            queryset = queryset.filter(product_manager=user)
        # Sales менеджеры видят предложения для своих RFQ
        elif user.role == 'sales':
            queryset = queryset.filter(
                Q(rfq__sales_manager=user) | Q(rfq__company__sales_manager=user)
            )
        
        # Фильтрация по RFQ
        rfq_id = self.request.query_params.get('rfq')
        if rfq_id:
            queryset = queryset.filter(rfq_id=rfq_id)
        
        # Фильтрация по статусу
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    def perform_create(self, serializer):
        """Автоматически назначаем текущего product менеджера при создании"""
        user = self.request.user
        if user.role == 'product':
            serializer.save(product_manager=user)
        else:
            serializer.save()
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Отправка предложения клиенту"""
        quotation = self.get_object()
        
        if quotation.status != 'draft':
            return Response(
                {'error': 'Only draft quotations can be submitted'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not quotation.items.exists():
            return Response(
                {'error': 'Quotation must have at least one item before submission'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        quotation.status = 'submitted'
        quotation.save()
        
        serializer = self.get_serializer(quotation)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        """Добавление строки в предложение"""
        quotation = self.get_object()
        
        if quotation.status not in ['draft']:
            return Response(
                {'error': 'Cannot add items to quotation in current status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = QuotationItemCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(quotation=quotation)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def pending_rfqs(self, request):
        """Получение RFQ, требующих создания предложений"""
        if request.user.role != 'product':
            return Response(
                {'error': 'Only product managers can access this endpoint'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # RFQ со статусом submitted или in_progress, которые не имеют предложений от текущего менеджера
        from .models import RFQ
        pending_rfqs = RFQ.objects.filter(
            status__in=['submitted', 'in_progress']
        ).exclude(
            quotations__product_manager=request.user
        ).select_related('company', 'sales_manager')
        
        serializer = RFQListSerializer(pending_rfqs, many=True)
        return Response(serializer.data) 