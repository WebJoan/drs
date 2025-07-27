from rest_framework import serializers
from decimal import Decimal
from .models import (
    Currency, RFQ, RFQItem, RFQItemFile, 
    Quotation, QuotationItem
)
from .utils import PriceCalculator


class CurrencySerializer(serializers.ModelSerializer):
    """Сериализатор для валют"""
    
    class Meta:
        model = Currency
        fields = ['id', 'code', 'name', 'symbol', 'exchange_rate_to_rub', 'is_active']


class RFQItemFileSerializer(serializers.ModelSerializer):
    """Сериализатор для файлов строк RFQ"""
    
    file_size = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = RFQItemFile
        fields = [
            'id', 'rfq_item', 'file', 'file_type', 'description', 
            'file_size', 'file_url', 'uploaded_at'
        ]
    
    def get_file_size(self, obj):
        """Возвращает размер файла в байтах"""
        try:
            return obj.file.size
        except:
            return None
    
    def get_file_url(self, obj):
        """Возвращает URL файла"""
        try:
            return obj.file.url
        except:
            return None


class RFQItemListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка строк RFQ"""
    
    product_name_display = serializers.SerializerMethodField()
    manufacturer_display = serializers.SerializerMethodField()
    part_number_display = serializers.SerializerMethodField()
    product_code = serializers.SerializerMethodField()
    files_count = serializers.IntegerField(source='files.count', read_only=True)
    
    class Meta:
        model = RFQItem
        fields = [
            'id', 'line_number', 'product', 'product_name', 'manufacturer',
            'part_number', 'product_name_display', 'manufacturer_display', 
            'part_number_display', 'product_code', 'quantity', 'unit',
            'specifications', 'is_new_product', 'files_count'
        ]
    
    def get_product_name_display(self, obj):
        """Возвращает название товара для отображения"""
        if obj.product:
            return obj.product.name
        return obj.product_name or obj.part_number

    def get_manufacturer_display(self, obj):
        """Возвращает производителя для отображения"""
        if obj.product and obj.product.brand:
            return obj.product.brand.name
        return obj.manufacturer or '—'
    
    def get_part_number_display(self, obj):
        """Возвращает артикул для отображения"""
        if obj.product:
            return obj.product.name  # В модели Product поле name это Part number
        return obj.part_number or '—'
    
    def get_product_code(self, obj):
        """Возвращает код товара (ext_id)"""
        if obj.product and obj.product.ext_id:
            return obj.product.ext_id
        return '—'


class RFQItemDetailSerializer(serializers.ModelSerializer):
    """Детальный сериализатор для строк RFQ"""
    
    product_name_display = serializers.SerializerMethodField()
    manufacturer_display = serializers.SerializerMethodField()
    part_number_display = serializers.SerializerMethodField()
    product_code = serializers.SerializerMethodField()
    product_details = serializers.SerializerMethodField()
    files = RFQItemFileSerializer(many=True, read_only=True)
    
    class Meta:
        model = RFQItem
        fields = [
            'id', 'line_number', 'product', 'product_name', 'manufacturer',
            'part_number', 'product_name_display', 'manufacturer_display',
            'part_number_display', 'product_code', 'product_details',
            'quantity', 'unit', 'specifications', 'comments',
            'is_new_product', 'files', 'created_at'
        ]
    
    def get_product_name_display(self, obj):
        """Возвращает название товара для отображения"""
        if obj.product:
            return obj.product.name
        return obj.product_name or obj.part_number
    
    def get_manufacturer_display(self, obj):
        """Возвращает производителя для отображения"""
        if obj.product and obj.product.brand:
            return obj.product.brand.name
        return obj.manufacturer or '—'
    
    def get_part_number_display(self, obj):
        """Возвращает артикул для отображения"""
        if obj.product:
            return obj.product.name
        return obj.part_number or '—'
    
    def get_product_code(self, obj):
        """Возвращает код товара (ext_id)"""
        if obj.product and obj.product.ext_id:
            return obj.product.ext_id
        return '—'
    
    def get_product_details(self, obj):
        """Возвращает детали товара из базы"""
        if obj.product:
            return {
                'id': obj.product.id,
                'name': obj.product.name,
                'ext_id': obj.product.ext_id,
                'subgroup': obj.product.subgroup.name,
                'brand': obj.product.brand.name if obj.product.brand else None,
                'manager': obj.product.get_manager().get_full_name() if obj.product.get_manager() else None
            }
        return None


class RFQListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка RFQ"""
    
    company_name = serializers.CharField(source='company.name', read_only=True)
    sales_manager_name = serializers.CharField(
        source='sales_manager.get_full_name', 
        read_only=True
    )
    contact_person_name = serializers.CharField(
        source='contact_person.get_full_name',
        read_only=True
    )
    items_count = serializers.IntegerField(source='items.count', read_only=True)
    quotations_count = serializers.IntegerField(source='quotations.count', read_only=True)
    
    class Meta:
        model = RFQ
        fields = [
            'id', 'number', 'title', 'company', 'company_name',
            'sales_manager_name', 'contact_person_name', 'status',
            'priority', 'deadline', 'items_count', 'quotations_count',
            'created_at', 'updated_at'
        ]


