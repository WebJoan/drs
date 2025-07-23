import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { UserRole } from '@/lib/types'
import { useAuth } from '@/stores/authStore'

interface RoleContextType {
  currentInterfaceRole: UserRole
  availableRoles: UserRole[]
  canSwitchToRole: (role: UserRole) => boolean
  switchToRole: (role: UserRole) => void
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

interface RoleProviderProps {
  children: ReactNode
}

export function RoleProvider({ children }: RoleProviderProps) {
  const { user } = useAuth()
  const [currentInterfaceRole, setCurrentInterfaceRole] = useState<UserRole>(UserRole.USER)

  // Определяем доступные роли для переключения на основе роли пользователя
  const getAvailableRoles = (userRole: UserRole): UserRole[] => {
    switch (userRole) {
      case UserRole.ADMIN:
        return [UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.PRODUCT_MANAGER]
      case UserRole.SALES_MANAGER:
        return [UserRole.SALES_MANAGER]
      case UserRole.PRODUCT_MANAGER:
        return [UserRole.PRODUCT_MANAGER]
      case UserRole.USER:
      default:
        return [UserRole.USER]
    }
  }

  const availableRoles = user ? getAvailableRoles(user.role) : [UserRole.USER]

  // Проверяем, может ли пользователь переключиться на указанную роль
  const canSwitchToRole = (role: UserRole): boolean => {
    return availableRoles.includes(role)
  }

  // Переключение интерфейса на другую роль
  const switchToRole = (role: UserRole) => {
    if (canSwitchToRole(role)) {
      setCurrentInterfaceRole(role)
      // Сохраняем выбор в localStorage
      localStorage.setItem('selectedInterfaceRole', role)
    }
  }

  // При загрузке восстанавливаем сохраненный выбор интерфейса
  useEffect(() => {
    if (user) {
      const savedRole = localStorage.getItem('selectedInterfaceRole') as UserRole
      if (savedRole && canSwitchToRole(savedRole)) {
        setCurrentInterfaceRole(savedRole)
      } else {
        // Если сохраненной роли нет или она недоступна, используем роль пользователя
        setCurrentInterfaceRole(user.role)
      }
    }
  }, [user])

  const value: RoleContextType = {
    currentInterfaceRole,
    availableRoles,
    canSwitchToRole,
    switchToRole,
  }

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole() {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
}

// Хук для проверки разрешений
export function usePermissions() {
  const { user } = useAuth()
  const { currentInterfaceRole } = useRole()

  const canCreateProducts = () => {
    if (!user) return false
    return user.role === UserRole.ADMIN || user.role === UserRole.PRODUCT_MANAGER
  }

  const canEditProducts = () => {
    if (!user) return false
    return user.role === UserRole.ADMIN || user.role === UserRole.PRODUCT_MANAGER
  }

  const canDeleteProducts = () => {
    if (!user) return false
    return user.role === UserRole.ADMIN || user.role === UserRole.PRODUCT_MANAGER
  }

  const canViewUsers = () => {
    if (!user) return false
    return user.role === UserRole.ADMIN
  }

  const canManageUsers = () => {
    if (!user) return false
    return user.role === UserRole.ADMIN
  }

  return {
    canCreateProducts,
    canEditProducts,
    canDeleteProducts,
    canViewUsers,
    canManageUsers,
    user,
    currentInterfaceRole,
  }
} 