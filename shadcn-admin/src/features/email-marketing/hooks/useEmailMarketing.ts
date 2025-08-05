import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import { toast } from 'sonner'
import type {
  AiEmail,
  AiEmailCreateRequest,
  AiEmailUpdateRequest,
  AiEmailGenerateRequest,
  AiEmailAttachment,
  AiEmailAttachmentCreateRequest,
  SalesInsightsRequest,
  SalesInsightsResponse,
  ApiResponse
} from '../types'

// Получение списка AI писем с пагинацией и поиском
export const useAiEmails = (page = 1, pageSize = 20, search = '') => {
  return useQuery({
    queryKey: ['ai-emails', page, pageSize, search],
    queryFn: async (): Promise<ApiResponse<AiEmail>> => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          page_size: pageSize.toString(),
        })

        if (search.trim()) {
          params.append('search', search.trim())
        }

        const response = await apiClient.get<ApiResponse<AiEmail>>(`/email-marketing/ai-emails/?${params.toString()}`)
        return response.data
      } catch (error: any) {
        console.error('Ошибка получения AI писем:', error)
        if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail)
        }
        throw new Error('Не удалось загрузить список писем')
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 10 * 60 * 1000, // 10 минут
  })
}

// Получение конкретного AI письма
export const useAiEmail = (id: number) => {
  return useQuery({
    queryKey: ['ai-email', id],
    queryFn: async (): Promise<AiEmail> => {
      try {
        const response = await apiClient.get<AiEmail>(`/email-marketing/ai-emails/${id}/`)
        return response.data
      } catch (error: any) {
        console.error('Ошибка получения AI письма:', error)
        if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail)
        }
        throw new Error('Не удалось загрузить письмо')
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Создание AI письма
export const useCreateAiEmail = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: AiEmailCreateRequest): Promise<AiEmail> => {
      try {
        const response = await apiClient.post<AiEmail>('/email-marketing/ai-emails/', data)
        return response.data
      } catch (error: any) {
        console.error('Ошибка создания AI письма:', error)
        if (error.response?.data) {
          const errorMessage = typeof error.response.data === 'string' 
            ? error.response.data 
            : Object.values(error.response.data).flat().join(', ')
          throw new Error(errorMessage)
        }
        throw new Error('Не удалось создать письмо')
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-emails'] })
      toast.success('Письмо успешно создано')
    },
    onError: (error: Error) => {
      toast.error(`Ошибка создания письма: ${error.message}`)
    },
  })
}

// Обновление AI письма
export const useUpdateAiEmail = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AiEmailUpdateRequest }): Promise<AiEmail> => {
      try {
        const response = await apiClient.patch<AiEmail>(`/email-marketing/ai-emails/${id}/`, data)
        return response.data
      } catch (error: any) {
        console.error('Ошибка обновления AI письма:', error)
        if (error.response?.data) {
          const errorMessage = typeof error.response.data === 'string' 
            ? error.response.data 
            : Object.values(error.response.data).flat().join(', ')
          throw new Error(errorMessage)
        }
        throw new Error('Не удалось обновить письмо')
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-emails'] })
      queryClient.invalidateQueries({ queryKey: ['ai-email', variables.id] })
      toast.success('Письмо успешно обновлено')
    },
    onError: (error: Error) => {
      toast.error(`Ошибка обновления письма: ${error.message}`)
    },
  })
}

// Удаление AI письма
export const useDeleteAiEmail = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      try {
        await apiClient.delete(`/email-marketing/ai-emails/${id}/`)
      } catch (error: any) {
        console.error('Ошибка удаления AI письма:', error)
        if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail)
        }
        throw new Error('Не удалось удалить письмо')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-emails'] })
      toast.success('Письмо успешно удалено')
    },
    onError: (error: Error) => {
      toast.error(`Ошибка удаления письма: ${error.message}`)
    },
  })
}

// Генерация AI письма
export const useGenerateAiEmail = () => {
  return useMutation({
    mutationFn: async (data: AiEmailGenerateRequest): Promise<AiEmail> => {
      try {
        const response = await apiClient.post<AiEmail>('/email-marketing/ai-emails/generate/', data)
        return response.data
      } catch (error: any) {
        console.error('Ошибка генерации AI письма:', error)
        if (error.response?.data) {
          const errorMessage = typeof error.response.data === 'string' 
            ? error.response.data 
            : Object.values(error.response.data).flat().join(', ')
          throw new Error(errorMessage)
        }
        throw new Error('Произошла ошибка при генерации письма. Попробуйте еще раз.')
      }
    },
    onSuccess: () => {
      toast.success('Письмо успешно сгенерировано')
    },
    onError: (error: Error) => {
      toast.error(`Ошибка генерации письма: ${error.message}`)
    },
  })
}