class RFQDetailSerializer(serializers.ModelSerializer):
    """Детальный сериализатор для RFQ"""
    
    company_name = serializers.CharField(source='company.name', read_only=True)
    sales_manager_name = serializers.CharField(
        source='sales_manager.get_full_name', 
        read_only=True
    )
    contact_person_name = serializers.CharField(
        source='contact_person.get_full_name',
        read_only=True
    )
    items = RFQItemDetailSerializer(many=True, read_only=True)
    
    class Meta:
        model = RFQ
        fields = [
            'id', 'ext_id', 'number', 'title', 'company', 'company_name',
            'contact_person', 'contact_person_name', 'sales_manager',
            'sales_manager_name', 'status', 'priority', 'description',
            'deadline', 'delivery_address', 'payment_terms', 'delivery_terms',
            'notes', 'items', 'created_at', 'updated_at'
        ]


class RFQCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания RFQ"""
    
    class Meta:
        model = RFQ
        fields = [
            'title', 'company', 'contact_person', 'priority', 'description',
            'deadline', 'delivery_address', 'payment_terms', 'delivery_terms',
            'notes', 'ext_id'
        ]
    
    def validate(self, data):
        """Валидация на уровне объекта"""
        # Проверяем, что контактное лицо принадлежит выбранной компании
        contact_person = data.get('contact_person')
        company = data.get('company')
        
        if contact_person and company and contact_person.company != company:
            raise serializers.ValidationError({
                'contact_person': 'Контактное лицо должно принадлежать выбранной компании'
            })
        
        return data


class RFQItemCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания строк RFQ"""
    
    class Meta:
        model = RFQItem
        fields = [
            'line_number', 'product', 'product_name', 'manufacturer',
            'part_number', 'quantity', 'unit', 'specifications',
            'comments', 'is_new_product', 'ext_id'
        ]
    
    def validate(self, data):
        """Валидация на уровне объекта"""
        # Если товар не выбран из базы, то должны быть заполнены поля нового товара
        if not data.get('product') and not data.get('product_name'):
            raise serializers.ValidationError({
                'product_name': 'Необходимо выбрать товар из базы или указать название нового товара'
            })
        
        # Если товар выбран из базы, то поля нового товара должны быть пустыми
        if data.get('product') and data.get('product_name'):
            raise serializers.ValidationError({
                'product_name': 'Нельзя одновременно выбрать товар из базы и указать новый товар'
            })
        
        return data


