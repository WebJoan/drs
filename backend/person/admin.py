from django.contrib import admin
from .models import Person


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = [
        'get_full_name', 'company', 'email', 'position', 
        'is_primary_contact', 'status', 'created_at'
    ]
    list_filter = ['status', 'is_primary_contact', 'company__company_type']
    search_fields = ['first_name', 'last_name', 'email', 'company__name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Личная информация', {
            'fields': ('first_name', 'last_name', 'middle_name', 'ext_id')
        }),
        ('Компания', {
            'fields': ('company', 'position', 'department')
        }),
        ('Контактная информация', {
            'fields': ('email', 'phone')
        }),
        ('Статус', {
            'fields': ('status', 'is_primary_contact')
        }),
        ('Заметки', {
            'fields': ('notes',)
        }),
        ('Служебная информация', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_full_name(self, obj):
        return obj.get_full_name()
    get_full_name.short_description = 'Полное имя' 