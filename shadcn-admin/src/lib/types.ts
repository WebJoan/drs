// Типы для API
export interface ApiError {
  status: number
  errors?: Record<string, string[]>
  text?: string
  detail?: string
}

// Роли пользователей - соответствуют Django User.RoleChoices
export enum UserRole {
  ADMIN = 'admin',
  PRODUCT_MANAGER = 'product',
  SALES_MANAGER = 'sales',
  USER = 'user',
}

// Типы для пользователя - соответствуют Django UserSimpleSerializer
export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  role: UserRole
}

export interface ApiUser {
  id: number
  email: string
  first_name: string
  last_name: string
  role: UserRole
}

// Типы для создания пользователя
export interface CreateUserData {
  email: string
  first_name: string
  last_name: string
  password: string
}

// Типы для обновления пользователя
export interface UpdateUserData {
  email?: string
  first_name?: string
  last_name?: string
  password?: string
}

// Типы для авторизации
export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
}

// Типы для конфигурации приложения
export interface AppConfig {
  debug: boolean
  media_url: string
  static_url: string
  app_version: string
}

// Типы для API ответов
export interface ApiResponse<T> {
  data: T
  status: number
  statusText: string
}

// Типы для пагинации (если будет нужно в будущем)
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// Типы для форм
export interface UserFormData {
  first_name: string
  last_name: string
  email: string
  password: string
  confirmPassword: string
  isEdit: boolean
}

// Типы для товаров
export interface ProductGroup {
  id: number
  name: string
  ext_id: string
}

export interface Brand {
  id: number
  name: string
  ext_id: string
  product_manager?: User
  product_manager_id?: number
}

export interface ProductSubgroup {
  id: number
  name: string
  ext_id: string
  group: ProductGroup
  group_id: number
  product_manager: User
  product_manager_id: number
}

export interface Product {
  id: number
  name: string
  ext_id: string
  subgroup: ProductSubgroup
  subgroup_id: number
  brand?: Brand
  brand_id?: number
  product_manager?: User
  product_manager_id?: number
  responsible_manager?: User
}

// Типы для создания товара
export interface CreateProductData {
  name: string
  subgroup_id: number
  brand_id?: number
  product_manager_id?: number
}

// Типы для обновления товара
export interface UpdateProductData {
  name?: string
  subgroup_id?: number
  brand_id?: number
  product_manager_id?: number
}

// Типы для создания бренда
export interface CreateBrandData {
  name: string
  product_manager_id?: number
}

// Типы для обновления бренда
export interface UpdateBrandData {
  name?: string
  product_manager_id?: number
}

// Типы для создания подгруппы
export interface CreateProductSubgroupData {
  name: string
  group_id: number
  product_manager_id: number
}

// Типы для обновления подгруппы
export interface UpdateProductSubgroupData {
  name?: string
  group_id?: number
  product_manager_id?: number
}

// Типы для создания группы товаров
export interface CreateProductGroupData {
  name: string
}

// Типы для обновления группы товаров
export interface UpdateProductGroupData {
  name?: string
}

// Типы для форм
export interface ProductFormData {
  name: string
  subgroup_id: number
  brand_id?: number
  product_manager_id?: number
  isEdit: boolean
} 

// Типы для RFQ (Request for Quotation) системы
export interface Currency {
  id: number
  code: string
  name: string
  symbol: string
  exchange_rate_to_rub: number
  is_active: boolean
  updated_at: string
}

export interface RFQItemFile {
  id: number
  file: string
  file_type: 'photo' | 'datasheet' | 'specification' | 'drawing' | 'other'
  description: string
  uploaded_at: string
  file_size?: number
  file_url?: string
}

export interface RFQItem {
  id: number
  line_number: number
  product?: Product
  product_name: string
  manufacturer: string
  part_number: string
  quantity: number
  unit: string
  specifications: string
  comments: string
  is_new_product: boolean
  files: RFQItemFile[]
  created_at: string
  product_name_display: string
  product_details?: {
    id: number
    name: string
    subgroup: string
    brand?: string
    manager?: string
  }
}

export interface RFQ {
  id: number
  ext_id: string
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
  description: string
  deadline?: string
  delivery_address: string
  payment_terms: string
  delivery_terms: string
  notes: string
  items: RFQItem[]
  items_count: number
  quotations_count: number
  created_at: string
  updated_at: string
}

export interface QuotationItem {
  id: number
  rfq_item: number
  rfq_item_details: {
    line_number: number
    requested_quantity: number
    product_name: string
    specifications: string
  }
  product?: Product
  proposed_product_name: string
  proposed_manufacturer: string
  proposed_part_number: string
  quantity: number
  unit_cost_price: number
  cost_markup_percent: number
  unit_price: number
  delivery_time: string
  notes: string
  product_name_display: string
  price_breakdown: {
    total_cost: number
    total_price: number
    markup_amount: number
    markup_percent: number
  }
}

export interface Quotation {
  id: number
  ext_id: string
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
  description: string
  valid_until?: string
  delivery_time: string
  payment_terms: string
  delivery_terms: string
  notes: string
  items: QuotationItem[]
  total_amount: number
  created_at: string
  updated_at: string
}

// Типы для создания и обновления RFQ
export interface CreateRFQData {
  title: string
  company: number
  contact_person?: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  description: string
  deadline?: string
  delivery_address: string
  payment_terms: string
  delivery_terms: string
  notes: string
  ext_id?: string
}

export interface CreateRFQItemData {
  line_number: number
  product?: number
  product_name: string
  manufacturer: string
  part_number: string
  quantity: number
  unit: string
  specifications: string
  comments: string
  is_new_product: boolean
  ext_id?: string
}

export interface CreateQuotationData {
  rfq: number
  title: string
  currency: number
  description: string
  valid_until?: string
  delivery_time: string
  payment_terms: string
  delivery_terms: string
  notes: string
  ext_id?: string
}

export interface CreateQuotationItemData {
  rfq_item: number
  product?: number
  proposed_product_name: string
  proposed_manufacturer: string
  proposed_part_number: string
  quantity: number
  unit_cost_price: number
  cost_markup_percent: number
  delivery_time: string
  notes: string
  ext_id?: string
}

// Типы для списков с пагинацией
export interface PaginatedRFQResponse {
  count: number
  next: string | null
  previous: string | null
  page: number
  page_size: number
  total_pages: number
  results: RFQ[]
}

export interface PaginatedQuotationResponse {
  count: number
  next: string | null
  previous: string | null
  page: number
  page_size: number
  total_pages: number
  results: Quotation[]
} 