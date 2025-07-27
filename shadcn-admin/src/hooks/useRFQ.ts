import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import type { 
  RFQ, 
  CreateRFQData, 
  CreateRFQItemData,
  Currency,
  Quotation,
  CreateQuotationData,
  CreateQuotationItemData,
  PaginatedRFQResponse,
  PaginatedQuotationResponse,
  ApiError 
} from '@/lib/types'
import { toast } from 'sonner'

// Получение списка RFQ с пагинацией
export const useRFQs = (page = 1, pageSize = 20, search = '') => {
  return useQuery({
    queryKey: ['rfqs', page, pageSize, search],
    queryFn: async (): Promise<PaginatedRFQResponse> => {
      try {
        const params = new URLSearchParams()
        params.append('page', page.toString())
        params.append('page_size', pageSize.toString())
        if (search && search.trim()) {
          params.append('search', search.trim())
        }
        
        const response = await apiClient.get<PaginatedRFQResponse>(
          `/rfq/rfqs/?${params.toString()}`
        )
        return response.data
      } catch (error: any) {
        console.error('Ошибка получения RFQ:', error)
        if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail)
        }
        throw new Error('Не удалось загрузить список RFQ')
      }
    },
    retry: 2,
    staleTime: 2 * 60 * 1000, // 2 минуты
    gcTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  })
}

// Получение конкретного RFQ
export const useRFQ = (rfqId: number) => {
  return useQuery({
    queryKey: ['rfq', rfqId],
    queryFn: async (): Promise<RFQ> => {
      try {
        const response = await apiClient.get<RFQ>(`/rfq/rfqs/${rfqId}/`)
        return response.data
      } catch (error: any) {
        console.error('Ошибка получения RFQ:', error)
        if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail)
        }
        throw new Error('Не удалось загрузить RFQ')
      }
    },
    enabled: !!rfqId,
    retry: 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Создание RFQ
export const useCreateRFQ = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (rfqData: CreateRFQData): Promise<RFQ> => {
      try {
        const response = await apiClient.post<RFQ>('/rfq/rfqs/', rfqData)
        return response.data
      } catch (error: any) {
        console.error('Ошибка создания RFQ:', error)
        
        if (error.response?.data?.errors) {
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
        
        throw new Error('Не удалось создать RFQ')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] })
      toast.success('RFQ успешно создан')
    },
    onError: (error: Error) => {
      console.error('Ошибка при создании RFQ:', error)
      toast.error(error.message || 'Не удалось создать RFQ')
    }
  })
}

// Добавление позиции в RFQ
export const useCreateRFQItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ rfqId, itemData }: { rfqId: number; itemData: CreateRFQItemData }): Promise<any> => {
      try {
        // Создаем FormData для отправки multipart/form-data
        const formData = new FormData()
        formData.append('rfq', rfqId.toString())
        formData.append('line_number', itemData.line_number.toString())
        formData.append('quantity', itemData.quantity.toString())
        formData.append('unit', itemData.unit)
        formData.append('specifications', itemData.specifications)
        formData.append('comments', itemData.comments)
        formData.append('is_new_product', itemData.is_new_product.toString())
        
        if (itemData.is_new_product) {
          // Для нового товара отправляем данные о товаре
          formData.append('product_name', itemData.product_name)
          formData.append('manufacturer', itemData.manufacturer)
          formData.append('part_number', itemData.part_number)
        } else {
          // Для существующего товара отправляем только ID
          if (itemData.product) {
            formData.append('product', itemData.product.toString())
          }
        }
        
        const response = await apiClient.post('/rfq/rfq-items/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        return response.data
      } catch (error: any) {
        console.error('Ошибка добавления позиции в RFQ:', error)
        
        if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail)
        }
        
        if (error.response?.data?.errors) {
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
        
        throw new Error('Не удалось добавить позицию в RFQ')
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rfq', variables.rfqId] })
      queryClient.invalidateQueries({ queryKey: ['rfqs'] })
      toast.success('Позиция добавлена в RFQ')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Не удалось добавить позицию')
    }
  })
}

// Обновление статуса RFQ
export const useUpdateRFQStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ rfqId, status }: { rfqId: number; status: string }): Promise<RFQ> => {
      try {
        const response = await apiClient.patch<RFQ>(`/rfq/rfqs/${rfqId}/`, { status })
        return response.data
      } catch (error: any) {
        console.error('Ошибка обновления статуса RFQ:', error)
        throw new Error('Не удалось обновить статус RFQ')
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rfq', data.id] })
      queryClient.invalidateQueries({ queryKey: ['rfqs'] })
      toast.success('Статус RFQ обновлен')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Не удалось обновить статус')
    }
  })
}

