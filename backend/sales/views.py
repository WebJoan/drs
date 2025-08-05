from django.shortcuts import render
from django.http import HttpResponse
from django.utils.translation import gettext_lazy as _
from django.db.models import Count, Q
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as filters
import pandas as pd
import io
import json
from datetime import datetime, date

from .models import Invoice, InvoiceLine
from .serializers import (
    InvoiceSerializer, 
    InvoiceListSerializer, 
    InvoiceLineSerializer,
    SalesExportRequestSerializer
)
from .permissions import (
    CanViewOwnSalesPermission, 
    CanExportOwnSalesPermission,
    IsOwnerOrSalesManager
)


class InvoiceFilter(filters.FilterSet):
    """Фильтр для счетов"""
    date_from = filters.DateFilter(field_name='invoice_date', lookup_expr='gte')
    date_to = filters.DateFilter(field_name='invoice_date', lookup_expr='lte')
    company = filters.NumberFilter(field_name='company__id')
    invoice_type = filters.ChoiceFilter(choices=Invoice.InvoiceType.choices)
    sale_type = filters.ChoiceFilter(choices=Invoice.SaleType.choices)
    currency = filters.ChoiceFilter(choices=Invoice.Currency.choices)
    
    class Meta:
        model = Invoice
        fields = ['date_from', 'date_to', 'company', 'invoice_type', 'sale_type', 'currency']


