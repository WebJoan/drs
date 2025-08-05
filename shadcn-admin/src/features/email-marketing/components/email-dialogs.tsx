import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { 
  useCreateAiEmail, 
  useUpdateAiEmail, 
  useGenerateAiEmail,
  useGeneratePersonalizedAiEmail
} from '../hooks/useEmailMarketing'
import { 
  AiEmail, 
  AiEmailCreateRequest, 
  AiEmailUpdateRequest,
  EMAIL_STATUS_LABELS,
  EMAIL_TONE_LABELS,
  EMAIL_PURPOSE_LABELS
} from '../types'

// Схемы валидации
const emailSchema = z.object({
  subject: z.string().min(1, 'Тема письма обязательна'),
  body: z.string().min(1, 'Содержание письма обязательно'),
  status: z.enum(['draft', 'sent', 'delivered', 'error', 'archived'] as const),
  sales_manager_id: z.number().optional(),
  recipient_id: z.number({
    required_error: 'Получатель обязателен'
  }),
})

const generateEmailSchema = z.object({
  recipient_id: z.number({
    required_error: 'Получатель обязателен'
  }),
  context: z.string().optional(),
  tone: z.enum(['formal', 'friendly', 'professional', 'casual'] as const, {
    required_error: 'Тон письма обязателен'
  }),
  purpose: z.enum(['introduction', 'offer', 'follow_up', 'information', 'invitation'] as const, {
    required_error: 'Цель письма обязательна'
  }),
  products: z.array(z.number()).optional(),
  include_sales_data: z.boolean().optional(),
  use_structured: z.boolean().optional(),
})

type EmailFormData = z.infer<typeof emailSchema>
type GenerateEmailFormData = z.infer<typeof generateEmailSchema>

interface EmailDialogsProps {
  // Диалог создания письма
  isCreateDialogOpen: boolean
  setIsCreateDialogOpen: (open: boolean) => void
  
  // Диалог редактирования письма
  isEditDialogOpen: boolean
  setIsEditDialogOpen: (open: boolean) => void
  editingEmail: AiEmail | null
  setEditingEmail: (email: AiEmail | null) => void
  
  // Диалог генерации AI письма
  isGenerateDialogOpen: boolean
  setIsGenerateDialogOpen: (open: boolean) => void
  
  // Контакты и менеджеры для селектов
  recipients?: Array<{ id: number; name: string; email: string }>
  salesManagers?: Array<{ id: number; first_name: string; last_name: string; email?: string }>
  products?: Array<{ id: number; name: string }>
  
  // Состояние загрузки данных
  isLoadingData?: boolean
}

