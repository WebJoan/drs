from django.contrib import admin
from .models import (
    Currency, RFQ, RFQItem, RFQItemFile,
    Quotation, QuotationItem
)


@admin.register(Currency)
class CurrencyAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'symbol', 'exchange_rate_to_rub', 'is_active', 'updated_at']
    list_filter = ['is_active']
    search_fields = ['code', 'name']
    readonly_fields = ['updated_at']


class RFQItemInline(admin.TabularInline):
    model = RFQItem
    extra = 0
    fields = ['line_number', 'product', 'product_name', 'quantity', 'unit', 'is_new_product']
    readonly_fields = ['line_number']


@admin.register(RFQ)
class RFQAdmin(admin.ModelAdmin):
    list_display = [
        'number', 'title', 'company', 'sales_manager', 
        'status', 'priority', 'deadline', 'created_at'
    ]
    list_filter = ['status', 'priority', 'company__company_type']
    search_fields = ['number', 'title', 'company__name']
    readonly_fields = ['number', 'created_at', 'updated_at']
    inlines = [RFQItemInline]
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('number', 'title', 'status', 'priority', 'ext_id')
        }),
        ('Участники', {
            'fields': ('company', 'contact_person', 'sales_manager')
        }),
        ('Сроки', {
            'fields': ('deadline',)
        }),
        ('Условия', {
            'fields': ('delivery_address', 'payment_terms', 'delivery_terms')
        }),
        ('Описание', {
            'fields': ('description', 'notes')
        }),
        ('Служебная информация', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(RFQItem)
class RFQItemAdmin(admin.ModelAdmin):
    list_display = [
        'rfq', 'line_number', 'get_product_name', 'quantity', 
        'unit', 'is_new_product', 'created_at'
    ]
    list_filter = ['is_new_product', 'rfq__status']
    search_fields = ['rfq__number', 'product__name', 'product_name', 'part_number']
    
    def get_product_name(self, obj):
        return obj.product.name if obj.product else obj.product_name
    get_product_name.short_description = 'Товар'


class QuotationItemInline(admin.TabularInline):
    model = QuotationItem
    extra = 0
    fields = [
        'rfq_item', 'product', 'proposed_product_name', 
        'quantity', 'unit_cost_price', 'cost_markup_percent', 'unit_price'
    ]
    readonly_fields = ['unit_price']


@admin.register(Quotation)
class QuotationAdmin(admin.ModelAdmin):
    list_display = [
        'number', 'title', 'rfq', 'product_manager', 
        'status', 'currency', 'total_amount', 'created_at'
    ]
    list_filter = ['status', 'currency']
    search_fields = ['number', 'title', 'rfq__number']
    readonly_fields = ['number', 'total_amount', 'created_at', 'updated_at']
    inlines = [QuotationItemInline]
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('number', 'title', 'rfq', 'status', 'ext_id')
        }),
        ('Участники', {
            'fields': ('product_manager',)
        }),
        ('Валюта и сроки', {
            'fields': ('currency', 'valid_until', 'delivery_time')
        }),
        ('Условия', {
            'fields': ('payment_terms', 'delivery_terms')
        }),
        ('Описание', {
            'fields': ('description', 'notes')
        }),
        ('Итоги', {
            'fields': ('total_amount',),
            'classes': ('collapse',)
        }),
        ('Служебная информация', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(QuotationItem)
class QuotationItemAdmin(admin.ModelAdmin):
    list_display = [
        'quotation', 'get_product_name', 'quantity', 
        'unit_cost_price', 'cost_markup_percent', 'unit_price', 'total_price'
    ]
    list_filter = ['quotation__status', 'quotation__currency']
    search_fields = ['quotation__number', 'product__name', 'proposed_product_name']
    readonly_fields = ['unit_price', 'total_price', 'total_cost_price', 'markup_amount']
    
    def get_product_name(self, obj):
        return obj.product.name if obj.product else obj.proposed_product_name
    get_product_name.short_description = 'Товар' 