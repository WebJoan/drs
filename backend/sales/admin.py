from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from .models import Invoice, InvoiceLine


class InvoiceLineInline(admin.TabularInline):
    """Inline для строк счета"""
    model = InvoiceLine
    extra = 0
    readonly_fields = ('total_price', 'created_at')
    fields = ('product', 'quantity', 'price', 'total_price', 'ext_id')
    
    def total_price(self, obj):
        if obj.pk:
            return f"{obj.total_price} {obj.invoice.currency}"
        return "-"
    total_price.short_description = _('Сумма')


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    """Администрирование счетов"""
    list_display = (
        'invoice_number', 'invoice_date', 'company', 'invoice_type_badge', 
        'sale_type_badge', 'currency', 'total_amount_display', 'created_at'
    )
    list_filter = (
        'invoice_type', 'sale_type', 'currency', 'invoice_date', 'created_at'
    )
    search_fields = (
        'invoice_number', 'company__name', 'company__short_name', 'ext_id'
    )
    readonly_fields = ('total_amount', 'created_at', 'updated_at')
    inlines = [InvoiceLineInline]
    
    fieldsets = (
        (_('Основная информация'), {
            'fields': ('invoice_number', 'invoice_date', 'company', 'ext_id')
        }),
        (_('Тип и валюта'), {
            'fields': ('invoice_type', 'sale_type', 'currency')
        }),
        (_('Итоги'), {
            'fields': ('total_amount',),
            'classes': ('collapse',)
        }),
        (_('Системная информация'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def invoice_type_badge(self, obj):
        """Отображение типа счета с цветной меткой"""
        colors = {
            'purchase': '#28a745',  # зеленый
            'sale': '#007bff',      # синий
        }
        color = colors.get(obj.invoice_type, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_invoice_type_display()
        )
    invoice_type_badge.short_description = _('Тип счета')
    
    def sale_type_badge(self, obj):
        """Отображение типа продажи с цветной меткой"""
        if not obj.sale_type:
            return '-'
        
        colors = {
            'stock': '#ffc107',  # желтый
            'order': '#dc3545',  # красный
        }
        color = colors.get(obj.sale_type, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_sale_type_display()
        )
    sale_type_badge.short_description = _('Тип продажи')
    
    def total_amount_display(self, obj):
        """Отображение общей суммы с валютой"""
        return f"{obj.total_amount} {obj.currency}"
    total_amount_display.short_description = _('Сумма')
    
    def get_queryset(self, request):
        """Оптимизируем запросы"""
        return super().get_queryset(request).select_related('company').prefetch_related('lines')


@admin.register(InvoiceLine)
class InvoiceLineAdmin(admin.ModelAdmin):
    """Администрирование строк счетов"""
    list_display = (
        'invoice_number', 'product', 'quantity', 'price', 
        'total_price_display', 'invoice_date', 'created_at'
    )
    list_filter = (
        'invoice__invoice_type', 'invoice__sale_type', 'invoice__currency',
        'invoice__invoice_date', 'created_at'
    )
    search_fields = (
        'invoice__invoice_number', 'product__name', 'product__article', 'ext_id'
    )
    readonly_fields = ('total_price', 'created_at', 'updated_at')
    
    fieldsets = (
        (_('Основная информация'), {
            'fields': ('invoice', 'product', 'ext_id')
        }),
        (_('Количество и цена'), {
            'fields': ('quantity', 'price', 'total_price')
        }),
        (_('Системная информация'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def invoice_number(self, obj):
        """Номер счета"""
        return obj.invoice.invoice_number
    invoice_number.short_description = _('Номер счета')
    invoice_number.admin_order_field = 'invoice__invoice_number'
    
    def invoice_date(self, obj):
        """Дата счета"""
        return obj.invoice.invoice_date
    invoice_date.short_description = _('Дата счета')
    invoice_date.admin_order_field = 'invoice__invoice_date'
    
    def total_price_display(self, obj):
        """Отображение общей стоимости с валютой"""
        return f"{obj.total_price} {obj.invoice.currency}"
    total_price_display.short_description = _('Сумма')
    
    def get_queryset(self, request):
        """Оптимизируем запросы"""
        return super().get_queryset(request).select_related('invoice', 'product')
