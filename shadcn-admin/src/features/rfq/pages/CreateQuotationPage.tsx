import { useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { ArrowLeft, FileText, Save, Plus, Package } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRFQ, useCreateQuotation, useCurrencies } from '@/hooks/useRFQ'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { useCurrentUser } from '@/hooks/useAuth'
import { type RFQItem, type CreateQuotationItemData } from '@/lib/types'
import { QuotationItemForm } from '@/features/rfq/components/QuotationItemForm'

const quotationSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  currency: z.number().min(1, 'Валюта обязательна'),
  description: z.string().optional(),
  valid_until: z.string().optional(),
  delivery_time: z.string().min(1, 'Срок поставки обязателен'),
  payment_terms: z.string().min(1, 'Условия оплаты обязательны'),
  delivery_terms: z.string().min(1, 'Условия поставки обязательны'),
  notes: z.string().optional(),
})

type QuotationFormData = z.infer<typeof quotationSchema>

export function CreateQuotationPage() {
  const navigate = useNavigate()
  const { rfqId } = useSearch({ from: '/_authenticated/rfq/quotations/create' })
  const { data: rfq, isLoading: rfqLoading } = useRFQ(Number(rfqId))
  const { data: currencies } = useCurrencies()
  const { data: currentUser } = useCurrentUser()
  const createQuotationMutation = useCreateQuotation()
  
  // Состояние для управления позициями котировки
  const [quotationItems, setQuotationItems] = useState<CreateQuotationItemData[]>([])
  const [isItemFormOpen, setIsItemFormOpen] = useState(false)
  const [selectedRFQItem, setSelectedRFQItem] = useState<RFQItem | null>(null)

  const form = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      title: '',
      currency: undefined,
      description: '',
      valid_until: '',
      delivery_time: '',
      payment_terms: '',
      delivery_terms: '',
      notes: '',
    },
  })

  // Обработчики для позиций котировки
  const handleAddQuotationItem = async (itemData: CreateQuotationItemData) => {
    setQuotationItems(prev => [...prev, itemData])
    toast.success('Позиция добавлена в котировку')
  }

  const handleOpenItemForm = (rfqItem: RFQItem) => {
    setSelectedRFQItem(rfqItem)
    setIsItemFormOpen(true)
  }

  const handleRemoveQuotationItem = (rfqItemId: number) => {
    setQuotationItems(prev => prev.filter(item => item.rfq_item !== rfqItemId))
    toast.success('Позиция удалена из котировки')
  }

  // Вычисляем общую стоимость котировки
  const totalAmount = quotationItems.reduce((total, item) => {
    const unitPrice = item.unit_cost_price + (item.unit_cost_price * item.cost_markup_percent) / 100
    return total + (unitPrice * item.quantity)
  }, 0)

  const onSubmit = async (data: QuotationFormData) => {
    if (!rfqId) {
      toast.error('RFQ ID не найден')
      return
    }

    if (quotationItems.length === 0) {
      toast.error('Добавьте хотя бы одну позицию в котировку')
      return
    }

    try {
      const quotation = await createQuotationMutation.mutateAsync({
        rfq: Number(rfqId),
        title: data.title,
        currency: data.currency,
        description: data.description || '',
        valid_until: data.valid_until || undefined,
        delivery_time: data.delivery_time,
        payment_terms: data.payment_terms,
        delivery_terms: data.delivery_terms,
        notes: data.notes || '',
      })

      toast.success('Котировка создана успешно')
      navigate({ to: '/rfq/$rfqId', params: { rfqId: Number(rfqId) } })
    } catch (error) {
      console.error('Ошибка создания котировки:', error)
    }
  }

  if (rfqLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!rfq) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Ошибка</h2>
          <p className="text-muted-foreground">RFQ не найден</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header className="sticky top-0 z-10">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate({ to: '/rfq/$rfqId', params: { rfqId: Number(rfqId) } })}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к RFQ
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              <h1 className="text-xl font-semibold">Создать предложение</h1>
            </div>
          </div>
        </div>
      </Header>

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Информация о RFQ */}
          <Card>
            <CardHeader>
              <CardTitle>RFQ: {rfq.number}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Название:</span>
                  <div className="font-medium">{rfq.title}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Компания:</span>
                  <div className="font-medium">{rfq.company_name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Позиций:</span>
                  <div className="font-medium">{rfq.items_count}</div>
                </div>
                {rfq.deadline && (
                  <div>
                    <span className="text-muted-foreground">Крайний срок:</span>
                    <div className="font-medium">
                      {new Date(rfq.deadline).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Позиции котировки */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Позиции котировки
                </CardTitle>
                <Badge variant="outline" className="ml-2">
                  {quotationItems.length} из {rfq.items_count}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Список позиций RFQ для добавления */}
              <div className="space-y-4">
                <h4 className="font-medium">Позиции RFQ для котирования</h4>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">#</TableHead>
                        <TableHead>Товар</TableHead>
                        <TableHead>Количество</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead className="w-32">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rfq.items.map((item: RFQItem) => {
                        const isQuoted = quotationItems.some(qi => qi.rfq_item === item.id)
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.line_number}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.product_name_display}</p>
                                {item.specifications && (
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {item.specifications}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {item.quantity} {item.unit}
                            </TableCell>
                            <TableCell>
                              {isQuoted ? (
                                <Badge variant="default">Добавлено</Badge>
                              ) : (
                                <Badge variant="secondary">Не добавлено</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {isQuoted ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveQuotationItem(item.id)}
                                >
                                  Удалить
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenItemForm(item)}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Добавить
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Добавленные позиции котировки */}
                {quotationItems.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Добавленные позиции</h4>
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <div className="space-y-3">
                        {quotationItems.map((item, index) => {
                          const unitPrice = item.unit_cost_price + (item.unit_cost_price * item.cost_markup_percent) / 100
                          const totalPrice = unitPrice * item.quantity
                          return (
                            <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                              <div className="flex-1">
                                <p className="font-medium">{item.proposed_product_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.proposed_manufacturer} • {item.proposed_part_number}
                                </p>
                                <p className="text-sm">
                                  {item.quantity} шт × {unitPrice.toFixed(2)} = {totalPrice.toFixed(2)}
                                </p>
                              </div>
                              <Badge variant="outline">
                                {item.cost_markup_percent}% наценка
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Общая стоимость:</span>
                          <span className="text-lg font-bold">{totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Форма создания котировки */}
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Название котировки *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Введите название котировки" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Валюта *</FormLabel>
                          <Select onValueChange={(value) => field.onChange(Number(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите валюту" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {currencies?.map((currency) => (
                                <SelectItem key={currency.id} value={currency.id.toString()}>
                                  {currency.code} - {currency.name}
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
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Описание</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Дополнительная информация о котировке"
                            className="min-h-[100px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="valid_until"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Действительно до</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="delivery_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Срок поставки *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Например: 30 дней с момента оплаты" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="payment_terms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Условия оплаты *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Например: 100% предоплата" 
                              {...field} 
                            />
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
                          <FormLabel>Условия поставки *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Например: EXW Москва" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Дополнительные примечания</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Дополнительные условия и примечания"
                            className="min-h-[100px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center gap-4 pt-4">
                    <Button
                      type="submit"
                      disabled={createQuotationMutation.isPending}
                      className="flex-1 md:flex-none"
                    >
                      {createQuotationMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Создание...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Создать котировку
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate({ to: '/rfq/$rfqId', params: { rfqId: Number(rfqId) } })}
                      className="flex-1 md:flex-none"
                    >
                      Отмена
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Модальное окно для добавления позиции котировки */}
      {selectedRFQItem && (
        <QuotationItemForm
          open={isItemFormOpen}
          onOpenChange={setIsItemFormOpen}
          rfqItem={selectedRFQItem}
          onSubmit={handleAddQuotationItem}
        />
      )}
    </div>
  )
} 