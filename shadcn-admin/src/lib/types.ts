// Типы для API
export interface ApiError {
  status: number
  errors?: Record<string, string[]>
  text?: string
  detail?: string
}

// Типы для пользователя - соответствуют Django UserSimpleSerializer
export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
}

export interface ApiUser {
  id: number
  email: string
  first_name: string
  last_name: string
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