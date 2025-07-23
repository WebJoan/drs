from rest_framework import serializers
from .models import Person


class PersonListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка контактных лиц"""
    
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    
    class Meta:
        model = Person
        fields = [
            'id', 'ext_id', 'full_name', 'email', 'phone', 'position',
            'company', 'company_name', 'status', 'is_primary_contact',
            'created_at'
        ]


class PersonDetailSerializer(serializers.ModelSerializer):
    """Детальный сериализатор для контактного лица"""
    
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Person
        fields = [
            'id', 'ext_id', 'first_name', 'last_name', 'middle_name',
            'full_name', 'email', 'phone', 'position', 'department',
            'company', 'company_name', 'company_details', 'status',
            'is_primary_contact', 'notes', 'created_at', 'updated_at'
        ]
    
    def get_company_details(self, obj):
        """Возвращает детали компании"""
        return {
            'id': obj.company.id,
            'name': obj.company.name,
            'short_name': obj.company.short_name,
            'company_type': obj.company.company_type,
            'industry': obj.company.industry
        }


class PersonCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания контактного лица"""
    
    class Meta:
        model = Person
        fields = [
            'first_name', 'last_name', 'middle_name', 'email', 'phone',
            'position', 'department', 'company', 'status',
            'is_primary_contact', 'notes', 'ext_id'
        ]
    
    def validate_email(self, value):
        """Валидация email на уникальность"""
        if Person.objects.filter(email=value).exists():
            raise serializers.ValidationError("Контакт с таким email уже существует")
        return value
    
    def validate(self, data):
        """Валидация на уровне объекта"""
        # Проверяем, что у компании может быть только один основной контакт
        if data.get('is_primary_contact'):
            company = data.get('company')
            if company and company.get_primary_contact():
                raise serializers.ValidationError({
                    'is_primary_contact': 'У компании уже есть основной контакт'
                })
        return data


class PersonUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для обновления контактного лица"""
    
    class Meta:
        model = Person
        fields = [
            'first_name', 'last_name', 'middle_name', 'email', 'phone',
            'position', 'department', 'status', 'is_primary_contact', 'notes'
        ]
    
    def validate_email(self, value):
        """Валидация email на уникальность"""
        # Исключаем текущий объект из проверки
        instance = getattr(self, 'instance', None)
        if instance and instance.email == value:
            return value
        
        if Person.objects.filter(email=value).exists():
            raise serializers.ValidationError("Контакт с таким email уже существует")
        return value
    
    def validate(self, data):
        """Валидация на уровне объекта"""
        # Проверяем, что у компании может быть только один основной контакт
        if data.get('is_primary_contact'):
            instance = getattr(self, 'instance', None)
            if instance and instance.company:
                primary_contact = instance.company.get_primary_contact()
                if primary_contact and primary_contact.id != instance.id:
                    raise serializers.ValidationError({
                        'is_primary_contact': 'У компании уже есть основной контакт'
                    })
        return data 