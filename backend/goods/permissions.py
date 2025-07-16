from rest_framework import permissions
from user.models import User


class ProductPermission(permissions.BasePermission):
    """
    Кастомные разрешения для работы с товарами на основе ролей:
    - ADMIN: полный доступ ко всем операциям
    - PRODUCT_MANAGER: полный доступ ко всем операциям
    - SALES_MANAGER: только чтение (просмотр товаров)
    - USER: только чтение (просмотр товаров)
    """
    
    def has_permission(self, request, view):
        # Базовая проверка аутентификации
        if not request.user or not request.user.is_authenticated:
            return False
        
        user_role = getattr(request.user, 'role', User.RoleChoices.USER)
        
        # Админы и продукт-менеджеры имеют полный доступ
        if user_role in [User.RoleChoices.ADMIN, User.RoleChoices.PRODUCT_MANAGER]:
            return True
        
        # Sales менеджеры и обычные пользователи только просмотр
        if user_role in [User.RoleChoices.SALES_MANAGER, User.RoleChoices.USER]:
            # Разрешены только GET запросы (список и детали)
            return request.method in permissions.SAFE_METHODS
        
        return False
    
    def has_object_permission(self, request, view, obj):
        # Проверяем доступ к конкретному объекту
        if not request.user or not request.user.is_authenticated:
            return False
            
        user_role = getattr(request.user, 'role', User.RoleChoices.USER)
        
        # Админы имеют доступ ко всему
        if user_role == User.RoleChoices.ADMIN:
            return True
        
        # Продукт-менеджеры могут редактировать только свои товары
        if user_role == User.RoleChoices.PRODUCT_MANAGER:
            # Проверяем, является ли пользователь ответственным за этот товар
            if (obj.product_manager == request.user or 
                obj.subgroup.product_manager == request.user or
                obj.brand.product_manager == request.user):
                return True
            # Если не ответственный, то только чтение
            return request.method in permissions.SAFE_METHODS
        
        # Sales менеджеры и обычные пользователи только просмотр
        if user_role in [User.RoleChoices.SALES_MANAGER, User.RoleChoices.USER]:
            return request.method in permissions.SAFE_METHODS
        
        return False


class BrandPermission(permissions.BasePermission):
    """
    Разрешения для работы с брендами
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        user_role = getattr(request.user, 'role', User.RoleChoices.USER)
        
        # Админы и продукт-менеджеры могут создавать/редактировать бренды
        if user_role in [User.RoleChoices.ADMIN, User.RoleChoices.PRODUCT_MANAGER]:
            return True
        
        # Sales менеджеры и пользователи только просмотр
        return request.method in permissions.SAFE_METHODS


class ProductGroupPermission(permissions.BasePermission):
    """
    Разрешения для работы с группами товаров
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        user_role = getattr(request.user, 'role', User.RoleChoices.USER)
        
        # Админы и продукт-менеджеры могут создавать/редактировать группы
        if user_role in [User.RoleChoices.ADMIN, User.RoleChoices.PRODUCT_MANAGER]:
            return True
        
        # Sales менеджеры и пользователи только просмотр
        return request.method in permissions.SAFE_METHODS 