class QuotationItemDetailSerializer(serializers.ModelSerializer):
    """Детальный сериализатор для строк предложения"""
    
    product_name_display = serializers.SerializerMethodField()
    rfq_item_details = serializers.SerializerMethodField()
    price_breakdown = serializers.SerializerMethodField()
    
    class Meta:
        model = QuotationItem
        fields = [
            'id', 'rfq_item', 'rfq_item_details', 'product',
            'proposed_product_name', 'proposed_manufacturer',
            'proposed_part_number', 'product_name_display',
            'quantity', 'unit_cost_price', 'cost_markup_percent',
            'unit_price', 'delivery_time', 'notes',
            'price_breakdown'
        ]
    
    def get_product_name_display(self, obj):
        """Возвращает название предлагаемого товара"""
        if obj.product:
            return obj.product.name
        return obj.proposed_product_name or obj.proposed_part_number
    
    def get_rfq_item_details(self, obj):
        """Возвращает детали строки RFQ"""
        rfq_item = obj.rfq_item
        return {
            'line_number': rfq_item.line_number,
            'requested_quantity': rfq_item.quantity,
            'product_name': rfq_item.product.name if rfq_item.product else rfq_item.product_name,
            'specifications': rfq_item.specifications
        }
    
    def get_price_breakdown(self, obj):
        """Возвращает детальную разбивку цены"""
        return PriceCalculator.calculate_price_breakdown(
            obj.unit_cost_price,
            obj.cost_markup_percent,
            obj.quantity
        )


class QuotationListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка предложений"""
    
    rfq_number = serializers.CharField(source='rfq.number', read_only=True)
    rfq_title = serializers.CharField(source='rfq.title', read_only=True)
    company_name = serializers.CharField(source='rfq.company.name', read_only=True)
    product_manager_name = serializers.CharField(
        source='product_manager.get_full_name', 
        read_only=True
    )
    currency_code = serializers.CharField(source='currency.code', read_only=True)
    items_count = serializers.IntegerField(source='items.count', read_only=True)
    total_amount = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    
    class Meta:
        model = Quotation
        fields = [
            'id', 'number', 'title', 'rfq', 'rfq_number', 'rfq_title',
            'company_name', 'product_manager_name', 'status',
            'currency_code', 'valid_until', 'items_count',
            'total_amount', 'created_at', 'updated_at'
        ]


class QuotationDetailSerializer(serializers.ModelSerializer):
    """Детальный сериализатор для предложений"""
    
    rfq_details = serializers.SerializerMethodField()
    product_manager_name = serializers.CharField(
        source='product_manager.get_full_name', 
        read_only=True
    )
    currency_details = CurrencySerializer(source='currency', read_only=True)
    items = QuotationItemDetailSerializer(many=True, read_only=True)
    total_amount = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    
    class Meta:
        model = Quotation
        fields = [
            'id', 'ext_id', 'number', 'title', 'rfq', 'rfq_details',
            'product_manager', 'product_manager_name', 'status',
            'currency', 'currency_details', 'description', 'valid_until',
            'delivery_time', 'payment_terms', 'delivery_terms',
            'notes', 'items', 'total_amount', 'created_at', 'updated_at'
        ]
    
    def get_rfq_details(self, obj):
        """Возвращает детали RFQ"""
        rfq = obj.rfq
        return {
            'id': rfq.id,
            'number': rfq.number,
            'title': rfq.title,
            'company_name': rfq.company.name,
            'contact_person': rfq.contact_person.get_full_name() if rfq.contact_person else None,
            'deadline': rfq.deadline
        }


class QuotationCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания предложений"""
    
    class Meta:
        model = Quotation
        fields = [
            'rfq', 'title', 'currency', 'description', 'valid_until',
            'delivery_time', 'payment_terms', 'delivery_terms',
            'notes', 'ext_id'
        ]


class QuotationItemCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания строк предложения"""
    
    class Meta:
        model = QuotationItem
        fields = [
            'rfq_item', 'product', 'proposed_product_name',
            'proposed_manufacturer', 'proposed_part_number',
            'quantity', 'unit_cost_price', 'cost_markup_percent',
            'delivery_time', 'notes', 'ext_id'
        ]
    
    def validate(self, data):
        """Валидация на уровне объекта"""
        # Проверяем, что либо выбран товар из базы, либо указаны поля нового товара
        if not data.get('product') and not data.get('proposed_product_name'):
            raise serializers.ValidationError({
                'proposed_product_name': 'Необходимо выбрать товар из базы или указать название предлагаемого товара'
            })
        
        return data 