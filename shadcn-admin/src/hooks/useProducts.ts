import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import type { 
  Product, 
  CreateProductData, 
  UpdateProductData, 
  Brand,
  ProductSubgroup,
  ProductGroup,
  CreateBrandData,
  UpdateBrandData,
  CreateProductSubgroupData,
  UpdateProductSubgroupData,
  CreateProductGroupData,
  UpdateProductGroupData,
  ApiError 
} from '@/lib/types'
import { toast } from 'sonner'

// Интерфейс для пагинированного ответа товаров
interface PaginatedProductsResponse {
  count: number
  next: string | null
  previous: string | null
  page: number
  page_size: number
  total_pages: number
  results: Product[]
}

// Получение списка товаров с пагинацией
export const useProducts = (page: number = 1, pageSize: number = 50, search?: string) => {
  return useQuery({
    queryKey: ['products', page, pageSize, search],
    queryFn: async (): Promise<PaginatedProductsResponse> => {
      try {
        // Если есть поиск, используем MeiliSearch
        if (search && search.trim()) {
          const params = new URLSearchParams()
          params.append('q', search.trim())
          params.append('limit', pageSize.toString())
          params.append('offset', ((page - 1) * pageSize).toString())
          
          const response = await apiClient.get(`/goods/products/search/?${params.toString()}`)
          const searchData = response.data
          
          // Преобразуем результаты MeiliSearch в формат пагинации
          return {
            count: searchData.total,
            next: searchData.total > page * pageSize ? 'next' : null,
            previous: page > 1 ? 'previous' : null,
            page,
            page_size: pageSize,
            total_pages: Math.ceil(searchData.total / pageSize),
            results: searchData.results
          }
        }
        
        // Обычный запрос без поиска
        const params = new URLSearchParams()
        params.append('page', page.toString())
        params.append('page_size', pageSize.toString())
        
        const response = await apiClient.get<PaginatedProductsResponse>(
          `/goods/products/?${params.toString()}`
        )
        return response.data
      } catch (error: any) {
        console.error('Ошибка получения товаров:', error)
        if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail)
        }
        throw new Error('Не удалось загрузить список товаров')
      }
    },
    retry: 2,
    staleTime: 2 * 60 * 1000, // 2 минуты для пагинированных данных
    gcTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData, // Сохраняем предыдущие данные при загрузке новых
  })
}



// Получение конкретного товара
export const useProduct = (productId: number) => {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async (): Promise<Product> => {
      try {
        const response = await apiClient.get<Product>(`/goods/products/${productId}/`)
        return response.data
      } catch (error: any) {
        console.error('Ошибка получения товара:', error)
        if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail)
        }
        throw new Error('Не удалось загрузить товар')
      }
    },
    enabled: !!productId,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 10 * 60 * 1000, // 10 минут
  })
}

// Создание товара
export const useCreateProduct = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (productData: CreateProductData): Promise<Product> => {
      try {
        const response = await apiClient.post<Product>('/goods/products/', productData)
        return response.data
      } catch (error: any) {
        console.error('Ошибка создания товара:', error)
        
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
        
        throw new Error('Не удалось создать товар')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Товар успешно создан')
    },
    onError: (error: Error) => {
      console.error('Ошибка при создании товара:', error)
      toast.error(error.message || 'Не удалось создать товар')
    }
  })
}

// Обновление товара
export const useUpdateProduct = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ productId, productData }: { productId: number; productData: UpdateProductData }): Promise<Product> => {
      try {
        const response = await apiClient.patch<Product>(`/goods/products/${productId}/`, productData)
        return response.data
      } catch (error: any) {
        console.error('Ошибка обновления товара:', error)
        
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
        
        throw new Error('Не удалось обновить товар')
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', data.id] })
      toast.success('Товар успешно обновлен')
    },
    onError: (error: Error) => {
      console.error('Ошибка при обновлении товара:', error)
      toast.error(error.message || 'Не удалось обновить товар')
    }
  })
}

// Удаление товара
export const useDeleteProduct = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (productId: number): Promise<void> => {
      try {
        await apiClient.delete(`/goods/products/${productId}/`)
      } catch (error: any) {
        console.error('Ошибка удаления товара:', error)
        
        if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail)
        }
        
        throw new Error('Не удалось удалить товар')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Товар успешно удален')
    },
    onError: (error: Error) => {
      console.error('Ошибка при удалении товара:', error)
      toast.error(error.message || 'Не удалось удалить товар')
    }
  })
}

