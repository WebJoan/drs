import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CompaniesResponse, Company, CompanyCreateData, CompanyUpdateData } from '@/features/customer/types'

interface UseCompaniesParams {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  company_type?: string
  sales_manager?: number
}

export function useCompanies(params: UseCompaniesParams = {}) {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: async (): Promise<CompaniesResponse> => {
      const searchParams = new URLSearchParams()
      
      if (params.page) searchParams.append('page', params.page.toString())
      if (params.pageSize) searchParams.append('page_size', params.pageSize.toString())
      if (params.search) searchParams.append('search', params.search)
      if (params.status) searchParams.append('status', params.status)
      if (params.company_type) searchParams.append('company_type', params.company_type)
      if (params.sales_manager) searchParams.append('sales_manager', params.sales_manager.toString())

      const response = await fetch(`/api/v1/customer/companies/?${searchParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch companies')
      }
      return response.json()
    },
  })
}

export function useCompany(id: number) {
  return useQuery({
    queryKey: ['company', id],
    queryFn: async (): Promise<Company> => {
      const response = await fetch(`/api/v1/customer/companies/${id}/`)
      if (!response.ok) {
        throw new Error('Failed to fetch company')
      }
      return response.json()
    },
    enabled: !!id,
  })
}

export function useCreateCompany() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CompanyCreateData): Promise<Company> => {
      const response = await fetch('/api/v1/customer/companies/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create company')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}

export function useUpdateCompany() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CompanyUpdateData }): Promise<Company> => {
      const response = await fetch(`/api/v1/customer/companies/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update company')
      }
      
      return response.json()
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({ queryKey: ['company', id] })
    },
  })
}

export function useDeleteCompany() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const response = await fetch(`/api/v1/customer/companies/${id}/`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete company')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
} 