from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django.shortcuts import get_object_or_404
from celery import current_app
from .models import AiEmail, AiEmailAttachment
from .permissions import AiEmailPermission, AiEmailAttachmentPermission
from .serializers import (
    AiEmailSerializer,
    AiEmailCreateSerializer,
    AiEmailUpdateSerializer,
    AiEmailGenerateSerializer,
    AiEmailPersonalizedGenerateSerializer,
    AiEmailAttachmentSerializer,
    AiEmailAttachmentCreateSerializer
)
from .tasks import (
    generate_ai_email_task, 
    generate_ai_email_structured_task,
    send_ai_email_task,
    generate_sales_insights_task,
    generate_personalized_ai_email_task
)


class AiEmailPageNumberPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
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


class AiEmailViewSet(viewsets.ModelViewSet):
    """ViewSet для управления AI Email"""
    queryset = AiEmail.objects.select_related(
        'sales_manager', 'recipient'
    ).prefetch_related('attachments').filter(deleted_at__isnull=True)
    permission_classes = [AiEmailPermission]
    pagination_class = AiEmailPageNumberPagination
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AiEmailCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AiEmailUpdateSerializer
        elif self.action == 'generate':
            return AiEmailGenerateSerializer
        elif self.action == 'generate_personalized':
            return AiEmailPersonalizedGenerateSerializer
        return AiEmailSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Sales менеджеры видят только свои письма (если не администратор)
        if (user.role == 'sales' and 
            not user.is_superuser and 
            user.role != 'admin'):
            queryset = queryset.filter(sales_manager=user)
        
        # Фильтрация по статусу
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Фильтрация по получателю
        recipient_id = self.request.query_params.get('recipient_id')
        if recipient_id:
            queryset = queryset.filter(recipient_id=recipient_id)
        
        # Поиск по теме письма
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(subject__icontains=search) | 
                Q(body__icontains=search) |
                Q(recipient__name__icontains=search)
            )
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Генерация AI письма с использованием Agno + OpenRouter"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Используем структурированную генерацию по умолчанию (более надежная)
        use_structured = request.data.get('use_structured', True)
        
        if use_structured:
            task = generate_ai_email_structured_task.delay(
                user_id=request.user.id,
                recipient_id=serializer.validated_data['recipient_id'],
                context=serializer.validated_data.get('context', ''),
                tone=serializer.validated_data.get('tone', 'professional'),
                purpose=serializer.validated_data.get('purpose', 'offer'),
                products=serializer.validated_data.get('products', [])
            )
        else:
            # Базовая генерация (для совместимости)
            task = generate_ai_email_task.delay(
                user_id=request.user.id,
                recipient_id=serializer.validated_data['recipient_id'],
                context=serializer.validated_data.get('context', ''),
                tone=serializer.validated_data.get('tone', 'professional'),
                purpose=serializer.validated_data.get('purpose', 'offer'),
                products=serializer.validated_data.get('products', [])
            )
        
        return Response({
            'message': 'Генерация письма запущена через Agno',
            'task_id': task.id,
            'method': 'structured' if use_structured else 'basic'
        }, status=status.HTTP_202_ACCEPTED)
    
    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Отправка письма"""
        email = self.get_object()
        
        if email.status != 'draft':
            return Response({
                'error': 'Можно отправлять только черновики'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Запускаем задачу отправки письма
        task = send_ai_email_task.delay(email.id)
        
        # Обновляем статус на "отправляется"
        email.status = 'sent'
        email.save()
        
        return Response({
            'message': 'Письмо отправляется',
            'task_id': task.id
        }, status=status.HTTP_202_ACCEPTED)
    
    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        """Перегенерация письма с новыми параметрами через Agno"""
        email = self.get_object()
        serializer = AiEmailGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Используем структурированную генерацию по умолчанию
        use_structured = request.data.get('use_structured', True)
        
        if use_structured:
            task = generate_ai_email_structured_task.delay(
                user_id=request.user.id,
                recipient_id=serializer.validated_data.get('recipient_id', email.recipient.id),
                context=serializer.validated_data.get('context', ''),
                tone=serializer.validated_data.get('tone', 'professional'),
                purpose=serializer.validated_data.get('purpose', 'offer'),
                products=serializer.validated_data.get('products', []),
                email_id=email.id  # Передаем ID для обновления существующего письма
            )
        else:
            task = generate_ai_email_task.delay(
                user_id=request.user.id,
                recipient_id=serializer.validated_data.get('recipient_id', email.recipient.id),
                context=serializer.validated_data.get('context', ''),
                tone=serializer.validated_data.get('tone', 'professional'),
                purpose=serializer.validated_data.get('purpose', 'offer'),
                products=serializer.validated_data.get('products', []),
                email_id=email.id  # Передаем ID для обновления существующего письма
            )
        
        return Response({
            'message': 'Перегенерация письма запущена через Agno',
            'task_id': task.id,
            'method': 'structured' if use_structured else 'basic'
        }, status=status.HTTP_202_ACCEPTED)
    
    @action(detail=False, methods=['get'])
    def task_status(self, request):
        """Проверка статуса задачи"""
        task_id = request.query_params.get('task_id')
        if not task_id:
            return Response({
                'error': 'Требуется параметр task_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            result = current_app.AsyncResult(task_id)
            return Response({
                'task_id': task_id,
                'status': result.status,
                'result': result.result if result.ready() else None
            })
        except Exception as e:
            return Response({
                'error': f'Ошибка получения статуса задачи: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Статистика по письмам"""
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'draft': queryset.filter(status='draft').count(),
            'sent': queryset.filter(status='sent').count(),
            'delivered': queryset.filter(status='delivered').count(),
            'error': queryset.filter(status='error').count(),
            'archived': queryset.filter(status='archived').count(),
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['post'])
    def generate_sales_insights(self, request):
        """Генерация инсайтов по продажам компании через Agno + oper router"""
        company_id = request.data.get('company_id')
        person_id = request.data.get('person_id')
        
        if not company_id or not person_id:
            return Response({
                'error': 'Требуются параметры company_id и person_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Запускаем задачу генерации инсайтов
            task = generate_sales_insights_task.delay(
                company_id=company_id,
                person_id=person_id
            )
            
            return Response({
                'message': 'Генерация инсайтов по продажам запущена через Agno',
                'task_id': task.id
            }, status=status.HTTP_202_ACCEPTED)
            
        except Exception as e:
            return Response({
                'error': f'Ошибка запуска генерации инсайтов: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def generate_personalized(self, request):
        """Генерация персонализированного AI письма с данными о продажах через Agno + oper router"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Опция включения данных о продажах (по умолчанию включена)
        include_sales_data = request.data.get('include_sales_data', True)
        
        try:
            # Запускаем задачу генерации персонализированного письма
            task = generate_personalized_ai_email_task.delay(
                user_id=request.user.id,
                recipient_id=serializer.validated_data['recipient_id'],
                context=serializer.validated_data.get('context', ''),
                tone=serializer.validated_data.get('tone', 'professional'),
                purpose=serializer.validated_data.get('purpose', 'offer'),
                products=serializer.validated_data.get('products', []),
                include_sales_data=include_sales_data
            )
            
            return Response({
                'message': 'Генерация персонализированного письма запущена через Agno с данными о продажах',
                'task_id': task.id,
                'include_sales_data': include_sales_data
            }, status=status.HTTP_202_ACCEPTED)
            
        except Exception as e:
            return Response({
                'error': f'Ошибка запуска генерации персонализированного письма: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def regenerate_personalized(self, request, pk=None):
        """Перегенерация письма с персонализацией на основе данных о продажах"""
        email = self.get_object()
        
        # Получаем параметры для перегенерации
        context = request.data.get('context', '')
        tone = request.data.get('tone', 'professional')
        purpose = request.data.get('purpose', 'offer')
        products = request.data.get('products', [])
        include_sales_data = request.data.get('include_sales_data', True)
        
        try:
            # Запускаем задачу перегенерации персонализированного письма
            task = generate_personalized_ai_email_task.delay(
                user_id=request.user.id,
                recipient_id=email.recipient.id,
                context=context,
                tone=tone,
                purpose=purpose,
                products=products,
                email_id=email.id,
                include_sales_data=include_sales_data
            )
            
            return Response({
                'message': 'Перегенерация персонализированного письма запущена через Agno',
                'task_id': task.id,
                'include_sales_data': include_sales_data
            }, status=status.HTTP_202_ACCEPTED)
            
        except Exception as e:
            return Response({
                'error': f'Ошибка запуска перегенерации персонализированного письма: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


class AiEmailAttachmentViewSet(viewsets.ModelViewSet):
    """ViewSet для управления вложениями AI Email"""
    queryset = AiEmailAttachment.objects.select_related('ai_email').filter(deleted_at__isnull=True)
    permission_classes = [AiEmailAttachmentPermission]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AiEmailAttachmentCreateSerializer
        return AiEmailAttachmentSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Sales менеджеры видят только вложения из своих писем (если не администратор)
        if (user.role == 'sales' and 
            not user.is_superuser and 
            user.role != 'admin'):
            queryset = queryset.filter(ai_email__sales_manager=user)
        
        # Фильтрация по письму
        ai_email_id = self.request.query_params.get('ai_email_id')
        if ai_email_id:
            queryset = queryset.filter(ai_email_id=ai_email_id)
        
        return queryset