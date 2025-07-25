import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'

export interface Contact {
  id: number
  ext_id: string
  first_name?: string // опциональное (не всегда приходит в списке)
  last_name?: string // опциональное (не всегда приходит в списке)
  full_name?: string // добавляем для списка
  middle_name?: string
  email: string
  phone?: string
  position?: string
  department?: string
  status: 'active' | 'inactive' | 'suspended'
  is_primary_contact: boolean
  notes?: string
  created_at: string
  updated_at?: string
  company: {
    id: number
    name: string
    ext_id?: string
  }
  company_name?: string // добавляем для списка
}

export interface ContactCreateData {
  first_name: string
  last_name: string
  middle_name?: string
  email: string
  phone?: string
  position?: string
  department?: string
  status: Contact['status']
  is_primary_contact?: boolean
  notes?: string
  company: number
}

export interface ContactUpdateData extends Partial<ContactCreateData> {}

export interface ContactsResponse {
  count: number
  next: string | null
  previous: string | null
  results: Contact[]
}

export interface UseContactsParams {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  company?: number
  is_primary_contact?: boolean
}

export const useContacts = (params: UseContactsParams = {}) => {
  const {
    page = 1,
    pageSize = 25,
    search = '',
    status = '',
    company,
    is_primary_contact
  } = params

  return useQuery({
    queryKey: ['contacts', { page, pageSize, search, status, company, is_primary_contact }],
    queryFn: async (): Promise<ContactsResponse> => {
      const searchParams = new URLSearchParams()
      
      searchParams.append('page', page.toString())
      searchParams.append('page_size', pageSize.toString())
      
      if (search) {
        searchParams.append('search', search)
      }
      
      if (status) {
        searchParams.append('status', status)
      }
      
      if (company) {
        searchParams.append('company', company.toString())
      }
      
      if (is_primary_contact !== undefined) {
        searchParams.append('is_primary_contact', is_primary_contact.toString())
      }

      const response = await apiClient.get<ContactsResponse>(`/person/persons/?${searchParams}`)
      return response.data
    },
    staleTime: 30 * 1000, // 30 секунд
  })
}

export const useContact = (id: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: async (): Promise<Contact> => {
      const response = await apiClient.get<Contact>(`/person/persons/${id}/`)
      return response.data
    },
    enabled: enabled && !!id,
    staleTime: 30 * 1000, // 30 секунд
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: ContactCreateData): Promise<Contact> => {
      const response = await apiClient.post<Contact>('/person/persons/', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ContactUpdateData }): Promise<Contact> => {
      const response = await apiClient.patch<Contact>(`/person/persons/${id}/`, data)
      return response.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['contact', id] })
    },
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await apiClient.delete(`/person/persons/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
} 