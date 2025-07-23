export interface Currency {
  id: number
  code: string
  name: string
  symbol: string
  exchange_rate_to_rub: number
  is_active: boolean
}

export interface RFQItemFile {
  id: number
  file: string
  file_type: 'photo' | 'datasheet' | 'specification' | 'drawing' | 'other'
  description?: string
  file_size?: number
  file_url?: string
  uploaded_at: string
}

export interface RFQItem {
  id: number
  line_number: number
  product?: number
  product_name?: string
  manufacturer?: string
  part_number?: string
  product_name_display: string
  product_details?: {
    id: number
    name: string
    subgroup: string
    brand?: string
    manager?: string
  }
  quantity: number
  unit: string
  specifications?: string
  comments?: string
  is_new_product: boolean
  files: RFQItemFile[]
  files_count: number
  created_at: string
}

export interface RFQ {
  id: number
  ext_id?: string
  number: string
  title: string
  company: number
  company_name: string
  contact_person?: number
  contact_person_name?: string
  sales_manager?: number
  sales_manager_name?: string
  status: 'draft' | 'submitted' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  description?: string
  deadline?: string
  delivery_address?: string
  payment_terms?: string
  delivery_terms?: string
  notes?: string
  items: RFQItem[]
  items_count: number
  quotations_count: number
  created_at: string
  updated_at: string
}

export interface RFQCreateData {
  title: string
  company: number
  contact_person?: number
  priority: RFQ['priority']
  description?: string
  deadline?: string
  delivery_address?: string
  payment_terms?: string
  delivery_terms?: string
  notes?: string
  ext_id?: string
}

export interface RFQItemCreateData {
  line_number?: number
  product?: number
  product_name?: string
  manufacturer?: string
  part_number?: string
  quantity: number
  unit: string
  specifications?: string
  comments?: string
  is_new_product: boolean
  ext_id?: string
}

export interface QuotationItem {
  id: number
  rfq_item: number
  rfq_item_details: {
    line_number: number
    requested_quantity: number
    product_name: string
    specifications?: string
  }
  product?: number
  proposed_product_name?: string
  proposed_manufacturer?: string
  proposed_part_number?: string
  product_name_display: string
  quantity: number
  unit_cost_price: number
  cost_markup_percent: number
  unit_price: number
  delivery_time?: string
  notes?: string
  price_breakdown: {
    unit_cost_price: number
    unit_markup_amount: number
    unit_selling_price: number
    quantity: number
    total_cost_price: number
    total_markup_amount: number
    total_selling_price: number
    markup_percent: number
  }
}

export interface Quotation {
  id: number
  ext_id?: string
  number: string
  title: string
  rfq: number
  rfq_details: {
    id: number
    number: string
    title: string
    company_name: string
    contact_person?: string
    deadline?: string
  }
  product_manager?: number
  product_manager_name?: string
  status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'expired'
  currency: number
  currency_details: Currency
  description?: string
  valid_until?: string
  delivery_time?: string
  payment_terms?: string
  delivery_terms?: string
  notes?: string
  items: QuotationItem[]
  items_count: number
  total_amount: number
  created_at: string
  updated_at: string
}

export interface RFQsResponse {
  count: number
  next?: string
  previous?: string
  page: number
  page_size: number
  total_pages: number
  results: RFQ[]
}

export interface QuotationsResponse {
  count: number
  next?: string
  previous?: string
  page: number
  page_size: number
  total_pages: number
  results: Quotation[]
} 