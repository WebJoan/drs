import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import apiClient from '@/lib/api-client'
import type { Product } from '@/lib/types'

interface ProductSearchResponse {
  results: Product[]
  total: number
  query: string
}

// Хук для поиска товаров с дебаунсом для автокомплита
export const useProductSearch = (query: string, enabled: boolean = true) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  // Дебаунс поискового запроса
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  return useQuery({
    queryKey: ['product-search', debouncedQuery],
    queryFn: async (): Promise<ProductSearchResponse> => {
      if (!debouncedQuery.trim()) {
        return { results: [], total: 0, query: debouncedQuery }
      }

      try {
        const params = new URLSearchParams()
        params.append('q', debouncedQuery.trim())
        params.append('limit', '10') // Ограничиваем результаты для автокомплита
        params.append('offset', '0')
        
        const response = await apiClient.get(`/goods/products/search/?${params.toString()}`)
        return response.data
      } catch (error: any) {
        console.error('Ошибка поиска товаров:', error)
        return { results: [], total: 0, query: debouncedQuery }
      }
    },
    enabled: enabled && debouncedQuery.trim().length > 0,
    retry: 1,
    staleTime: 1 * 60 * 1000, // 1 минута
    gcTime: 2 * 60 * 1000, // 2 минуты
  })
} 