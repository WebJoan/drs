from rest_framework import permissions
from django.utils.translation import gettext_lazy as _


class CanViewOwnSalesPermission(permissions.BasePermission):
    """
    Разрешение для просмотра собственных продаж.
    Клиенты могут видеть только свои продажи.
    Менеджеры продаж могут видеть продажи своих клиентов.
    Администраторы видят все продажи.
    """
    
    message = _('У вас нет прав для просмотра этих данных о продажах.')
    
    def has_permission(self, request, view):
        """Проверка основного разрешения"""
        # Только аутентифицированные пользователи
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Администраторы имеют полный доступ
        if request.user.is_superuser or request.user.role == 'admin':
            return True
        
        # Менеджеры продаж имеют доступ к продажам своих клиентов
        if request.user.role == 'sales':
            return True
        
        # Пользователи компаний имеют доступ к продажам своей компании
        if hasattr(request.user, 'profile') and hasattr(request.user.profile, 'company'):
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """Проверка разрешения на конкретный объект"""
        # Администраторы имеют полный доступ
        if request.user.is_superuser or request.user.role == 'admin':
            return True
        
        # Менеджеры продаж могут видеть продажи своих клиентов
        if request.user.role == 'sales':
            # Проверяем, что пользователь является менеджером для данной компании
            return obj.company.sales_manager == request.user
        
        # Пользователи компаний могут видеть только продажи своей компании
        if hasattr(request.user, 'profile') and hasattr(request.user.profile, 'company'):
            return obj.company == request.user.profile.company
        
        return False


class CanExportOwnSalesPermission(permissions.BasePermission):
    """
    Разрешение на экспорт собственных данных о продажах.
    """
    
    message = _('У вас нет прав для экспорта данных о продажах.')
    
    def has_permission(self, request, view):
        """Проверка разрешения на экспорт"""
        # Только аутентифицированные пользователи
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Администраторы имеют полный доступ
        if request.user.is_superuser or request.user.role == 'admin':
            return True
        
        # Менеджеры продаж могут экспортировать данные своих клиентов
        if request.user.role == 'sales':
            return True
        
        # Пользователи компаний могут экспортировать данные своей компании
        if hasattr(request.user, 'profile') and hasattr(request.user.profile, 'company'):
            return True
        
        return False


class IsOwnerOrSalesManager(permissions.BasePermission):
    """
    Разрешение для владельцев или менеджеров продаж.
    """
    
    def has_object_permission(self, request, view, obj):
        # Администраторы
        if request.user.is_superuser or request.user.role == 'admin':
            return True
        
        # Менеджеры продаж для своих клиентов
        if request.user.role == 'sales':
            return obj.company.sales_manager == request.user
        
        # Пользователи компаний для своих данных
        if hasattr(request.user, 'profile') and hasattr(request.user.profile, 'company'):
            return obj.company == request.user.profile.company
        
        return False