import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import type { AppConfig } from '@/lib/types'

export const useAppConfig = () => {
  return useQuery({
    queryKey: ['appConfig'],
    queryFn: async (): Promise<AppConfig> => {
      const response = await apiClient.get<AppConfig>('/app/config/')
      return response.data
    },
    staleTime: 10 * 60 * 1000, // 10 минут
    refetchOnWindowFocus: false,
  })
} 