export function EmailDialogs({
  isCreateDialogOpen,
  setIsCreateDialogOpen,
  isEditDialogOpen,
  setIsEditDialogOpen,
  editingEmail,
  setEditingEmail,
  isGenerateDialogOpen,
  setIsGenerateDialogOpen,
  recipients = [],
  salesManagers = [],
  products = [],
  isLoadingData = false,
}: EmailDialogsProps) {
  
  // Мутации для API
  const createEmailMutation = useCreateAiEmail()
  const updateEmailMutation = useUpdateAiEmail()
  const generateEmailMutation = useGenerateAiEmail()
  const generatePersonalizedEmailMutation = useGeneratePersonalizedAiEmail()

  // Форма создания/редактирования письма
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      subject: '',
      body: '',
      status: 'draft',
      recipient_id: 0,
    },
  })

  // Форма генерации AI письма
  const generateForm = useForm<GenerateEmailFormData>({
    resolver: zodResolver(generateEmailSchema),
    defaultValues: {
      recipient_id: 0,
      context: '',
      tone: 'professional',
      purpose: 'offer',
      products: [],
      include_sales_data: true,
      use_structured: true,
    },
  })

  // Заполнение формы при редактировании
  useEffect(() => {
    if (editingEmail && isEditDialogOpen) {
      emailForm.reset({
        subject: editingEmail.subject,
        body: editingEmail.body,
        status: editingEmail.status,
        recipient_id: editingEmail.recipient?.id || 0,
        sales_manager_id: editingEmail.sales_manager?.id,
      })
    }
  }, [editingEmail, isEditDialogOpen, emailForm])

  // Обработчики отправки форм
  const handleCreateEmail = (data: EmailFormData) => {
    const createData: AiEmailCreateRequest = {
      subject: data.subject,
      body: data.body,
      status: data.status,
      recipient_id: data.recipient_id,
      sales_manager_id: data.sales_manager_id,
    }

    createEmailMutation.mutate(createData, {
      onSuccess: () => {
        setIsCreateDialogOpen(false)
        emailForm.reset()
      },
    })
  }

  const handleUpdateEmail = (data: EmailFormData) => {
    if (!editingEmail) return

    const updateData: AiEmailUpdateRequest = {
      subject: data.subject,
      body: data.body,
      status: data.status,
    }

    updateEmailMutation.mutate({ id: editingEmail.id, data: updateData }, {
      onSuccess: () => {
        setIsEditDialogOpen(false)
        setEditingEmail(null)
        emailForm.reset()
      },
    })
  }

  const handleGenerateEmail = (data: GenerateEmailFormData) => {
    // Используем персонализированную генерацию если включены данные о продажах
    const mutation = data.include_sales_data 
      ? generatePersonalizedEmailMutation 
      : generateEmailMutation
    
    mutation.mutate(data, {
      onSuccess: (result) => {
        setIsGenerateDialogOpen(false)
        generateForm.reset()
        
        // Для асинхронной генерации показываем уведомление с task_id
        if (result.task_id) {
          toast.success(`Письмо генерируется... Task ID: ${result.task_id}`)
        } else if (result.id) {
          // Если получили готовое письмо, открываем его для редактирования
          setEditingEmail(result)
          setIsEditDialogOpen(true)
        }
      },
    })
  }

  // Обработчики закрытия диалогов
  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false)
    emailForm.reset()
  }

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false)
    setEditingEmail(null)
    emailForm.reset()
  }

  const handleCloseGenerateDialog = () => {
    setIsGenerateDialogOpen(false)
    generateForm.reset()
  }

  return (
    <>
      {/* Диалог создания письма */}
      <Dialog open={isCreateDialogOpen} onOpenChange={handleCloseCreateDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Создать письмо</DialogTitle>
            <DialogDescription>
              Создайте новое письмо для отправки клиенту
            </DialogDescription>
          </DialogHeader>

          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(handleCreateEmail)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={emailForm.control}
                  name="recipient_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Получатель *</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите получателя" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingData ? (
                            <SelectItem value="loading" disabled>
                              Загрузка получателей...
                            </SelectItem>
                          ) : recipients.length === 0 ? (
                            <SelectItem value="empty" disabled>
                              Получатели не найдены
                            </SelectItem>
                          ) : (
                            recipients.map((recipient) => (
                              <SelectItem key={recipient.id} value={recipient.id.toString()}>
                                {recipient.name} ({recipient.email})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={emailForm.control}
                  name="sales_manager_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Менеджер</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                        value={field.value?.toString() || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите менеджера" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingData ? (
                            <SelectItem value="loading" disabled>
                              Загрузка менеджеров...
                            </SelectItem>
                          ) : salesManagers.length === 0 ? (
                            <SelectItem value="empty" disabled>
                              Менеджеры не найдены
                            </SelectItem>
                          ) : (
                            salesManagers.map((manager) => (
                              <SelectItem key={manager.id} value={manager.id.toString()}>
                                {manager.first_name} {manager.last_name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={emailForm.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тема письма *</FormLabel>
                    <FormControl>
                      <Input placeholder="Введите тему письма" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={emailForm.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Содержание письма *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Введите содержание письма"
                        className="min-h-[200px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={emailForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Статус</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(EMAIL_STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseCreateDialog}>
                  Отмена
                </Button>
                <Button 
                  type="submit" 
                  disabled={createEmailMutation.isPending || isLoadingData}
                >
                  {createEmailMutation.isPending ? 'Создание...' : isLoadingData ? 'Загрузка данных...' : 'Создать'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования письма */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleCloseEditDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Редактировать письмо</DialogTitle>
            <DialogDescription>
              Внесите изменения в письмо
            </DialogDescription>
          </DialogHeader>

          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(handleUpdateEmail)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тема письма *</FormLabel>
                    <FormControl>
                      <Input placeholder="Введите тему письма" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={emailForm.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Содержание письма *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Введите содержание письма"
                        className="min-h-[200px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={emailForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Статус</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(EMAIL_STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseEditDialog}>
                  Отмена
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateEmailMutation.isPending}
                >
                  {updateEmailMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Диалог генерации AI письма */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={handleCloseGenerateDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Генерация AI письма</DialogTitle>
            <DialogDescription>
              Настройте параметры для генерации письма с помощью ИИ
            </DialogDescription>
          </DialogHeader>

          <Form {...generateForm}>
            <form onSubmit={generateForm.handleSubmit(handleGenerateEmail)} className="space-y-4">
              <FormField
                control={generateForm.control}
                name="recipient_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Получатель *</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите получателя" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingData ? (
                          <SelectItem value="loading" disabled>
                            Загрузка получателей...
                          </SelectItem>
                        ) : recipients.length === 0 ? (
                          <SelectItem value="empty" disabled>
                            Получатели не найдены
                          </SelectItem>
                        ) : (
                          recipients.map((recipient) => (
                            <SelectItem key={recipient.id} value={recipient.id.toString()}>
                              {recipient.name} ({recipient.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={generateForm.control}
                  name="tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тон письма *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(EMAIL_TONE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={generateForm.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Цель письма *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(EMAIL_PURPOSE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={generateForm.control}
                name="context"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Контекст (опционально)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Дополнительная информация для генерации письма"
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={generateForm.control}
                name="products"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Товары для упоминания (опционально)</FormLabel>
                    <div className="space-y-2">
                      {isLoadingData ? (
                        <div className="text-sm text-muted-foreground">Загрузка товаров...</div>
                      ) : products.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Товары не найдены</div>
                      ) : (
                        <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                          {products.slice(0, 20).map((product) => (
                            <div key={product.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`product-${product.id}`}
                                checked={field.value?.includes(product.id) || false}
                                onCheckedChange={(checked) => {
                                  const currentProducts = field.value || []
                                  if (checked) {
                                    field.onChange([...currentProducts, product.id])
                                  } else {
                                    field.onChange(currentProducts.filter((id: number) => id !== product.id))
                                  }
                                }}
                              />
                              <label 
                                htmlFor={`product-${product.id}`}
                                className="text-sm cursor-pointer"
                              >
                                {product.name}
                              </label>
                            </div>
                          ))}
                          {products.length > 20 && (
                            <div className="text-xs text-muted-foreground">
                              И еще {products.length - 20} товаров...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={generateForm.control}
                  name="include_sales_data"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium">
                          Использовать данные о продажах
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          ИИ будет учитывать историю покупок клиента при генерации письма
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={generateForm.control}
                  name="use_structured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium">
                          Структурированная генерация
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Более надежный метод генерации через Agno
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseGenerateDialog}>
                  Отмена
                </Button>
                <Button 
                  type="submit" 
                  disabled={generateEmailMutation.isPending || generatePersonalizedEmailMutation.isPending || isLoadingData}
                >
                  {(generateEmailMutation.isPending || generatePersonalizedEmailMutation.isPending) ? 'Генерация...' : isLoadingData ? 'Загрузка данных...' : 'Сгенерировать'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}