// Хук для массового удаления товаров
export const useDeleteProducts = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (productIds: number[]): Promise<void> => {
      try {
        await apiClient.delete('/goods/products/bulk_delete/', { data: { ids: productIds } })
      } catch (error: any) {
        console.error('Ошибка массового удаления товаров:', error)
        
        if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail)
        }
        
        throw new Error('Не удалось удалить товары')
      }
    },
    onSuccess: (_, productIds) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success(`Успешно удалено ${productIds.length} товаров`)
    },
    onError: (error: Error) => {
      console.error('Ошибка при массовом удалении товаров:', error)
      toast.error(error.message || 'Не удалось удалить товары')
    }
  })
}

// Хуки для брендов
export const useBrands = () => {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async (): Promise<Brand[]> => {
      try {
        const response = await apiClient.get<Brand[]>('/goods/brands/')
        return response.data
      } catch (error: any) {
        console.error('Ошибка получения брендов:', error)
        throw new Error('Не удалось загрузить список брендов')
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Хук для поиска брендов
export const useBrandsSearch = (searchTerm: string) => {
  return useQuery({
    queryKey: ['brands-search', searchTerm],
    queryFn: async (): Promise<Brand[]> => {
      try {
        const response = await apiClient.get<Brand[]>('/goods/brands/', {
          params: { search: searchTerm }
        })
        return response.data
      } catch (error: any) {
        console.error('Ошибка поиска брендов:', error)
        throw new Error('Не удалось найти бренды')
      }
    },
    enabled: searchTerm.length > 0,
    retry: 2,
    staleTime: 1 * 60 * 1000, // 1 минута для поиска
    gcTime: 5 * 60 * 1000,
  })
}

export const useCreateBrand = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (brandData: CreateBrandData): Promise<Brand> => {
      try {
        const response = await apiClient.post<Brand>('/goods/brands/', brandData)
        return response.data
      } catch (error: any) {
        console.error('Ошибка создания бренда:', error)
        throw new Error('Не удалось создать бренд')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] })
      toast.success('Бренд успешно создан')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Не удалось создать бренд')
    }
  })
}

// Хуки для подгрупп товаров
export const useProductSubgroups = () => {
  return useQuery({
    queryKey: ['product-subgroups'],
    queryFn: async (): Promise<ProductSubgroup[]> => {
      try {
        const response = await apiClient.get<ProductSubgroup[]>('/goods/subgroups/')
        return response.data
      } catch (error: any) {
        console.error('Ошибка получения подгрупп:', error)
        throw new Error('Не удалось загрузить список подгрупп')
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Хук для поиска подгрупп
export const useProductSubgroupsSearch = (searchTerm: string) => {
  return useQuery({
    queryKey: ['product-subgroups-search', searchTerm],
    queryFn: async (): Promise<ProductSubgroup[]> => {
      try {
        const response = await apiClient.get<ProductSubgroup[]>('/goods/subgroups/', {
          params: { search: searchTerm }
        })
        return response.data
      } catch (error: any) {
        console.error('Ошибка поиска подгрупп:', error)
        throw new Error('Не удалось найти подгруппы')
      }
    },
    enabled: searchTerm.length > 0,
    retry: 2,
    staleTime: 1 * 60 * 1000, // 1 минута для поиска
    gcTime: 5 * 60 * 1000,
  })
}

export const useCreateProductSubgroup = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (subgroupData: CreateProductSubgroupData): Promise<ProductSubgroup> => {
      try {
        const response = await apiClient.post<ProductSubgroup>('/goods/subgroups/', subgroupData)
        return response.data
      } catch (error: any) {
        console.error('Ошибка создания подгруппы:', error)
        throw new Error('Не удалось создать подгруппу')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-subgroups'] })
      toast.success('Подгруппа успешно создана')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Не удалось создать подгруппу')
    }
  })
}

// Хуки для групп товаров
export const useProductGroups = () => {
  return useQuery({
    queryKey: ['product-groups'],
    queryFn: async (): Promise<ProductGroup[]> => {
      try {
        const response = await apiClient.get<ProductGroup[]>('/goods/groups/')
        return response.data
      } catch (error: any) {
        console.error('Ошибка получения групп:', error)
        throw new Error('Не удалось загрузить список групп')
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

export const useCreateProductGroup = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (groupData: CreateProductGroupData): Promise<ProductGroup> => {
      try {
        const response = await apiClient.post<ProductGroup>('/goods/groups/', groupData)
        return response.data
      } catch (error: any) {
        console.error('Ошибка создания группы:', error)
        throw new Error('Не удалось создать группу')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-groups'] })
      toast.success('Группа успешно создана')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Не удалось создать группу')
    }
  })
} 