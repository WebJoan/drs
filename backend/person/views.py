from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q

from .models import Person
from .serializers import (
    PersonListSerializer, PersonDetailSerializer,
    PersonCreateSerializer, PersonUpdateSerializer
)
from .permissions import PersonPermission


class PersonPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


class PersonViewSet(viewsets.ModelViewSet):
    """ViewSet для работы с контактными лицами"""
    
    queryset = Person.objects.select_related('company', 'company__sales_manager')
    permission_classes = [PersonPermission]
    pagination_class = PersonPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'email', 'position', 'company__name']
    ordering_fields = ['last_name', 'created_at', 'company__name']
    ordering = ['company__name', 'last_name', 'first_name']
    
    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия"""
        if self.action == 'list':
            return PersonListSerializer
        elif self.action == 'create':
            return PersonCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PersonUpdateSerializer
        return PersonDetailSerializer
    
    def get_queryset(self):
        """Фильтрация queryset в зависимости от роли пользователя"""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Sales менеджеры видят только контакты своих компаний
        if user.role == 'sales':
            queryset = queryset.filter(company__sales_manager=user)
        
        # Фильтрация по компании
        company_id = self.request.query_params.get('company')
        if company_id:
            queryset = queryset.filter(company_id=company_id)
        
        # Фильтрация по статусу
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Фильтрация по основным контактам
        is_primary = self.request.query_params.get('is_primary_contact')
        if is_primary is not None:
            is_primary_bool = is_primary.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(is_primary_contact=is_primary_bool)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def by_company(self, request):
        """Получение контактов сгруппированных по компаниям"""
        company_id = request.query_params.get('company_id')
        if not company_id:
            return Response(
                {'error': 'company_id parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        contacts = self.get_queryset().filter(company_id=company_id)
        serializer = self.get_serializer(contacts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def primary_contacts(self, request):
        """Получение только основных контактов"""
        contacts = self.get_queryset().filter(is_primary_contact=True)
        page = self.paginate_queryset(contacts)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(contacts, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def make_primary(self, request, pk=None):
        """Сделать контакт основным для компании"""
        person = self.get_object()
        
        # Убираем флаг основного контакта у других сотрудников компании
        Person.objects.filter(
            company=person.company, 
            is_primary_contact=True
        ).update(is_primary_contact=False)
        
        # Устанавливаем текущий контакт как основной
        person.is_primary_contact = True
        person.save()
        
        serializer = self.get_serializer(person)
        return Response(serializer.data) 