import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, ArrowLeft, Save, Building, User } from 'lucide-react'
import { useCreateRFQ } from '@/hooks/useRFQ'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
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
import { type CreateRFQData } from '@/lib/types'
import { usePermissions } from '@/contexts/RoleContext'

const rfqSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  company: z.number({ required_error: 'Компания обязательна' }),
  contact_person: z.number().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  description: z.string(),
  deadline: z.string().optional(),
  delivery_address: z.string(),
  payment_terms: z.string(),
  delivery_terms: z.string(),
  notes: z.string(),
})

type RFQFormData = z.infer<typeof rfqSchema>

export function CreateRFQPage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createRFQ = useCreateRFQ()
  const { canCreateRFQ } = usePermissions()

  // Проверка прав доступа
  if (!canCreateRFQ()) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Доступ запрещен</h2>
          <p className="text-muted-foreground mb-4">
            У вас нет прав на создание RFQ. Обратитесь к администратору.
          </p>
          <Button onClick={() => navigate({ to: '/rfq' })}>
            Вернуться к списку RFQ
          </Button>
        </div>
      </div>
    )
  }

  const form = useForm<RFQFormData>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      title: '',
      priority: 'medium',
      description: '',
      delivery_address: '',
      payment_terms: '',
      delivery_terms: '',
      notes: '',
    },
  })

  const onSubmit = async (data: RFQFormData) => {
    setIsSubmitting(true)
    try {
      const rfqData: CreateRFQData = {
        ...data,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : undefined,
      }
      
             const result = await createRFQ.mutateAsync(rfqData)
       navigate({ to: '/rfq/$rfqId', params: { rfqId: result.id } })
    } catch (error) {
      console.error('Ошибка создания RFQ:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header className="sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate({ to: '/rfq' })}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div className="flex items-center gap-2">
            <Plus className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Создать RFQ</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            type="submit" 
            form="rfq-form"
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </Header>

      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Form {...form}>
            <form id="rfq-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Основная информация */}
              <Card>
                <CardHeader>
                  <CardTitle>Основная информация</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Название RFQ *</FormLabel>
                          <FormControl>
                            <Input placeholder="Введите название запроса" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Приоритет</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите приоритет" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Низкий</SelectItem>
                              <SelectItem value="medium">Средний</SelectItem>
                              <SelectItem value="high">Высокий</SelectItem>
                              <SelectItem value="urgent">Срочный</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Описание</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Подробное описание запроса"
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Крайний срок</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Информация о заказчике */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Информация о заказчике
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Компания *</FormLabel>
                          <Select onValueChange={(value) => field.onChange(Number(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите компанию" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {/* Здесь будет список компаний из API */}
                              <SelectItem value="1">Компания 1</SelectItem>
                              <SelectItem value="2">Компания 2</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contact_person"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Контактное лицо</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите контактное лицо" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {/* Здесь будет список контактных лиц из API */}
                              <SelectItem value="1">Иван Иванов</SelectItem>
                              <SelectItem value="2">Петр Петров</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Условия поставки и оплаты */}
              <Card>
                <CardHeader>
                  <CardTitle>Условия поставки и оплаты</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="delivery_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Адрес доставки</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Укажите адрес доставки"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="payment_terms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Условия оплаты</FormLabel>
                          <FormControl>
                            <Input placeholder="Например: 100% предоплата" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="delivery_terms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Условия поставки</FormLabel>
                          <FormControl>
                            <Input placeholder="Например: EXW, FCA, DAP" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Дополнительная информация */}
              <Card>
                <CardHeader>
                  <CardTitle>Дополнительная информация</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Заметки</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Внутренние заметки и комментарии"
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>
      </main>
    </div>
  )
} 