// Получение валют
export const useCurrencies = () => {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: async (): Promise<Currency[]> => {
      try {
        const response = await apiClient.get<Currency[]>('/rfq/currencies/')
        return response.data
      } catch (error: any) {
        console.error('Ошибка получения валют:', error)
        throw new Error('Не удалось загрузить список валют')
      }
    },
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 минут
    gcTime: 30 * 60 * 1000, // 30 минут
  })
}

// Получение предложений (Quotations) для RFQ
export const useQuotationsForRFQ = (rfqId: number) => {
  return useQuery({
    queryKey: ['quotations', 'rfq', rfqId],
    queryFn: async (): Promise<Quotation[]> => {
      try {
        const response = await apiClient.get<Quotation[]>(`/rfq/rfqs/${rfqId}/quotations/`)
        return response.data
      } catch (error: any) {
        console.error('Ошибка получения предложений:', error)
        throw new Error('Не удалось загрузить предложения')
      }
    },
    enabled: !!rfqId,
    retry: 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Получение всех предложений с пагинацией
export const useQuotations = (page = 1, pageSize = 20, search = '') => {
  return useQuery({
    queryKey: ['quotations', page, pageSize, search],
    queryFn: async (): Promise<PaginatedQuotationResponse> => {
      try {
        const params = new URLSearchParams()
        params.append('page', page.toString())
        params.append('page_size', pageSize.toString())
        if (search && search.trim()) {
          params.append('search', search.trim())
        }
        
        const response = await apiClient.get<PaginatedQuotationResponse>(
          `/rfq/quotations/?${params.toString()}`
        )
        return response.data
      } catch (error: any) {
        console.error('Ошибка получения предложений:', error)
        throw new Error('Не удалось загрузить список предложений')
      }
    },
    retry: 2,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  })
}

// Создание предложения
export const useCreateQuotation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (quotationData: CreateQuotationData): Promise<Quotation> => {
      try {
        const response = await apiClient.post<Quotation>('/rfq/quotations/', quotationData)
        return response.data
      } catch (error: any) {
        console.error('Ошибка создания предложения:', error)
        throw new Error('Не удалось создать предложение')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      toast.success('Предложение успешно создано')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Не удалось создать предложение')
    }
  })
}

// Создание позиции котировки
export const useCreateQuotationItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (itemData: CreateQuotationItemData): Promise<any> => {
      try {
        const response = await apiClient.post('/rfq/quotation-items/', itemData)
        return response.data
      } catch (error: any) {
        console.error('Ошибка создания позиции котировки:', error)
        throw new Error('Не удалось создать позицию котировки')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Не удалось создать позицию котировки')
    }
  })
}

// Создание полной котировки с позициями
export const useCreateFullQuotation = () => {
  const queryClient = useQueryClient()
  const createQuotation = useCreateQuotation()
  const createQuotationItem = useCreateQuotationItem()
  
  return useMutation({
    mutationFn: async (data: { 
      quotation: CreateQuotationData, 
      items: CreateQuotationItemData[] 
    }): Promise<Quotation> => {
      try {
        // Сначала создаем котировку
        const quotation = await createQuotation.mutateAsync(data.quotation)
        
        // Затем добавляем все позиции
        await Promise.all(
          data.items.map(item => 
            createQuotationItem.mutateAsync(item)
          )
        )
        
        return quotation
      } catch (error: any) {
        console.error('Ошибка создания полной котировки:', error)
        throw new Error('Не удалось создать котировку с позициями')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      toast.success('Котировка с позициями успешно создана')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Не удалось создать котировку')
    }
  })
}

// Удаление RFQ
export const useDeleteRFQ = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (rfqId: number): Promise<void> => {
      try {
        await apiClient.delete(`/rfq/rfqs/${rfqId}/`)
      } catch (error: any) {
        console.error('Ошибка удаления RFQ:', error)
        throw new Error('Не удалось удалить RFQ')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] })
      toast.success('RFQ успешно удален')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Не удалось удалить RFQ')
    }
  })
}

// Загрузка файла для позиции RFQ
export const useUploadRFQItemFile = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      rfqItemId, 
      file, 
      fileType = 'other', 
      description = '' 
    }: {
      rfqItemId: number
      file: File
      fileType?: string
      description?: string
    }): Promise<any> => {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('file_type', fileType)
        formData.append('description', description)
        
        const response = await apiClient.post(
          `/rfq/rfq-items/${rfqItemId}/upload_file/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        )
        return response.data
      } catch (error: any) {
        console.error('Ошибка загрузки файла:', error)
        
        if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail)
        }
        
        if (error.response?.data?.errors) {
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
        
        throw new Error('Не удалось загрузить файл')
      }
    },
    onSuccess: (data, variables) => {
      // Инвалидируем кэш для обновления списка файлов
      queryClient.invalidateQueries({ queryKey: ['rfq'] })
      queryClient.invalidateQueries({ queryKey: ['rfq-item', variables.rfqItemId] })
      toast.success('Файл успешно загружен')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Не удалось загрузить файл')
    }
  })
} 