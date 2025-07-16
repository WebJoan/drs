import { ReactNode } from 'react'
import { Navigate } from '@tanstack/react-router'
import { useAuth } from '@/stores/authStore'
import { UserRole } from '@/lib/types'

interface RoleGuardProps {
  children: ReactNode
  requiredRoles: UserRole[]
  fallbackPath?: string
}

export function RoleGuard({ 
  children, 
  requiredRoles, 
  fallbackPath = '/403' 
}: RoleGuardProps) {
  const { user, isAuthenticated } = useAuth()

  // Если пользователь не аутентифицирован, перенаправляем на страницу входа
  if (!isAuthenticated || !user) {
    return <Navigate to="/sign-in" />
  }

  // Если роль пользователя не входит в требуемые роли
  if (!requiredRoles.includes(user.role)) {
    return <Navigate to={fallbackPath} />
  }

  return <>{children}</>
}

// Вспомогательные компоненты для конкретных ролей
export function AdminGuard({ children }: { children: ReactNode }) {
  return (
    <RoleGuard requiredRoles={[UserRole.ADMIN]}>
      {children}
    </RoleGuard>
  )
}

export function ProductManagerGuard({ children }: { children: ReactNode }) {
  return (
    <RoleGuard requiredRoles={[UserRole.ADMIN, UserRole.PRODUCT_MANAGER]}>
      {children}
    </RoleGuard>
  )
}

export function SalesManagerGuard({ children }: { children: ReactNode }) {
  return (
    <RoleGuard requiredRoles={[UserRole.ADMIN, UserRole.SALES_MANAGER]}>
      {children}
    </RoleGuard>
  )
}

// Хук для проверки ролей в компонентах
export function useRoleCheck() {
  const { user } = useAuth()

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false
    return roles.includes(user.role)
  }

  const isAdmin = (): boolean => hasRole([UserRole.ADMIN])
  const isProductManager = (): boolean => hasRole([UserRole.ADMIN, UserRole.PRODUCT_MANAGER])
  const isSalesManager = (): boolean => hasRole([UserRole.ADMIN, UserRole.SALES_MANAGER])

  return {
    hasRole,
    isAdmin,
    isProductManager,
    isSalesManager,
    userRole: user?.role || UserRole.USER
  }
} 