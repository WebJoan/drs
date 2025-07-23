from django.contrib import admin
from .models import Company


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'short_name', 'company_type', 'status', 
        'sales_manager', 'industry', 'created_at'
    ]
    list_filter = ['company_type', 'status', 'industry', 'sales_manager']
    search_fields = ['name', 'short_name', 'inn', 'email']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'short_name', 'company_type', 'status', 'ext_id')
        }),
        ('Контактная информация', {
            'fields': ('phone', 'email', 'website')
        }),
        ('Адреса', {
            'fields': ('legal_address', 'actual_address')
        }),
        ('Юридическая информация', {
            'fields': ('inn', 'ogrn')
        }),
        ('Дополнительно', {
            'fields': ('industry', 'annual_revenue', 'employees_count', 'sales_manager')
        }),
        ('Заметки', {
            'fields': ('notes',)
        }),
        ('Служебная информация', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    ) 