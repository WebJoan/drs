import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import apiClient from '@/lib/api-client'
import type { User, ApiError } from '@/lib/types'
import { useAuthStore } from '@/stores/authStore'

// Типы для данных
export interface UpdateProfileData {
  email: string
  first_name: string
  last_name: string
}

export interface UpdatePasswordData {
  current_password: string
  new_password: string
}

// Обновление профиля
export const useUpdateProfile = () => {
  const queryClient = useQueryClient()
  const { setUser } = useAuthStore()
  
  return useMutation({
    mutationFn: async (data: UpdateProfileData): Promise<User> => {
      const response = await apiClient.put<User>('/self/account/', data)
      return response.data
    },
    onSuccess: (user) => {
      setUser(user)
      queryClient.setQueryData(['currentUser'], user)
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      toast.success('Профиль успешно обновлен!')
    },
    onError: (error: ApiError) => {
      if (error.status === 400) {
        toast.error('Ошибка валидации данных')
      } else {
        toast.error('Произошла ошибка при обновлении профиля')
      }
    },
  })
}

// Смена пароля
export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: async (data: UpdatePasswordData): Promise<void> => {
      await apiClient.put('/self/password/', data)
    },
    onSuccess: () => {
      toast.success('Пароль успешно изменен!')
    },
    onError: (error: ApiError) => {
      if (error.status === 400) {
        if (error.errors?.current_password) {
          toast.error('Неверный текущий пароль')
        } else if (error.errors?.new_password) {
          toast.error('Новый пароль не соответствует требованиям')
        } else {
          toast.error('Ошибка валидации данных')
        }
      } else {
        toast.error('Произошла ошибка при смене пароля')
      }
    },
  })
}

// Удаление аккаунта
export const useDeleteAccount = () => {
  const queryClient = useQueryClient()
  const { reset } = useAuthStore()
  const router = useRouter()
  
  return useMutation({
    mutationFn: async (): Promise<void> => {
      await apiClient.delete('/self/account/')
    },
    onSuccess: () => {
      reset()
      queryClient.clear()
      toast.success('Аккаунт успешно удален')
      router.navigate({ to: '/sign-in' })
    },
    onError: () => {
      toast.error('Произошла ошибка при удалении аккаунта')
    },
  })
} 