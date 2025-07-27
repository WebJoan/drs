import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { type CreateQuotationData, type CreateQuotationItemData, type Currency, type RFQ } from '@/lib/types'

const quickQuotationSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  currency: z.number().min(1, 'Валюта обязательна'),
  description: z.string().optional(),
  valid_until: z.string().optional(),
  delivery_time: z.string().min(1, 'Срок поставки обязателен'),
  payment_terms: z.string().min(1, 'Условия оплаты обязательны'),
  delivery_terms: z.string().min(1, 'Условия поставки обязательны'),
  notes: z.string().optional(),
})

type QuickQuotationFormData = z.infer<typeof quickQuotationSchema>

interface QuickQuotationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rfq: RFQ
  proposals: CreateQuotationItemData[]
  currencies?: Currency[]
  onSubmit: (quotation: CreateQuotationData, items: CreateQuotationItemData[]) => Promise<void>
  isLoading?: boolean
}

export function QuickQuotationModal({
  open,
  onOpenChange,
  rfq,
  proposals,
  currencies = [],
  onSubmit,
  isLoading = false
}: QuickQuotationModalProps) {
  const form = useForm<QuickQuotationFormData>({
    resolver: zodResolver(quickQuotationSchema),
    defaultValues: {
      title: `Предложение по RFQ ${rfq.number}`,
      currency: Array.isArray(currencies) && currencies.length > 0 ? currencies[0].id : 1, // USD по умолчанию
      description: '',
      valid_until: '',
      delivery_time: '14-21 рабочий день',
      payment_terms: '100% предоплата',
      delivery_terms: 'EXW склад поставщика',
      notes: '',
    },
  })

  // Обновляем валюту по умолчанию когда загружаются данные
  useEffect(() => {
    if (Array.isArray(currencies) && currencies.length > 0 && !form.getValues('currency')) {
      form.setValue('currency', currencies[0].id)
    }
  }, [currencies, form])

  // Вычисляем общую стоимость
  const totalAmount = proposals.reduce((total, item) => {
    const unitPrice = item.unit_cost_price + (item.unit_cost_price * item.cost_markup_percent) / 100
    return total + (unitPrice * item.quantity)
  }, 0)

  const selectedCurrency = Array.isArray(currencies) ? currencies.find(c => c.id === form.watch('currency')) : undefined

  const handleSubmit = async (data: QuickQuotationFormData) => {
    try {
      const quotationData: CreateQuotationData = {
        rfq: rfq.id,
        title: data.title,
        currency: data.currency,
        description: data.description || '',
        valid_until: data.valid_until || undefined,
        delivery_time: data.delivery_time,
        payment_terms: data.payment_terms,
        delivery_terms: data.delivery_terms,
        notes: data.notes || '',
      }

      await onSubmit(quotationData, proposals)
      onOpenChange(false)
    } catch (error) {
      console.error('Ошибка создания котировки:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Быстрое создание котировки</DialogTitle>
          <DialogDescription>
            Создание котировки на основе добавленных предложений для RFQ {rfq.number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Информация о предложениях */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Предложения ({proposals.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {proposals.map((proposal, index) => {
                  const unitPrice = proposal.unit_cost_price + (proposal.unit_cost_price * proposal.cost_markup_percent) / 100
                  const totalPrice = unitPrice * proposal.quantity
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                      <div className="flex-1">
                        <span className="font-medium">{proposal.proposed_product_name}</span>
                        <span className="text-muted-foreground ml-2">
                          {proposal.quantity} шт × {unitPrice.toFixed(2)} = {totalPrice.toFixed(2)}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {proposal.cost_markup_percent}%
                      </Badge>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Общая стоимость:</span>
                  <span className="text-lg font-bold">
                    {totalAmount.toFixed(2)} {selectedCurrency?.symbol || ''}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Форма котировки */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название котировки *</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите валюту" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(currencies) && currencies.map((currency) => (
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
                        className="min-h-[80px]" 
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
                  name="valid_until"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Действительно до</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="payment_terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Условия оплаты *</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input {...field} />
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
                        className="min-h-[80px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
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
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
} 