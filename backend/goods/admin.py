from django.contrib import admin
from .models import Product, ProductSubgroup, ProductGroup, Brand

admin.site.register(Product)
admin.site.register(ProductSubgroup)
admin.site.register(ProductGroup)
admin.site.register(Brand)