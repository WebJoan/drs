import { useEffect } from 'react'
import Cookies from 'js-cookie'
import { Outlet, useRouter, useLocation } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { SearchProvider } from '@/context/search-context'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { CommandMenu } from '@/components/command-menu'
import SkipToMain from '@/components/skip-to-main'
import { useAuth } from '@/stores/authStore'
import { useCurrentUser } from '@/hooks/useAuth'

interface Props {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: Props) {
  const defaultOpen = Cookies.get('sidebar_state') !== 'false'
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const location = useLocation()
  
  // Проверяем, находимся ли мы на странице авторизации
  const isAuthPage = location.pathname === '/sign-in' || 
                     location.pathname === '/sign-up' ||
                     location.pathname === '/forgot-password' ||
                     location.pathname === '/otp'
  
  if (import.meta.env.DEV) {
    console.log('AuthenticatedLayout:', {
      pathname: location.pathname,
      isAuthPage,
      isAuthenticated,
      isLoading
    })
  }
  
  // Вызываем useCurrentUser ТОЛЬКО если мы НЕ на странице авторизации
  const userQuery = useCurrentUser()
  const isUserQueryLoading = !isAuthPage ? userQuery.isLoading : false
  
  // Общее состояние загрузки
  const isAnyLoading = isLoading || isUserQueryLoading
  
  useEffect(() => {
    // Если загрузка завершена и пользователь не авторизован, редиректим
    if (!isAnyLoading && !isAuthenticated && !isAuthPage) {
      router.navigate({ to: '/sign-in' })
    }
  }, [isAuthenticated, isAnyLoading, isAuthPage, router])
  
  // Если мы на странице авторизации, не показываем AuthenticatedLayout
  if (isAuthPage) {
    if (import.meta.env.DEV) {
      console.log('On auth page, rendering nothing from AuthenticatedLayout')
    }
    return null
  }
  
  // Показываем загрузку, пока проверяем авторизацию
  if (isAnyLoading) {
    if (import.meta.env.DEV) {
      console.log('Loading state, showing spinner')
    }
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  // Если пользователь не авторизован, ничего не показываем
  // (будет редирект на страницу авторизации)
  if (!isAuthenticated || !user) {
    if (import.meta.env.DEV) {
      console.log('Not authenticated, rendering nothing')
    }
    return null
  }
  
  if (import.meta.env.DEV) {
    console.log('Rendering authenticated layout')
  }
  return (
    <SearchProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <SkipToMain />
        <AppSidebar />
        <div
          id='content'
          className={cn(
            'ml-auto w-full max-w-full',
            'peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]',
            'peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]',
            'sm:transition-[width] sm:duration-200 sm:ease-linear',
            'flex h-svh flex-col',
            'group-data-[scroll-locked=1]/body:h-full',
            'has-[main.fixed-main]:group-data-[scroll-locked=1]/body:h-svh'
          )}
        >
          {children ? children : <Outlet />}
        </div>
        <CommandMenu />
      </SidebarProvider>
    </SearchProvider>
  )
}
