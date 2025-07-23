import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useLocation } from '@tanstack/react-router'
import { toast } from 'sonner'
import apiClient from '@/lib/api-client'
import type { LoginData, RegisterData, User, ApiError } from '@/lib/types'
import { useAuthStore } from '@/stores/authStore'

// Получение текущего пользователя
export const useCurrentUser = () => {
  const { setUser, setLoading, user } = useAuthStore()
  const location = useLocation()
  
  // Не вызываем запрос на страницах авторизации
  const isAuthPage = location.pathname === '/sign-in' || 
                     location.pathname === '/sign-up' ||
                     location.pathname === '/forgot-password' ||
                     location.pathname === '/otp'
  
  // Если пользователь уже загружен, не делаем запрос
  const shouldFetch = !isAuthPage && !user
  
  if (import.meta.env.DEV) {
    console.log('useCurrentUser:', { 
      pathname: location.pathname, 
      isAuthPage, 
      user: !!user, 
      shouldFetch 
    })
  }
  
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<User> => {
      setLoading(true)
      try {
        const response = await apiClient.get<User>('/self/account/')
        setUser(response.data)
        return response.data
      } catch (error) {
        setUser(null)
        throw error
      } finally {
        setLoading(false)
      }
    },
    enabled: shouldFetch, // Не выполняем запрос на страницах авторизации или если пользователь уже загружен
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 минут
  })
}

// Проверка авторизации
export const useCheckAuth = () => {
  const { reset } = useAuthStore()
  const router = useRouter()
  
  return useQuery({
    queryKey: ['checkAuth'],
    queryFn: async (): Promise<void> => {
      try {
        await apiClient.get('/auth/check/')
      } catch (error) {
        reset()
        router.navigate({ to: '/sign-in' })
        throw error
      }
    },
    retry: false,
    refetchInterval: 5 * 60 * 1000, // Проверяем каждые 5 минут
  })
}

// Авторизация
export const useLogin = () => {
  const queryClient = useQueryClient()
  const { setUser } = useAuthStore()
  const router = useRouter()
  
  return useMutation({
    mutationFn: async (data: LoginData): Promise<void> => {
      await apiClient.post('/auth/login/', data)
    },
    onSuccess: async () => {
      // Получаем данные пользователя после успешной авторизации
      try {
        const response = await apiClient.get<User>('/self/account/')
        setUser(response.data)
        queryClient.invalidateQueries({ queryKey: ['currentUser'] })
        queryClient.invalidateQueries({ queryKey: ['checkAuth'] })
        toast.success('Успешная авторизация!')
        router.navigate({ to: '/' })
      } catch (error) {
        toast.error('Ошибка получения данных пользователя')
      }
    },
    onError: (error: ApiError) => {
      if (error.status === 400) {
        toast.error('Неверные учетные данные')
      } else {
        toast.error('Произошла ошибка при авторизации')
      }
    },
  })
}

// Регистрация
export const useRegister = () => {
  const queryClient = useQueryClient()
  const { setUser } = useAuthStore()
  const router = useRouter()
  
  return useMutation({
    mutationFn: async (data: RegisterData): Promise<User> => {
      const response = await apiClient.post<User>('/auth/register/', data)
      return response.data
    },
    onSuccess: (user) => {
      setUser(user)
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      queryClient.invalidateQueries({ queryKey: ['checkAuth'] })
      toast.success('Аккаунт создан успешно!')
      router.navigate({ to: '/' })
    },
    onError: (error: ApiError) => {
      if (error.status === 400) {
        if (error.errors?.email) {
          toast.error('Этот email уже используется')
        } else if (error.errors?.password) {
          toast.error('Пароль слишком слабый')
        } else {
          toast.error('Ошибка регистрации')
        }
      } else {
        toast.error('Произошла ошибка при регистрации')
      }
    },
  })
}

// Выход из системы
export const useLogout = () => {
  const queryClient = useQueryClient()
  const { reset } = useAuthStore()
  const router = useRouter()
  
  return useMutation({
    mutationFn: async (): Promise<void> => {
      await apiClient.post('/auth/logout/')
    },
    onSuccess: () => {
      reset()
      queryClient.clear()
      toast.success('Вы вышли из системы')
      router.navigate({ to: '/sign-in' })
    },
    onError: () => {
      toast.error('Ошибка при выходе из системы')
    },
  })
} 