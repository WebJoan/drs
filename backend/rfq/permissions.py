from rest_framework.permissions import BasePermission, SAFE_METHODS


class RFQPermission(BasePermission):
    """
    Права доступа для RFQ:
    - Sales менеджеры могут создавать и редактировать свои RFQ
    - Product менеджеры могут просматривать все RFQ
    - Администраторы имеют полный доступ
    """
    
    def has_permission(self, request, view):
        """Проверка прав на уровне view"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Администраторы имеют полный доступ
        if request.user.role == 'admin' or request.user.is_superuser:
            return True
        
        # Sales и Product менеджеры имеют доступ
        if request.user.role in ['sales', 'product']:
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """Проверка прав на уровне объекта"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Администраторы имеют полный доступ
        if request.user.role == 'admin' or request.user.is_superuser:
            return True
        
        # Product менеджеры могут только читать
        if request.user.role == 'product':
            return request.method in SAFE_METHODS
        
        # Sales менеджеры могут редактировать только свои RFQ или RFQ своих компаний
        if request.user.role == 'sales':
            if request.method in SAFE_METHODS:
                return True
            # Проверяем, является ли пользователь автором RFQ или менеджером компании
            return (
                obj.sales_manager == request.user or 
                obj.company.sales_manager == request.user
            )
        
        return False


class QuotationPermission(BasePermission):
    """
    Права доступа для предложений:
    - Product менеджеры могут создавать и редактировать свои предложения
    - Sales менеджеры могут просматривать предложения для своих RFQ
    - Администраторы имеют полный доступ
    """
    
    def has_permission(self, request, view):
        """Проверка прав на уровне view"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Администраторы имеют полный доступ
        if request.user.role == 'admin' or request.user.is_superuser:
            return True
        
        # Sales и Product менеджеры имеют доступ
        if request.user.role in ['sales', 'product']:
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """Проверка прав на уровне объекта"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Администраторы имеют полный доступ
        if request.user.role == 'admin' or request.user.is_superuser:
            return True
        
        # Product менеджеры могут редактировать только свои предложения
        if request.user.role == 'product':
            if request.method in SAFE_METHODS:
                return True
            return obj.product_manager == request.user
        
        # Sales менеджеры могут только читать предложения для своих RFQ
        if request.user.role == 'sales':
            if request.method in SAFE_METHODS:
                return (
                    obj.rfq.sales_manager == request.user or
                    obj.rfq.company.sales_manager == request.user
                )
            return False
        
        return False 