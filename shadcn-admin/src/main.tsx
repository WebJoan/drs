import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { AxiosError } from 'axios'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { handleServerError } from '@/utils/handle-server-error'
import { FontProvider } from './context/font-context'
import { ThemeProvider } from './context/theme-context'
import './index.css'
// Generated Routes
import { routeTree } from './routeTree.gen'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // eslint-disable-next-line no-console
        if (import.meta.env.DEV) console.log({ failureCount, error })

        if (failureCount >= 0 && import.meta.env.DEV) return false
        if (failureCount > 3 && import.meta.env.PROD) return false

        return !(
          error instanceof AxiosError &&
          [401, 403].includes(error.response?.status ?? 0)
        )
      },
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000, // 10s
    },
    mutations: {
      onError: (error) => {
        handleServerError(error)

        if (error instanceof AxiosError) {
          if (error.response?.status === 304) {
            toast.error('Контент не изменён!')
          }
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof AxiosError) {
        // Проверяем, находимся ли на странице авторизации
        const isAuthPage = window.location.pathname === '/sign-in' || 
                           window.location.pathname === '/sign-up' ||
                           window.location.pathname === '/forgot-password' ||
                           window.location.pathname === '/otp'
        
        if (import.meta.env.DEV) {
          console.log('QueryCache onError:', {
            status: error.response?.status,
            pathname: window.location.pathname,
            isAuthPage,
            shouldShowToast: error.response?.status === 401 && !isAuthPage
          })
        }
        
        // Полностью игнорируем ошибки 401 на страницах авторизации
        if (error.response?.status === 401) {
          if (!isAuthPage) {
            toast.error('Сессия истекла!')
            useAuthStore.getState().reset()
            // Не добавляем redirect если мы уже на странице авторизации
            const currentPath = router.history.location.pathname
            if (!currentPath.startsWith('/sign-in') && !currentPath.startsWith('/sign-up')) {
              router.navigate({ to: '/sign-in', search: { redirect: currentPath } })
            } else {
              router.navigate({ to: '/sign-in' })
            }
          }
          // Если мы на странице авторизации, просто игнорируем ошибку
          return
        }
        
        if (error.response?.status === 500) {
          toast.error('Внутренняя ошибка сервера!')
          router.navigate({ to: '/500' })
        }
        if (error.response?.status === 403) {
          toast.error('Доступ запрещен!')
          // router.navigate("/forbidden", { replace: true });
        }
      }
    },
  }),
})

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme='light' storageKey='vite-ui-theme'>
          <FontProvider>
            <RouterProvider router={router} />
          </FontProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}
