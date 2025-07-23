export interface Company {
  id: number
  ext_id?: string
  name: string
  short_name?: string
  company_type: 'manufacturer' | 'distributor' | 'integrator' | 'end_user' | 'other'
  status: 'active' | 'potential' | 'inactive' | 'blacklist'
  inn?: string
  ogrn?: string
  legal_address?: string
  actual_address?: string
  website?: string
  phone?: string
  email?: string
  industry?: string
  annual_revenue?: number
  employees_count?: number
  sales_manager?: number
  sales_manager_name?: string
  notes?: string
  employees_count_actual?: number
  primary_contact?: {
    id: number
    name: string
    email: string
    phone?: string
    position?: string
  }
  active_employees_count?: number
  created_at: string
  updated_at: string
}

export interface CompanyCreateData {
  name: string
  short_name?: string
  company_type: Company['company_type']
  status: Company['status']
  inn?: string
  ogrn?: string
  legal_address?: string
  actual_address?: string
  website?: string
  phone?: string
  email?: string
  industry?: string
  annual_revenue?: number
  employees_count?: number
  sales_manager?: number
  notes?: string
  ext_id?: string
}

export interface CompanyUpdateData extends Partial<CompanyCreateData> {}

export interface CompaniesResponse {
  count: number
  next?: string
  previous?: string
  page: number
  page_size: number
  total_pages: number
  results: Company[]
}

export interface CompanyStatistics {
  total: number
  by_status: Record<string, { count: number; label: string }>
  by_type: Record<string, { count: number; label: string }>
} 