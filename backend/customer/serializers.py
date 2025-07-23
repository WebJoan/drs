from rest_framework import serializers
from .models import Company


class CompanyListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка компаний"""
    
    sales_manager_name = serializers.CharField(
        source='sales_manager.get_full_name',
        read_only=True
    )
    
    employees_count_actual = serializers.IntegerField(
        source='employees.count',
        read_only=True
    )
    
    class Meta:
        model = Company
        fields = [
            'id', 'ext_id', 'name', 'short_name', 'company_type', 'status',
            'industry', 'phone', 'email', 'sales_manager_name',
            'employees_count', 'employees_count_actual', 'created_at'
        ]


class CompanyDetailSerializer(serializers.ModelSerializer):
    """Детальный сериализатор для компании"""
    
    sales_manager_name = serializers.CharField(
        source='sales_manager.get_full_name',
        read_only=True
    )
    
    primary_contact = serializers.SerializerMethodField()
    active_employees_count = serializers.IntegerField(
        source='get_active_employees.count',
        read_only=True
    )
    
    class Meta:
        model = Company
        fields = [
            'id', 'ext_id', 'name', 'short_name', 'company_type', 'status',
            'inn', 'ogrn', 'legal_address', 'actual_address', 'website',
            'phone', 'email', 'industry', 'annual_revenue', 'employees_count',
            'sales_manager', 'sales_manager_name', 'notes', 'primary_contact',
            'active_employees_count', 'created_at', 'updated_at'
        ]
    
    def get_primary_contact(self, obj):
        """Возвращает основное контактное лицо"""
        contact = obj.get_primary_contact()
        if contact:
            return {
                'id': contact.id,
                'name': contact.get_full_name(),
                'email': contact.email,
                'phone': contact.phone,
                'position': contact.position
            }
        return None


class CompanyCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания компании"""
    
    class Meta:
        model = Company
        fields = [
            'name', 'short_name', 'company_type', 'status', 'inn', 'ogrn',
            'legal_address', 'actual_address', 'website', 'phone', 'email',
            'industry', 'annual_revenue', 'employees_count', 'sales_manager',
            'notes', 'ext_id'
        ]
    
    def validate_inn(self, value):
        """Валидация ИНН"""
        if value and len(value) not in [10, 12]:
            raise serializers.ValidationError("ИНН должен содержать 10 или 12 цифр")
        return value
    
    def validate_ogrn(self, value):
        """Валидация ОГРН"""
        if value and len(value) not in [13, 15]:
            raise serializers.ValidationError("ОГРН должен содержать 13 или 15 цифр")
        return value


class CompanyUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для обновления компании"""
    
    class Meta:
        model = Company
        fields = [
            'name', 'short_name', 'company_type', 'status', 'inn', 'ogrn',
            'legal_address', 'actual_address', 'website', 'phone', 'email',
            'industry', 'annual_revenue', 'employees_count', 'sales_manager',
            'notes'
        ]
    
    def validate_inn(self, value):
        """Валидация ИНН"""
        if value and len(value) not in [10, 12]:
            raise serializers.ValidationError("ИНН должен содержать 10 или 12 цифр")
        return value
    
    def validate_ogrn(self, value):
        """Валидация ОГРН"""
        if value and len(value) not in [13, 15]:
            raise serializers.ValidationError("ОГРН должен содержать 13 или 15 цифр")
        return value 