// Отправка AI письма
export const useSendAiEmail = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: number): Promise<AiEmail> => {
      try {
        const response = await apiClient.post<AiEmail>(`/email-marketing/ai-emails/${id}/send/`)
        return response.data
      } catch (error: any) {
        console.error('Ошибка отправки AI письма:', error)
        if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail)
        }
        throw new Error('Не удалось отправить письмо')
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-emails'] })
      queryClient.invalidateQueries({ queryKey: ['ai-email', data.id] })
      toast.success('Письмо успешно отправлено')
    },
    onError: (error: Error) => {
      toast.error(`Ошибка отправки письма: ${error.message}`)
    },
  })
}

// Создание вложения к письму
export const useCreateEmailAttachment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: AiEmailAttachmentCreateRequest): Promise<AiEmailAttachment> => {
      try {
        const formData = new FormData()
        formData.append('file', data.file)
        formData.append('ai_email_id', data.ai_email_id.toString())
        if (data.name) {
          formData.append('name', data.name)
        }

        const response = await apiClient.post<AiEmailAttachment>('/email-marketing/attachments/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        return response.data
      } catch (error: any) {
        console.error('Ошибка загрузки вложения:', error)
        if (error.response?.data) {
          const errorMessage = typeof error.response.data === 'string' 
            ? error.response.data 
            : Object.values(error.response.data).flat().join(', ')
          throw new Error(errorMessage)
        }
        throw new Error('Не удалось загрузить вложение')
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-email', data.ai_email] })
      toast.success('Вложение успешно добавлено')
    },
    onError: (error: Error) => {
      toast.error(`Ошибка загрузки вложения: ${error.message}`)
    },
  })
}

// Удаление вложения
export const useDeleteEmailAttachment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      try {
        await apiClient.delete(`/email-marketing/attachments/${id}/`)
      } catch (error: any) {
        console.error('Ошибка удаления вложения:', error)
        if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail)
        }
        throw new Error('Не удалось удалить вложение')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-emails'] })
      toast.success('Вложение успешно удалено')
    },
    onError: (error: Error) => {
      toast.error(`Ошибка удаления вложения: ${error.message}`)
    },
  })
}

// Генерация персонализированного AI письма с данными о продажах
export const useGeneratePersonalizedAiEmail = () => {
  return useMutation({
    mutationFn: async (data: AiEmailGenerateRequest) => {
      try {
        const response = await apiClient.post('/email-marketing/ai-emails/generate_personalized/', data)
        return response.data
      } catch (error: any) {
        console.error('Ошибка генерации персонализированного письма:', error)
        if (error.response?.data) {
          const errorMessage = typeof error.response.data === 'string' 
            ? error.response.data 
            : Object.values(error.response.data).flat().join(', ')
          throw new Error(errorMessage)
        }
        throw new Error('Не удалось сгенерировать персонализированное письмо')
      }
    },
    onSuccess: () => {
      toast.success('Персонализированное письмо генерируется...')
    },
    onError: (error: Error) => {
      toast.error(`Ошибка генерации персонализированного письма: ${error.message}`)
    },
  })
}

// Генерация инсайтов продаж клиента
export const useGenerateSalesInsights = () => {
  return useMutation({
    mutationFn: async (data: SalesInsightsRequest) => {
      try {
        const response = await apiClient.post('/email-marketing/ai-emails/generate_sales_insights/', data)
        return response.data
      } catch (error: any) {
        console.error('Ошибка генерации инсайтов продаж:', error)
        if (error.response?.data) {
          const errorMessage = typeof error.response.data === 'string' 
            ? error.response.data 
            : Object.values(error.response.data).flat().join(', ')
          throw new Error(errorMessage)
        }
        throw new Error('Не удалось сгенерировать инсайты продаж')
      }
    },
    onSuccess: () => {
      toast.success('Инсайты продаж генерируются...')
    },
    onError: (error: Error) => {
      toast.error(`Ошибка генерации инсайтов продаж: ${error.message}`)
    },
  })
}

// Проверка статуса задачи
export const useTaskStatus = (taskId: string | null) => {
  return useQuery({
    queryKey: ['task-status', taskId],
    queryFn: async () => {
      if (!taskId) return null
      try {
        const response = await apiClient.get(`/email-marketing/ai-emails/task_status/?task_id=${taskId}`)
        return response.data
      } catch (error: any) {
        console.error('Ошибка получения статуса задачи:', error)
        throw new Error('Не удалось получить статус задачи')
      }
    },
    enabled: !!taskId,
    refetchInterval: (data) => {
      // Перезапрашиваем каждые 3 секунды, пока задача не завершена
      return data?.status === 'PENDING' || data?.status === 'PROGRESS' ? 3000 : false
    },
    staleTime: 0, // Всегда считаем данные устаревшими
    gcTime: 5 * 60 * 1000, // 5 минут
  })
}