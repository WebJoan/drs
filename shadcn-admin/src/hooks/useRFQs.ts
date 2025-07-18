import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { RFQsResponse, RFQ, RFQCreateData, RFQItemCreateData } from '@/features/rfq/types'

interface UseRFQsParams {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  priority?: string
  company?: number
}

export function useRFQs(params: UseRFQsParams = {}) {
  return useQuery({
    queryKey: ['rfqs', params],
    queryFn: async (): Promise<RFQsResponse> => {
      const searchParams = new URLSearchParams()
      
      if (params.page) searchParams.append('page', params.page.toString())
      if (params.pageSize) searchParams.append('page_size', params.pageSize.toString())
      if (params.search) searchParams.append('search', params.search)
      if (params.status) searchParams.append('status', params.status)
      if (params.priority) searchParams.append('priority', params.priority)
      if (params.company) searchParams.append('company', params.company.toString())

      const response = await fetch(`/api/v1/rfq/rfqs/?${searchParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch RFQs')
      }
      return response.json()
    },
  })
}

export function useRFQ(id: number) {
  return useQuery({
    queryKey: ['rfq', id],
    queryFn: async (): Promise<RFQ> => {
      const response = await fetch(`/api/v1/rfq/rfqs/${id}/`)
      if (!response.ok) {
        throw new Error('Failed to fetch RFQ')
      }
      return response.json()
    },
    enabled: !!id,
  })
}

export function useCreateRFQ() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: RFQCreateData): Promise<RFQ> => {
      const response = await fetch('/api/v1/rfq/rfqs/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create RFQ')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] })
    },
  })
}

export function useSubmitRFQ() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: number): Promise<RFQ> => {
      const response = await fetch(`/api/v1/rfq/rfqs/${id}/submit/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to submit RFQ')
      }
      
      return response.json()
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] })
      queryClient.invalidateQueries({ queryKey: ['rfq', id] })
    },
  })
}

export function useAddRFQItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ rfqId, data }: { rfqId: number; data: RFQItemCreateData }): Promise<any> => {
      const response = await fetch(`/api/v1/rfq/rfqs/${rfqId}/add_item/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Failed to add RFQ item')
      }
      
      return response.json()
    },
    onSuccess: (_, { rfqId }) => {
      queryClient.invalidateQueries({ queryKey: ['rfq', rfqId] })
      queryClient.invalidateQueries({ queryKey: ['rfqs'] })
    },
  })
}

export function useUploadRFQItemFile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      itemId, 
      file, 
      fileType, 
      description 
    }: { 
      itemId: number
      file: File
      fileType: string
      description?: string 
    }): Promise<any> => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('file_type', fileType)
      if (description) formData.append('description', description)
      
      const response = await fetch(`/api/v1/rfq/rfq-items/${itemId}/upload_file/`, {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Failed to upload file')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] })
    },
  })
} 