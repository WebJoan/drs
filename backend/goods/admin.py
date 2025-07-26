from django.contrib import admin
from .models import Product, ProductSubgroup, ProductGroup, Brand


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'subgroup', 'brand', 'deleted_at')
    list_filter = ('deleted_at', 'subgroup', 'brand')
    search_fields = ('name', 'subgroup__name', 'brand__name')
    
    def get_queryset(self, request):
        # Показываем ВСЕ товары (включая удаленные) в админке
        return Product.global_objects.all()
    
    def has_delete_permission(self, request, obj=None):
        # Разрешаем "удаление" (soft delete)
        return True


admin.site.register(ProductSubgroup)
admin.site.register(ProductGroup)
admin.site.register(Brand)