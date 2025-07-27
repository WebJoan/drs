import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { toast } from 'sonner'
import { type RFQItem, type CreateQuotationItemData } from '@/lib/types'

const quotationItemSchema = z.object({
  proposed_product_name: z.string().min(1, 'Название товара обязательно'),
  proposed_manufacturer: z.string().min(1, 'Производитель обязателен'),
  proposed_part_number: z.string().min(1, 'Артикул обязателен'),
  quantity: z.number().min(1, 'Количество должно быть больше 0'),
  unit_cost_price: z.number().min(0, 'Себестоимость не может быть отрицательной'),
  cost_markup_percent: z.number().min(0, 'Наценка не может быть отрицательной'),
  delivery_time: z.string().min(1, 'Срок поставки обязателен'),
  notes: z.string().optional(),
})

type QuotationItemFormData = z.infer<typeof quotationItemSchema>

interface QuotationItemFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rfqItem: RFQItem
  onSubmit: (data: CreateQuotationItemData) => Promise<void>
  isLoading?: boolean
}

export function QuotationItemForm({ 
  open, 
  onOpenChange, 
  rfqItem, 
  onSubmit,
  isLoading = false 
}: QuotationItemFormProps) {
  const form = useForm<QuotationItemFormData>({
    resolver: zodResolver(quotationItemSchema),
    defaultValues: {
      proposed_product_name: rfqItem.product_name || '',
      proposed_manufacturer: rfqItem.manufacturer || '',
      proposed_part_number: rfqItem.part_number || '',
      quantity: rfqItem.quantity,
      unit_cost_price: 0,
      cost_markup_percent: 20, // 20% наценка по умолчанию
      delivery_time: '',
      notes: '',
    },
  })

  const watchedCostPrice = form.watch('unit_cost_price')
  const watchedMarkup = form.watch('cost_markup_percent')
  const watchedQuantity = form.watch('quantity')

  // Вычисляем цены
  const unitMarkupAmount = (watchedCostPrice * watchedMarkup) / 100
  const unitSellingPrice = watchedCostPrice + unitMarkupAmount
  const totalCostPrice = watchedCostPrice * watchedQuantity
  const totalMarkupAmount = unitMarkupAmount * watchedQuantity
  const totalSellingPrice = unitSellingPrice * watchedQuantity

  const handleSubmit = async (data: QuotationItemFormData) => {
    try {
      await onSubmit({
        rfq_item: rfqItem.id,
        proposed_product_name: data.proposed_product_name,
        proposed_manufacturer: data.proposed_manufacturer,
        proposed_part_number: data.proposed_part_number,
        quantity: data.quantity,
        unit_cost_price: data.unit_cost_price,
        cost_markup_percent: data.cost_markup_percent,
        delivery_time: data.delivery_time,
        notes: data.notes || '',
      })
      
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Ошибка создания позиции котировки:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить позицию в котировку</DialogTitle>
          <DialogDescription>
            Позиция #{rfqItem.line_number}: {rfqItem.product_name_display}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Информация о запрашиваемой позиции */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Запрашиваемая позиция</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Товар</Label>
                    <p className="font-medium">{rfqItem.product_name_display}</p>
                  </div>
                  <div>
                    <Label>Количество</Label>
                    <p className="font-medium">{rfqItem.quantity} {rfqItem.unit}</p>
                  </div>
                  {rfqItem.specifications && (
                    <div className="md:col-span-2">
                      <Label>Технические требования</Label>
                      <p className="text-muted-foreground">{rfqItem.specifications}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Предлагаемый товар */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Предлагаемый товар</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="proposed_product_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Название товара *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="proposed_manufacturer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Производитель *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="proposed_part_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Артикул *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Количество и цены */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Количество и цены</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Количество *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit_cost_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Себестоимость за единицу *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cost_markup_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Наценка (%) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1"
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Расчёт цен */}
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="font-medium mb-3">Расчёт стоимости</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Label>Наценка за единицу</Label>
                      <p className="font-medium">{unitMarkupAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <Label>Цена за единицу</Label>
                      <p className="font-medium">{unitSellingPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <Label>Общая себестоимость</Label>
                      <p className="font-medium">{totalCostPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <Label>Общая стоимость</Label>
                      <p className="font-medium text-lg">{totalSellingPrice.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Дополнительная информация */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="delivery_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Срок поставки *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Например: 14-21 день"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Примечания</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Дополнительные комментарии"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Добавление...' : 'Добавить позицию'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 