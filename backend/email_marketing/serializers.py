from rest_framework import serializers
from .models import AiEmail, AiEmailAttachment
from user.serializers import UserSimpleSerializer
from person.serializers import PersonSimpleSerializer


class AiEmailAttachmentSerializer(serializers.ModelSerializer):
    """Сериализатор для вложений AI Email"""
    
    class Meta:
        model = AiEmailAttachment
        fields = ['id', 'file', 'name', 'created_at']
        read_only_fields = ['created_at']


class AiEmailSerializer(serializers.ModelSerializer):
    """Сериализатор для просмотра AI Email"""
    sales_manager = UserSimpleSerializer(read_only=True)
    recipient = PersonSimpleSerializer(read_only=True)
    attachments = AiEmailAttachmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = AiEmail
        fields = [
            'id', 'subject', 'body', 'status', 'sales_manager', 
            'recipient', 'attachments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class AiEmailCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания AI Email"""
    sales_manager_id = serializers.IntegerField(write_only=True, required=False)
    recipient_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = AiEmail
        fields = [
            'subject', 'body', 'status', 'sales_manager_id', 'recipient_id'
        ]
    
    def validate_sales_manager_id(self, value):
        """Проверяем существование sales менеджера"""
        from user.models import User
        try:
            user = User.objects.get(id=value, role='sales')
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Sales менеджер с указанным ID не найден или не является sales менеджером")
    
    def create(self, validated_data):
        # Если sales_manager_id не указан, используем текущего пользователя
        if 'sales_manager_id' not in validated_data:
            validated_data['sales_manager'] = self.context['request'].user
        else:
            # Получаем объект пользователя по ID и устанавливаем его
            from user.models import User
            sales_manager_id = validated_data.pop('sales_manager_id')
            validated_data['sales_manager'] = User.objects.get(id=sales_manager_id, role='sales')
        
        validated_data['recipient_id'] = validated_data.pop('recipient_id')
        return super().create(validated_data)


class AiEmailUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для обновления AI Email"""
    
    class Meta:
        model = AiEmail
        fields = ['subject', 'body', 'status']


class AiEmailGenerateSerializer(serializers.Serializer):
    """Сериализатор для генерации AI Email"""
    recipient_id = serializers.IntegerField(help_text="ID получателя письма")
    context = serializers.CharField(
        help_text="Контекст для генерации письма (информация о товаре, предложении и т.д.)",
        required=False,
        allow_blank=True
    )
    tone = serializers.ChoiceField(
        choices=[
            ('formal', 'Формальный'),
            ('friendly', 'Дружелюбный'),
            ('professional', 'Профессиональный'),
            ('casual', 'Неформальный')
        ],
        default='professional',
        help_text="Тон письма"
    )
    purpose = serializers.ChoiceField(
        choices=[
            ('introduction', 'Знакомство'),
            ('offer', 'Предложение'),
            ('follow_up', 'Повторное обращение'),
            ('information', 'Информационное'),
            ('invitation', 'Приглашение')
        ],
        default='offer',
        help_text="Цель письма"
    )
    products = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="Список ID товаров для включения в письмо"
    )
    
    def validate_recipient_id(self, value):
        from person.models import Person
        if not Person.objects.filter(id=value).exists():
            raise serializers.ValidationError("Получатель с указанным ID не найден")
        return value
    
    def validate_products(self, value):
        if value:
            from goods.models import Product
            existing_products = Product.objects.filter(id__in=value).count()
            if existing_products != len(value):
                raise serializers.ValidationError("Некоторые товары с указанными ID не найдены")
        return value


class AiEmailPersonalizedGenerateSerializer(serializers.Serializer):
    """Сериализатор для генерации персонализированного AI Email с данными о продажах"""
    recipient_id = serializers.IntegerField(help_text="ID получателя письма")
    context = serializers.CharField(
        help_text="Контекст для генерации письма (информация о товаре, предложении и т.д.)",
        required=False,
        allow_blank=True
    )
    tone = serializers.ChoiceField(
        choices=[
            ('formal', 'Формальный'),
            ('friendly', 'Дружелюбный'),
            ('professional', 'Профессиональный'),
            ('casual', 'Неформальный')
        ],
        default='professional',
        help_text="Тон письма"
    )
    purpose = serializers.ChoiceField(
        choices=[
            ('introduction', 'Знакомство'),
            ('offer', 'Предложение'),
            ('follow_up', 'Повторное обращение'),
            ('information', 'Информационное'),
            ('invitation', 'Приглашение')
        ],
        default='offer',
        help_text="Цель письма"
    )
    products = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="Список ID товаров для включения в письмо"
    )
    include_sales_data = serializers.BooleanField(
        default=True,
        help_text="Включить данные о продажах для персонализации"
    )
    
    def validate_recipient_id(self, value):
        from person.models import Person
        if not Person.objects.filter(id=value).exists():
            raise serializers.ValidationError("Получатель с указанным ID не найден")
        return value
    
    def validate_products(self, value):
        if value:
            from goods.models import Product
            existing_products = Product.objects.filter(id__in=value).count()
            if existing_products != len(value):
                raise serializers.ValidationError("Некоторые товары с указанными ID не найдены")
        return value


class AiEmailAttachmentCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания вложений AI Email"""
    ai_email_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = AiEmailAttachment
        fields = ['file', 'name', 'ai_email_id']
    
    def create(self, validated_data):
        validated_data['ai_email_id'] = validated_data.pop('ai_email_id')
        return super().create(validated_data)