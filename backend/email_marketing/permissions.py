from rest_framework.permissions import BasePermission, SAFE_METHODS
from user.models import User


class AiEmailPermission(BasePermission):
    """
    Права доступа для AI Email системы:
    - Все аутентифицированные пользователи могут просматривать письма
    - Sales менеджеры могут создавать, редактировать и отправлять свои письма
    - Product менеджеры могут только просматривать
    - Администраторы имеют полный доступ
    """
    
    def has_permission(self, request, view):
        """Проверка прав на уровне view"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Администраторы имеют полный доступ
        if request.user.role == User.RoleChoices.ADMIN or request.user.is_superuser:
            return True
        
        # Sales менеджеры могут создавать и редактировать
        if request.user.role == User.RoleChoices.SALES_MANAGER:
            return True
        
        # Product менеджеры и обычные пользователи только чтение
        if request.user.role in [User.RoleChoices.PRODUCT_MANAGER, User.RoleChoices.USER]:
            return request.method in SAFE_METHODS
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """Проверка прав доступа к конкретному объекту"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Администраторы имеют полный доступ
        if request.user.role == User.RoleChoices.ADMIN or request.user.is_superuser:
            return True
        
        # Sales менеджеры могут редактировать только свои письма
        if request.user.role == User.RoleChoices.SALES_MANAGER:
            # Проверяем, является ли пользователь ответственным за это письмо
            if obj.sales_manager == request.user:
                return True
            # Если не ответственный, то только чтение
            return request.method in SAFE_METHODS
        
        # Product менеджеры и обычные пользователи только чтение
        if request.user.role in [User.RoleChoices.PRODUCT_MANAGER, User.RoleChoices.USER]:
            return request.method in SAFE_METHODS
        
        return False


class AiEmailAttachmentPermission(BasePermission):
    """
    Права доступа для вложений AI Email:
    - Наследуют права от соответствующего письма
    """
    
    def has_permission(self, request, view):
        """Проверка прав на уровне view"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Администраторы имеют полный доступ
        if request.user.role == User.RoleChoices.ADMIN or request.user.is_superuser:
            return True
        
        # Sales менеджеры могут создавать и редактировать
        if request.user.role == User.RoleChoices.SALES_MANAGER:
            return True
        
        # Product менеджеры и обычные пользователи только чтение
        if request.user.role in [User.RoleChoices.PRODUCT_MANAGER, User.RoleChoices.USER]:
            return request.method in SAFE_METHODS
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """Проверка прав доступа к конкретному вложению"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Администраторы имеют полный доступ
        if request.user.role == User.RoleChoices.ADMIN or request.user.is_superuser:
            return True
        
        # Sales менеджеры могут редактировать только вложения своих писем
        if request.user.role == User.RoleChoices.SALES_MANAGER:
            # Проверяем через связанное письмо
            if obj.ai_email.sales_manager == request.user:
                return True
            # Если не ответственный, то только чтение
            return request.method in SAFE_METHODS
        
        # Product менеджеры и обычные пользователи только чтение
        if request.user.role in [User.RoleChoices.PRODUCT_MANAGER, User.RoleChoices.USER]:
            return request.method in SAFE_METHODS
        
        return False