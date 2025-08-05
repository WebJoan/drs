import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'

// Типы для данных селектов
interface Person {
  id: number
  ext_id?: string
  full_name: string
  email: string
  phone?: string
  position?: string
  company: number // ID компании
  company_name: string
  status: string
  is_primary_contact: boolean
  created_at: string
}

interface SalesManager {
  id: number
  email: string
  first_name: string
  last_name: string
  role: string
}

interface Product {
  id: number
  name: string
  complex_name: string
  description?: string
  subgroup: {
    id: number
    name: string
    group: {
      id: number
      name: string
    }
  }
  brand?: {
    id: number
    name: string
  }
}

interface ApiResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// Хук для получения получателей (контактных лиц)
export const useRecipients = (search = '', pageSize = 100) => {
  return useQuery({
    queryKey: ['recipients', search, pageSize],
    queryFn: async (): Promise<Person[]> => {
      try {
        const params = new URLSearchParams({
          page_size: pageSize.toString(),
          status: 'active', // Только активные контакты
        })

        if (search.trim()) {
          params.append('search', search.trim())
        }

        const response = await apiClient.get<ApiResponse<Person>>(`/person/persons/?${params.toString()}`)
        return response.data.results
      } catch (error: any) {
        console.error('Ошибка получения получателей:', error)
        if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail)
        }
        throw new Error('Не удалось загрузить список получателей')
      }
    },
    retry: 2,
    staleTime: 2 * 60 * 1000, // 2 минуты
    gcTime: 5 * 60 * 1000, // 5 минут
  })
}

// Хук для получения менеджеров продаж
export const useSalesManagers = () => {
  return useQuery({
    queryKey: ['sales-managers'],
    queryFn: async (): Promise<SalesManager[]> => {
      try {
        const params = new URLSearchParams({
          role: 'sales',
          page_size: '100',
        })

        const response = await apiClient.get<ApiResponse<SalesManager>>(`/users/?${params.toString()}`)
        return response.data.results
      } catch (error: any) {
        console.error('Ошибка получения менеджеров продаж:', error)
        if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail)
        }
        throw new Error('Не удалось загрузить список менеджеров продаж')
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 10 * 60 * 1000, // 10 минут
  })
}

// Хук для получения товаров
export const useProducts = (search = '', pageSize = 100) => {
  return useQuery({
    queryKey: ['products', search, pageSize],
    queryFn: async (): Promise<Product[]> => {
      try {
        const params = new URLSearchParams({
          page_size: pageSize.toString(),
        })

        if (search.trim()) {
          params.append('search', search.trim())
        }

        const response = await apiClient.get<ApiResponse<Product>>(`/goods/products/?${params.toString()}`)
        return response.data.results
      } catch (error: any) {
        console.error('Ошибка получения товаров:', error)
        if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail)
        }
        throw new Error('Не удалось загрузить список товаров')
      }
    },
    retry: 2,
    staleTime: 2 * 60 * 1000, // 2 минуты
    gcTime: 5 * 60 * 1000, // 5 минут
  })
}

// Типы для экспорта
export type { Person as RecipientPerson, SalesManager, Product }