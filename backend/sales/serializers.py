from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from .models import Invoice, InvoiceLine
from goods.models import Product
from customer.models import Company


class ProductSimpleSerializer(serializers.ModelSerializer):
    """Упрощенный сериализатор товара для отображения в продажах"""
    
    class Meta:
        model = Product
        fields = ['id', 'ext_id', 'name', 'article']


class CompanySimpleSerializer(serializers.ModelSerializer):
    """Упрощенный сериализатор компании"""
    
    class Meta:
        model = Company
        fields = ['id', 'ext_id', 'name', 'short_name']


class InvoiceLineSerializer(serializers.ModelSerializer):
    """Сериализатор строки счета"""
    product = ProductSimpleSerializer(read_only=True)
    total_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = InvoiceLine
        fields = ['id', 'ext_id', 'product', 'quantity', 'price', 'total_price', 'created_at']


class InvoiceSerializer(serializers.ModelSerializer):
    """Сериализатор счета"""
    lines = InvoiceLineSerializer(many=True, read_only=True)
    company = CompanySimpleSerializer(read_only=True)
    total_amount = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    invoice_type_display = serializers.CharField(source='get_invoice_type_display', read_only=True)
    sale_type_display = serializers.CharField(source='get_sale_type_display', read_only=True)
    currency_display = serializers.CharField(source='get_currency_display', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'ext_id', 'invoice_number', 'invoice_date', 'company',
            'invoice_type', 'invoice_type_display',
            'sale_type', 'sale_type_display',
            'currency', 'currency_display',
            'total_amount', 'lines', 'created_at', 'updated_at'
        ]


class InvoiceListSerializer(serializers.ModelSerializer):
    """Упрощенный сериализатор для списка счетов (без строк)"""
    company = CompanySimpleSerializer(read_only=True)
    total_amount = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    invoice_type_display = serializers.CharField(source='get_invoice_type_display', read_only=True)
    sale_type_display = serializers.CharField(source='get_sale_type_display', read_only=True)
    currency_display = serializers.CharField(source='get_currency_display', read_only=True)
    lines_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'ext_id', 'invoice_number', 'invoice_date', 'company',
            'invoice_type', 'invoice_type_display',
            'sale_type', 'sale_type_display',
            'currency', 'currency_display',
            'total_amount', 'lines_count', 'created_at'
        ]


class SalesExportRequestSerializer(serializers.Serializer):
    """Сериализатор для запроса экспорта продаж"""
    date_from = serializers.DateField(
        required=False,
        help_text=_("Начальная дата для экспорта (если не указана, экспортируются все)")
    )
    date_to = serializers.DateField(
        required=False,
        help_text=_("Конечная дата для экспорта (если не указана, до текущей даты)")
    )
    format = serializers.ChoiceField(
        choices=[('excel', 'Excel'), ('csv', 'CSV'), ('json', 'JSON')],
        default='excel',
        help_text=_("Формат экспорта")
    )
    include_lines = serializers.BooleanField(
        default=True,
        help_text=_("Включать строки счетов в экспорт")
    )
    
    def validate(self, data):
        """Валидация данных экспорта"""
        date_from = data.get('date_from')
        date_to = data.get('date_to')
        
        if date_from and date_to and date_from > date_to:
            raise serializers.ValidationError({
                'date_from': _('Начальная дата не может быть больше конечной')
            })
        
        return data