class InvoicePagination(PageNumberPagination):
    """Пагинация для счетов"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для просмотра счетов.
    Клиенты могут видеть только свои счета на продажу.
    Менеджеры продаж видят счета своих клиентов.
    """
    queryset = Invoice.objects.all()
    permission_classes = [permissions.IsAuthenticated, CanViewOwnSalesPermission]
    filter_backends = [DjangoFilterBackend]
    filterset_class = InvoiceFilter
    pagination_class = InvoicePagination
    
    def get_serializer_class(self):
        """Выбираем сериализатор в зависимости от action"""
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceSerializer
    
    def get_queryset(self):
        """Фильтруем queryset в зависимости от роли пользователя"""
        user = self.request.user
        queryset = Invoice.objects.select_related('company').prefetch_related('lines__product')
        
        # Администраторы видят все
        if user.is_superuser or user.role == 'admin':
            pass  # Возвращаем весь queryset
        
        # Менеджеры продаж видят продажи своих клиентов
        elif user.role == 'sales':
            queryset = queryset.filter(company__sales_manager=user)
        
        # Пользователи компаний видят только свои продажи
        elif hasattr(user, 'profile') and hasattr(user.profile, 'company'):
            queryset = queryset.filter(company=user.profile.company)
        
        else:
            # Если нет подходящей роли, возвращаем пустой queryset
            queryset = queryset.none()
        
        # Фильтруем только счета на продажу для клиентов
        if user.role != 'admin' and not user.is_superuser:
            queryset = queryset.filter(invoice_type=Invoice.InvoiceType.SALE)
        
        # Добавляем аннотацию с количеством строк для списка
        if self.action == 'list':
            queryset = queryset.annotate(lines_count=Count('lines'))
        
        return queryset.order_by('-invoice_date', '-created_at')
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated, CanExportOwnSalesPermission])
    def export(self, request):
        """
        Экспорт данных о продажах в различных форматах.
        """
        serializer = SalesExportRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        date_from = validated_data.get('date_from')
        date_to = validated_data.get('date_to')
        export_format = validated_data.get('format', 'excel')
        include_lines = validated_data.get('include_lines', True)
        
        # Получаем queryset с учетом прав доступа
        queryset = self.get_queryset()
        
        # Применяем фильтры по датам
        if date_from:
            queryset = queryset.filter(invoice_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(invoice_date__lte=date_to)
        
        # Подготавливаем данные для экспорта
        if include_lines:
            # Экспорт со строками счетов
            data = []
            for invoice in queryset:
                for line in invoice.lines.all():
                    data.append({
                        'invoice_number': invoice.invoice_number,
                        'invoice_date': invoice.invoice_date,
                        'company_name': invoice.company.name,
                        'invoice_type': invoice.get_invoice_type_display(),
                        'sale_type': invoice.get_sale_type_display() if invoice.sale_type else '',
                        'currency': invoice.currency,
                        'product_name': line.product.name if line.product else '',
                        'product_article': line.product.article if line.product else '',
                        'quantity': line.quantity,
                        'price': float(line.price),
                        'total_price': float(line.total_price),
                    })
        else:
            # Экспорт только счетов
            data = []
            for invoice in queryset:
                data.append({
                    'invoice_number': invoice.invoice_number,
                    'invoice_date': invoice.invoice_date,
                    'company_name': invoice.company.name,
                    'invoice_type': invoice.get_invoice_type_display(),
                    'sale_type': invoice.get_sale_type_display() if invoice.sale_type else '',
                    'currency': invoice.currency,
                    'total_amount': float(invoice.total_amount),
                })
        
        if not data:
            return Response(
                {'detail': _('Нет данных для экспорта с указанными параметрами.')},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Генерируем файл в зависимости от формата
        if export_format == 'excel':
            return self._export_excel(data, include_lines)
        elif export_format == 'csv':
            return self._export_csv(data, include_lines)
        elif export_format == 'json':
            return self._export_json(data)
        
        return Response(
            {'detail': _('Неподдерживаемый формат экспорта.')},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def _export_excel(self, data, include_lines):
        """Экспорт в Excel"""
        df = pd.DataFrame(data)
        
        # Создаем Excel файл в памяти
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            sheet_name = 'Продажи с товарами' if include_lines else 'Продажи'
            df.to_excel(writer, sheet_name=sheet_name, index=False)
        
        output.seek(0)
        
        # Формируем имя файла
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'sales_export_{timestamp}.xlsx'
        
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    
    def _export_csv(self, data, include_lines):
        """Экспорт в CSV"""
        df = pd.DataFrame(data)
        
        # Создаем CSV в памяти
        output = io.StringIO()
        df.to_csv(output, index=False, encoding='utf-8')
        
        # Формируем имя файла
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'sales_export_{timestamp}.csv'
        
        response = HttpResponse(output.getvalue(), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    
    def _export_json(self, data):
        """Экспорт в JSON"""
        # Конвертируем даты в строки для JSON
        for item in data:
            if 'invoice_date' in item and isinstance(item['invoice_date'], date):
                item['invoice_date'] = item['invoice_date'].isoformat()
        
        # Формируем имя файла
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'sales_export_{timestamp}.json'
        
        response = HttpResponse(
            json.dumps(data, ensure_ascii=False, indent=2),
            content_type='application/json; charset=utf-8'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Статистика продаж для текущего пользователя"""
        queryset = self.get_queryset()
        
        # Общая статистика
        total_invoices = queryset.count()
        total_amount = sum(invoice.total_amount for invoice in queryset)
        
        # Статистика по типам продаж
        stock_sales = queryset.filter(sale_type=Invoice.SaleType.STOCK).count()
        order_sales = queryset.filter(sale_type=Invoice.SaleType.ORDER).count()
        
        # Статистика по валютам
        currency_stats = {}
        for currency_code, currency_name in Invoice.Currency.choices:
            currency_invoices = queryset.filter(currency=currency_code)
            currency_stats[currency_code] = {
                'name': currency_name,
                'count': currency_invoices.count(),
                'total_amount': sum(invoice.total_amount for invoice in currency_invoices)
            }
        
        return Response({
            'total_invoices': total_invoices,
            'total_amount': total_amount,
            'sales_by_type': {
                'stock': stock_sales,
                'order': order_sales
            },
            'sales_by_currency': currency_stats
        })


class InvoiceLineViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для просмотра строк счетов.
    Доступ ограничен теми же правами, что и для счетов.
    """
    queryset = InvoiceLine.objects.all()
    serializer_class = InvoiceLineSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrSalesManager]
    filter_backends = [DjangoFilterBackend]
    pagination_class = InvoicePagination
    
    def get_queryset(self):
        """Фильтруем строки счетов по правам доступа"""
        user = self.request.user
        queryset = InvoiceLine.objects.select_related('invoice__company', 'product')
        
        # Администраторы видят все
        if user.is_superuser or user.role == 'admin':
            pass
        
        # Менеджеры продаж видят строки счетов своих клиентов
        elif user.role == 'sales':
            queryset = queryset.filter(invoice__company__sales_manager=user)
        
        # Пользователи компаний видят только свои строки
        elif hasattr(user, 'profile') and hasattr(user.profile, 'company'):
            queryset = queryset.filter(invoice__company=user.profile.company)
        
        else:
            queryset = queryset.none()
        
        # Фильтруем только продажи
        if user.role != 'admin' and not user.is_superuser:
            queryset = queryset.filter(invoice__invoice_type=Invoice.InvoiceType.SALE)
        
        return queryset.order_by('-invoice__invoice_date', '-created_at')
