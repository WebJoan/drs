import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import type { User, CreateUserData, UpdateUserData, ApiError } from '@/lib/types'
import { toast } from 'sonner'

// Интерфейс для ответа с пагинацией пользователей
interface UsersResponse {
  count: number
  next: string | null
  previous: string | null
  page: number
  page_size: number
  total_pages: number
  results: User[]
}

// Получение списка пользователей с пагинацией и поиском
export const useUsers = (page = 1, pageSize = 50, search = '') => {
  return useQuery({
    queryKey: ['users', page, pageSize, search],
    queryFn: async (): Promise<UsersResponse> => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          page_size: pageSize.toString(),
        })

        if (search.trim()) {
          params.append('search', search.trim())
        }

        const response = await apiClient.get<UsersResponse>(`/users/?${params.toString()}`)
        return response.data
      } catch (error: any) {
        console.error('Ошибка получения пользователей:', error)
        if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail)
        }
        throw new Error('Не удалось загрузить список пользователей')
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 10 * 60 * 1000, // 10 минут
  })
}

// Получение всех пользователей без пагинации (для случаев, когда нужны все)
export const useAllUsers = () => {
  return useQuery({
    queryKey: ['users', 'all'],
    queryFn: async (): Promise<User[]> => {
      try {
        // Получаем все пользователи через большой page_size
        const response = await apiClient.get<UsersResponse>('/users/?page_size=1000')
        return response.data.results
      } catch (error: any) {
        console.error('Ошибка получения всех пользователей:', error)
        if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail)
        }
        throw new Error('Не удалось загрузить список пользователей')
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 10 * 60 * 1000, // 10 минут
  })
}

// Получение конкретного пользователя
export const useUser = (userId: number) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async (): Promise<User> => {
      try {
        const response = await apiClient.get<User>(`/users/${userId}/`)
        return response.data
      } catch (error: any) {
        console.error('Ошибка получения пользователя:', error)
        if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail)
        }
        throw new Error('Не удалось загрузить пользователя')
      }
    },
    enabled: !!userId,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 10 * 60 * 1000, // 10 минут
  })
}

// Создание нового пользователя
export const useCreateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (userData: CreateUserData): Promise<User> => {
      try {
        const response = await apiClient.post<User>('/users/', userData)
        return response.data
      } catch (error: any) {
        console.error('Ошибка создания пользователя:', error)
        
        if (error.response?.data?.errors) {
          // Обрабатываем ошибки валидации Django
          const errors = error.response.data.errors
          const errorMessages = []
          
          for (const [field, messages] of Object.entries(errors)) {
            if (Array.isArray(messages)) {
              errorMessages.push(...messages)
            }
          }
          
          if (errorMessages.length > 0) {
            throw new Error(errorMessages.join(', '))
          }
        }
        
        if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail)
        }
        
        throw new Error('Не удалось создать пользователя')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Пользователь успешно создан')
    },
    onError: (error: Error) => {
      console.error('Ошибка при создании пользователя:', error)
      toast.error(error.message || 'Не удалось создать пользователя')
    }
  })
}

// Обновление пользователя
export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ userId, userData }: { userId: number; userData: UpdateUserData }): Promise<User> => {
      try {
        const response = await apiClient.patch<User>(`/users/${userId}/`, userData)
        return response.data
      } catch (error: any) {
        console.error('Ошибка обновления пользователя:', error)
        
        if (error.response?.data?.errors) {
          // Обрабатываем ошибки валидации Django
          const errors = error.response.data.errors
          const errorMessages = []
          
          for (const [field, messages] of Object.entries(errors)) {
            if (Array.isArray(messages)) {
              errorMessages.push(...messages)
            }
          }
          
          if (errorMessages.length > 0) {
            throw new Error(errorMessages.join(', '))
          }
        }
        
        if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail)
        }
        
        throw new Error('Не удалось обновить пользователя')
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', data.id] })
      toast.success('Пользователь успешно обновлен')
    },
    onError: (error: Error) => {
      console.error('Ошибка при обновлении пользователя:', error)
      toast.error(error.message || 'Не удалось обновить пользователя')
    }
  })
}

// Удаление пользователя
export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (userId: number): Promise<void> => {
      try {
        await apiClient.delete(`/users/${userId}/`)
      } catch (error: any) {
        console.error('Ошибка удаления пользователя:', error)
        
        if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail)
        }
        
        throw new Error('Не удалось удалить пользователя')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Пользователь успешно удален')
    },
    onError: (error: Error) => {
      console.error('Ошибка при удалении пользователя:', error)
      toast.error(error.message || 'Не удалось удалить пользователя')
    }
  })
}

// Хук для массового удаления пользователей
export const useDeleteUsers = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (userIds: number[]): Promise<void> => {
      try {
        // Выполняем удаление всех пользователей параллельно
        await Promise.all(
          userIds.map(userId => apiClient.delete(`/users/${userId}/`))
        )
      } catch (error: any) {
        console.error('Ошибка массового удаления пользователей:', error)
        
        if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail)
        }
        
        throw new Error('Не удалось удалить пользователей')
      }
    },
    onSuccess: (_, userIds) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(`Успешно удалено ${userIds.length} пользователей`)
    },
    onError: (error: Error) => {
      console.error('Ошибка при массовом удалении пользователей:', error)
      toast.error(error.message || 'Не удалось удалить пользователей')
    }
  })
} 