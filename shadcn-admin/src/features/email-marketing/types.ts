export interface AiEmailAttachment {
  id: number
  file: string
  name: string
  created_at: string
}

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  role: string
}

export interface Person {
  id: number
  name: string
  email: string
  phone: string
  company?: string
}

export interface AiEmail {
  id: number
  subject: string
  body: string
  status: 'draft' | 'sent' | 'delivered' | 'error' | 'archived'
  sales_manager?: User | null
  recipient: Person
  attachments: AiEmailAttachment[]
  created_at: string
  updated_at: string
}

export interface AiEmailCreateRequest {
  subject: string
  body: string
  status?: string
  sales_manager_id?: number
  recipient_id: number
}

export interface AiEmailUpdateRequest {
  subject?: string
  body?: string
  status?: string
}

export interface AiEmailGenerateRequest {
  recipient_id: number
  context?: string
  tone: 'formal' | 'friendly' | 'professional' | 'casual'
  purpose: 'introduction' | 'offer' | 'follow_up' | 'information' | 'invitation'
  products?: number[]
  include_sales_data?: boolean
  use_structured?: boolean
}

export interface AiEmailAttachmentCreateRequest {
  file: File
  name?: string
  ai_email_id: number
}

export interface SalesInsightsRequest {
  company_id: number
  person_id: number
}

export interface SalesInsightsResponse {
  company_name: string
  person_name: string
  insights: {
    total_sales: number
    last_purchase_date?: string
    preferred_products: string[]
    sales_trend: 'increasing' | 'decreasing' | 'stable'
    average_order_value: number
    purchase_frequency: string
    notes: string
  }
  task_id: string
}

export interface ApiResponse<T> {
  count: number
  next: string | null
  previous: string | null
  page: number
  page_size: number
  total_pages: number
  results: T[]
}

export type EmailStatus = 'draft' | 'sent' | 'delivered' | 'error' | 'archived'
export type EmailTone = 'formal' | 'friendly' | 'professional' | 'casual'
export type EmailPurpose = 'introduction' | 'offer' | 'follow_up' | 'information' | 'invitation'

// Константы для отображения статусов и других значений
export const EMAIL_STATUS_LABELS: Record<EmailStatus, string> = {
  draft: 'Черновик',
  sent: 'Отправлено',
  delivered: 'Доставлено',
  error: 'Ошибка',
  archived: 'Архив',
}

export const EMAIL_TONE_LABELS: Record<EmailTone, string> = {
  formal: 'Формальный',
  friendly: 'Дружелюбный',
  professional: 'Профессиональный',
  casual: 'Неформальный',
}

export const EMAIL_PURPOSE_LABELS: Record<EmailPurpose, string> = {
  introduction: 'Знакомство',
  offer: 'Предложение',
  follow_up: 'Повторное обращение',
  information: 'Информационное',
  invitation: 'Приглашение',
}