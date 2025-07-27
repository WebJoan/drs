import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Plus, ChevronDown, ChevronRight, Save, X, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { type RFQItem, type CreateQuotationItemData } from '@/lib/types'

const quickQuotationSchema = z.object({
  proposed_product_name: z.string().min(1, 'Название обязательно'),
  proposed_manufacturer: z.string().min(1, 'Производитель обязателен'),
  proposed_part_number: z.string().min(1, 'Артикул обязателен'),
  unit_cost_price: z.number().min(0, 'Цена не может быть отрицательной'),
  cost_markup_percent: z.number().min(0, 'Наценка не может быть отрицательной').max(1000, 'Наценка слишком большая'),
  delivery_time: z.string().min(1, 'Срок поставки обязателен'),
  notes: z.string().optional(),
})

type QuickQuotationFormData = z.infer<typeof quickQuotationSchema>

interface QuotationProposal extends CreateQuotationItemData {
  id: string // временный ID для фронтенда
}

interface QuickQuotationRowProps {
  rfqItem: RFQItem
  onAddProposal: (rfqItemId: number, proposal: CreateQuotationItemData) => void
  onRemoveProposal: (rfqItemId: number, proposalId: string) => void
  proposals: QuotationProposal[]
}

export function QuickQuotationRow({ 
  rfqItem, 
  onAddProposal, 
  onRemoveProposal, 
  proposals 
}: QuickQuotationRowProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const form = useForm<QuickQuotationFormData>({
    resolver: zodResolver(quickQuotationSchema),
    defaultValues: {
      proposed_product_name: rfqItem.product_name || '',
      proposed_manufacturer: rfqItem.manufacturer || '',
      proposed_part_number: rfqItem.part_number || '',
      unit_cost_price: 0,
      cost_markup_percent: 20,
      delivery_time: '',
      notes: '',
    },
  })

  const watchedCostPrice = form.watch('unit_cost_price')
  const watchedMarkup = form.watch('cost_markup_percent')

  // Вычисляем цены
  const unitSellingPrice = watchedCostPrice + (watchedCostPrice * watchedMarkup) / 100
  const totalSellingPrice = unitSellingPrice * rfqItem.quantity

  const handleSubmit = async (data: QuickQuotationFormData) => {
    try {
      const proposal: CreateQuotationItemData = {
        rfq_item: rfqItem.id,
        proposed_product_name: data.proposed_product_name,
        proposed_manufacturer: data.proposed_manufacturer,
        proposed_part_number: data.proposed_part_number,
        quantity: rfqItem.quantity,
        unit_cost_price: data.unit_cost_price,
        cost_markup_percent: data.cost_markup_percent,
        delivery_time: data.delivery_time,
        notes: data.notes || '',
      }

      onAddProposal(rfqItem.id, proposal)
      form.reset({
        proposed_product_name: rfqItem.product_name || '',
        proposed_manufacturer: rfqItem.manufacturer || '',
        proposed_part_number: rfqItem.part_number || '',
        unit_cost_price: 0,
        cost_markup_percent: 20,
        delivery_time: '',
        notes: '',
      })
      setIsFormOpen(false)
      toast.success('Предложение добавлено')
    } catch (error) {
      toast.error('Ошибка при добавлении предложения')
    }
  }

  const handleCancel = () => {
    form.reset()
    setIsFormOpen(false)
  }

  return (
    <div className="space-y-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">#{rfqItem.line_number}</Badge>
              <span className="font-medium text-sm">{rfqItem.product_name_display}</span>
              <span className="text-xs text-muted-foreground">
                {rfqItem.quantity} {rfqItem.unit}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={proposals.length > 0 ? "default" : "secondary"} className="text-xs">
              {proposals.length} предложений
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFormOpen(true)}
              className="h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Добавить
            </Button>
          </div>
        </div>

        <CollapsibleContent className="space-y-3">
          {/* Форма для добавления нового предложения */}
          {isFormOpen && (
            <Card className="border-dashed">
              <CardContent className="p-4">
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium">Товар *</label>
                      <Input
                        {...form.register('proposed_product_name')}
                        className="h-8 text-sm"
                        placeholder="Название товара"
                      />
                      {form.formState.errors.proposed_product_name && (
                        <p className="text-xs text-red-500 mt-1">
                          {form.formState.errors.proposed_product_name.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium">Производитель *</label>
                      <Input
                        {...form.register('proposed_manufacturer')}
                        className="h-8 text-sm"
                        placeholder="Производитель"
                      />
                      {form.formState.errors.proposed_manufacturer && (
                        <p className="text-xs text-red-500 mt-1">
                          {form.formState.errors.proposed_manufacturer.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium">Артикул *</label>
                      <Input
                        {...form.register('proposed_part_number')}
                        className="h-8 text-sm"
                        placeholder="Артикул"
                      />
                      {form.formState.errors.proposed_part_number && (
                        <p className="text-xs text-red-500 mt-1">
                          {form.formState.errors.proposed_part_number.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-medium">Себестоимость *</label>
                      <Input
                        {...form.register('unit_cost_price', { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        className="h-8 text-sm"
                        placeholder="0.00"
                      />
                      {form.formState.errors.unit_cost_price && (
                        <p className="text-xs text-red-500 mt-1">
                          {form.formState.errors.unit_cost_price.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium">Наценка (%) *</label>
                      <Input
                        {...form.register('cost_markup_percent', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        className="h-8 text-sm"
                        placeholder="20"
                      />
                      {form.formState.errors.cost_markup_percent && (
                        <p className="text-xs text-red-500 mt-1">
                          {form.formState.errors.cost_markup_percent.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium">Цена за ед.</label>
                      <div className="h-8 px-3 py-1 bg-muted text-sm rounded-md flex items-center">
                        {unitSellingPrice.toFixed(2)}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium">Общая сумма</label>
                      <div className="h-8 px-3 py-1 bg-muted text-sm rounded-md flex items-center font-medium">
                        {totalSellingPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium">Срок поставки *</label>
                      <Input
                        {...form.register('delivery_time')}
                        className="h-8 text-sm"
                        placeholder="14-21 день"
                      />
                      {form.formState.errors.delivery_time && (
                        <p className="text-xs text-red-500 mt-1">
                          {form.formState.errors.delivery_time.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium">Примечания</label>
                      <Input
                        {...form.register('notes')}
                        className="h-8 text-sm"
                        placeholder="Дополнительная информация"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button type="submit" size="sm" className="h-7 text-xs">
                      <Save className="h-3 w-3 mr-1" />
                      Сохранить
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      className="h-7 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Отмена
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Список существующих предложений */}
          {proposals.length > 0 && (
            <div className="space-y-2">
              {proposals.map((proposal, index) => {
                const unitPrice = proposal.unit_cost_price + (proposal.unit_cost_price * proposal.cost_markup_percent) / 100
                const totalPrice = unitPrice * proposal.quantity
                
                return (
                  <Card key={proposal.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                            <span className="font-medium text-sm">{proposal.proposed_product_name}</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                            <div>
                              <span className="font-medium">Производитель:</span> {proposal.proposed_manufacturer}
                            </div>
                            <div>
                              <span className="font-medium">Артикул:</span> {proposal.proposed_part_number}
                            </div>
                            <div>
                              <span className="font-medium">Срок:</span> {proposal.delivery_time}
                            </div>
                            <div>
                              <span className="font-medium">Наценка:</span> {proposal.cost_markup_percent}%
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span>Цена: <strong>{unitPrice.toFixed(2)}</strong> за ед.</span>
                            <span>Сумма: <strong>{totalPrice.toFixed(2)}</strong></span>
                          </div>
                          {proposal.notes && (
                            <p className="text-xs text-muted-foreground italic">{proposal.notes}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveProposal(rfqItem.id, proposal.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
} 