from rest_framework.permissions import BasePermission, SAFE_METHODS


class PersonPermission(BasePermission):
    """
    Права доступа для контактных лиц:
    - Sales менеджеры могут управлять контактами своих компаний, но НЕ УДАЛЯТЬ
    - Product менеджеры могут только просматривать
    - Администраторы имеют полный доступ, включая удаление
    """
    
    def has_permission(self, request, view):
        """Проверка прав на уровне view"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Только администраторы могут удалять
        if request.method == 'DELETE':
            return request.user.role == 'admin' or request.user.is_superuser
        
        # Администраторы имеют полный доступ
        if request.user.role == 'admin' or request.user.is_superuser:
            return True
        
        # Sales и Product менеджеры могут просматривать
        if request.user.role in ['sales', 'product']:
            # Sales менеджеры могут создавать и редактировать
            if request.user.role == 'sales':
                return True
            # Product менеджеры только читают
            elif request.user.role == 'product':
                return request.method in SAFE_METHODS
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """Проверка прав на уровне объекта"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Только администраторы могут удалять
        if request.method == 'DELETE':
            return request.user.role == 'admin' or request.user.is_superuser
        
        # Администраторы имеют полный доступ
        if request.user.role == 'admin' or request.user.is_superuser:
            return True
        
        # Product менеджеры могут только читать
        if request.user.role == 'product':
            return request.method in SAFE_METHODS
        
        # Sales менеджеры могут редактировать контакты только своих компаний, но не удалять
        if request.user.role == 'sales':
            if request.method in SAFE_METHODS:
                return True
            return obj.company.sales_manager == request.user
        
        return False 