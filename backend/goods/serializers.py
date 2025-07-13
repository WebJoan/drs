from rest_framework import serializers
from .models import Product, Brand, ProductSubgroup, ProductGroup
from user.serializers import UserSimpleSerializer


class ProductGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductGroup
        fields = ['id', 'name', 'ext_id']


class BrandSerializer(serializers.ModelSerializer):
    product_manager = UserSimpleSerializer(read_only=True)
    product_manager_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Brand
        fields = ['id', 'name', 'ext_id', 'product_manager', 'product_manager_id']


class ProductSubgroupSerializer(serializers.ModelSerializer):
    group = ProductGroupSerializer(read_only=True)
    group_id = serializers.IntegerField(write_only=True)
    product_manager = UserSimpleSerializer(read_only=True)
    product_manager_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = ProductSubgroup
        fields = ['id', 'name', 'ext_id', 'group', 'group_id', 'product_manager', 'product_manager_id']


class ProductSerializer(serializers.ModelSerializer):
    subgroup = ProductSubgroupSerializer(read_only=True)
    subgroup_id = serializers.IntegerField(write_only=True)
    brand = BrandSerializer(read_only=True)
    brand_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    product_manager = UserSimpleSerializer(read_only=True)
    product_manager_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    responsible_manager = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'ext_id', 
            'subgroup', 'subgroup_id',
            'brand', 'brand_id',
            'product_manager', 'product_manager_id',
            'responsible_manager'
        ]
    
    def get_responsible_manager(self, obj):
        manager = obj.get_manager()
        if manager:
            return UserSimpleSerializer(manager).data
        return None


class ProductCreateSerializer(serializers.ModelSerializer):
    subgroup_id = serializers.IntegerField(write_only=True)
    brand_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    product_manager_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Product
        fields = ['name', 'subgroup_id', 'brand_id', 'product_manager_id']
    
    def validate_subgroup_id(self, value):
        if not ProductSubgroup.objects.filter(id=value).exists():
            raise serializers.ValidationError("Подгруппа не найдена")
        return value
    
    def validate_brand_id(self, value):
        if value and not Brand.objects.filter(id=value).exists():
            raise serializers.ValidationError("Бренд не найден")
        return value
    
    def create(self, validated_data):
        # Получаем ID и преобразуем в объекты
        subgroup_id = validated_data.pop('subgroup_id')
        brand_id = validated_data.pop('brand_id', None)
        product_manager_id = validated_data.pop('product_manager_id', None)
        
        # Создаем продукт с правильными связями
        product = Product.objects.create(
            subgroup_id=subgroup_id,
            brand_id=brand_id,
            product_manager_id=product_manager_id,
            **validated_data
        )
        return product


class ProductUpdateSerializer(serializers.ModelSerializer):
    subgroup_id = serializers.IntegerField(write_only=True, required=False)
    brand_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    product_manager_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Product
        fields = ['name', 'subgroup_id', 'brand_id', 'product_manager_id']
        
    def validate_subgroup_id(self, value):
        if value and not ProductSubgroup.objects.filter(id=value).exists():
            raise serializers.ValidationError("Подгруппа не найдена")
        return value
    
    def validate_brand_id(self, value):
        if value and not Brand.objects.filter(id=value).exists():
            raise serializers.ValidationError("Бренд не найден")
        return value
    
    def update(self, instance, validated_data):
        # Обновляем поля, если они переданы
        if 'subgroup_id' in validated_data:
            instance.subgroup_id = validated_data.pop('subgroup_id')
        if 'brand_id' in validated_data:
            instance.brand_id = validated_data.pop('brand_id')
        if 'product_manager_id' in validated_data:
            instance.product_manager_id = validated_data.pop('product_manager_id')
        
        # Обновляем остальные поля
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance 