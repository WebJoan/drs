import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Save, 
  Check, 
  X, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Package, 
  Edit3,
  Eye,
  Calculator,
  Zap,
  ArrowRight,
  Sparkles,
  Timer
} from 'lucide-react'
import { toast } from 'sonner'
import { type RFQItem, type CreateQuotationItemData, type Currency } from '@/lib/types'
import { usePermissions } from '@/contexts/RoleContext'
import { cn } from '@/lib/utils'

// Схема валидации для быстрого ввода цен
const quickPriceSchema = z.object({
  unit_cost_price: z.number().min(0, 'Цена не может быть отрицательной'),
  cost_markup_percent: z.number().min(0, 'Наценка не может быть отрицательной').max(1000, 'Наценка слишком большая'),
  delivery_time: z.string().min(1, 'Срок поставки обязателен'),
})

type QuickPriceFormData = z.infer<typeof quickPriceSchema>

interface QuotationProposal extends CreateQuotationItemData {
  id: string
  unit_selling_price?: number
  total_selling_price?: number
}

interface UltraRFQTableProps {
  rfqItems: RFQItem[]
  proposals: Record<number, QuotationProposal[]>
  currencies: Currency[]
  selectedCurrency?: Currency | null
  onCurrencyChange?: (currency: Currency | null) => void
  onAddProposal: (rfqItemId: number, proposal: CreateQuotationItemData) => void
  onUpdateProposal: (rfqItemId: number, proposalId: string, proposal: Partial<CreateQuotationItemData>) => void
  onRemoveProposal: (rfqItemId: number, proposalId: string) => void
  onCreateQuotation?: () => void
  isLoading?: boolean
}

interface EditingCell {
  itemId: number
  field: 'cost_price' | 'markup' | 'delivery_time'
  proposalIndex?: number
}

export function UltraRFQTable({
  rfqItems,
  proposals,
  currencies,
  selectedCurrency: externalSelectedCurrency,
  onCurrencyChange,
  onAddProposal,
  onUpdateProposal,
  onRemoveProposal,
  onCreateQuotation,
  isLoading = false
}: UltraRFQTableProps) {
  const { canCreateQuotations, canEditRFQ } = usePermissions()
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [editingValues, setEditingValues] = useState<Record<string, string>>({})
  const [pendingProposals, setPendingProposals] = useState<Record<number, Partial<CreateQuotationItemData>>>({})
  const [internalSelectedCurrency, setInternalSelectedCurrency] = useState<Currency | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Используем внешнюю валюту если передана, иначе внутреннюю
  const selectedCurrency = externalSelectedCurrency || internalSelectedCurrency

  // Устанавливаем валюту по умолчанию (RUB если есть)
  useEffect(() => {
    if (currencies.length > 0 && !selectedCurrency) {
      const rubCurrency = currencies.find(c => c.code === 'RUB') || currencies[0]
      const newCurrency = rubCurrency
      setInternalSelectedCurrency(newCurrency)
      onCurrencyChange?.(newCurrency)
    }
  }, [currencies, selectedCurrency, onCurrencyChange])

  // Обработка изменения валюты
  const handleCurrencyChange = (currency: Currency | null) => {
    setInternalSelectedCurrency(currency)
    onCurrencyChange?.(currency)
  }

  // Фокус на инпуте при начале редактирования
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingCell])

  // Быстрое добавление предложения
  const handleQuickAddProposal = (rfqItem: RFQItem) => {
    const pending = pendingProposals[rfqItem.id]
    if (!pending?.unit_cost_price || !pending?.delivery_time) {
      toast.error('Заполните цену и срок поставки')
      return
    }

    const markup = pending.cost_markup_percent || 20
    const proposal: CreateQuotationItemData = {
      rfq_item: rfqItem.id,
      proposed_product_name: rfqItem.product_name_display,
      proposed_manufacturer: rfqItem.manufacturer_display || 'Не указан',
      proposed_part_number: rfqItem.part_number_display || 'Не указан',
      quantity: rfqItem.quantity,
      unit_cost_price: pending.unit_cost_price,
      cost_markup_percent: markup,
      delivery_time: pending.delivery_time,
      notes: pending.notes || '',
    }

    onAddProposal(rfqItem.id, proposal)
    setPendingProposals(prev => {
      const { [rfqItem.id]: removed, ...rest } = prev
      return rest
    })
    toast.success('Предложение добавлено')
  }

  // Быстрые шаблоны
  const quickTemplates = [
    { name: '14 дней', delivery: '14 дней', markup: 20 },
    { name: '21 день', delivery: '21 день', markup: 25 },
    { name: '30 дней', delivery: '30 дней', markup: 30 },
    { name: 'Экспресс', delivery: '7 дней', markup: 50 },
  ]

  // Быстрое заполнение по шаблону
  const applyQuickTemplate = (rfqItem: RFQItem, template: typeof quickTemplates[0]) => {
    const pending = pendingProposals[rfqItem.id]
    updatePendingValue(rfqItem.id, 'delivery_time', template.delivery)
    updatePendingValue(rfqItem.id, 'cost_markup_percent', template.markup)
    
    // Если нет цены, предложить ввести
    if (!pending?.unit_cost_price) {
      toast.info(`Шаблон "${template.name}" применён. Теперь введите цену.`)
      // Автофокус на поле цены
      setTimeout(() => startEdit(rfqItem.id, 'cost_price', ''), 100)
    } else {
      toast.success(`Шаблон "${template.name}" применён`)
    }
  }

  // Обновление временных значений
  const updatePendingValue = (itemId: number, field: keyof CreateQuotationItemData, value: any) => {
    setPendingProposals(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }))
  }

  // Начало редактирования ячейки
  const startEdit = (itemId: number, field: EditingCell['field'], currentValue: any, proposalIndex?: number) => {
    setEditingCell({ itemId, field, proposalIndex })
    setEditingValues({ [`${itemId}-${field}-${proposalIndex || 'new'}`]: currentValue?.toString() || '' })
  }

  // Сохранение изменений
  const saveEdit = () => {
    if (!editingCell) return

    const key = `${editingCell.itemId}-${editingCell.field}-${editingCell.proposalIndex || 'new'}`
    const value = editingValues[key]

    if (editingCell.proposalIndex !== undefined) {
      // Обновление существующего предложения
      const proposalsList = proposals[editingCell.itemId] || []
      const proposal = proposalsList[editingCell.proposalIndex]
      if (proposal) {
        const updateData: Partial<CreateQuotationItemData> = {}
        
        if (editingCell.field === 'cost_price') {
          updateData.unit_cost_price = parseFloat(value) || 0
        } else if (editingCell.field === 'markup') {
          updateData.cost_markup_percent = parseFloat(value) || 20
        } else if (editingCell.field === 'delivery_time') {
          updateData.delivery_time = value
        }

        onUpdateProposal(editingCell.itemId, proposal.id, updateData)
      }
    } else {
      // Обновление временного предложения
      if (editingCell.field === 'cost_price') {
        updatePendingValue(editingCell.itemId, 'unit_cost_price', parseFloat(value) || 0)
      } else if (editingCell.field === 'markup') {
        updatePendingValue(editingCell.itemId, 'cost_markup_percent', parseFloat(value) || 20)
      } else if (editingCell.field === 'delivery_time') {
        updatePendingValue(editingCell.itemId, 'delivery_time', value)
      }
    }

    setEditingCell(null)
    setEditingValues({})
  }

  // Отмена редактирования
  const cancelEdit = () => {
    setEditingCell(null)
    setEditingValues({})
  }

  // Обработка нажатий клавиш
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      saveEdit()
      // TODO: Переход к следующей ячейке
    }
  }

  // Подсчет цен
  const calculatePrices = (costPrice: number, markup: number, quantity: number) => {
    const unitSellingPrice = costPrice + (costPrice * markup) / 100
    const totalSellingPrice = unitSellingPrice * quantity
    return { unitSellingPrice, totalSellingPrice }
  }

  // Получение символа валюты
  const getCurrencySymbol = () => {
    return selectedCurrency?.symbol || '₽'
  }

  // Получение значения для отображения
  const getCellValue = (itemId: number, field: EditingCell['field'], proposalIndex?: number) => {
    if (editingCell?.itemId === itemId && editingCell?.field === field && editingCell?.proposalIndex === proposalIndex) {
      return editingValues[`${itemId}-${field}-${proposalIndex || 'new'}`] || ''
    }

    if (proposalIndex !== undefined) {
      const proposalsList = proposals[itemId] || []
      const proposal = proposalsList[proposalIndex]
      if (proposal) {
        if (field === 'cost_price') return proposal.unit_cost_price
        if (field === 'markup') return proposal.cost_markup_percent
        if (field === 'delivery_time') return proposal.delivery_time
      }
    } else {
      const pending = pendingProposals[itemId]
      if (pending) {
        if (field === 'cost_price') return pending.unit_cost_price || ''
        if (field === 'markup') return pending.cost_markup_percent || 20
        if (field === 'delivery_time') return pending.delivery_time || ''
      }
    }

    return ''
  }

  // Компонент редактируемой ячейки
  const EditableCell = ({ 
    itemId, 
    field, 
    value, 
    proposalIndex, 
    type = 'text',
    placeholder = '',
    prefix = '',
    suffix = '',
    className = ''
  }: {
    itemId: number
    field: EditingCell['field']
    value: any
    proposalIndex?: number
    type?: string
    placeholder?: string
    prefix?: string
    suffix?: string
    className?: string
  }) => {
    const isEditing = editingCell?.itemId === itemId && 
                     editingCell?.field === field && 
                     editingCell?.proposalIndex === proposalIndex
    const displayValue = getCellValue(itemId, field, proposalIndex)

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          {prefix && <span className="text-xs text-muted-foreground">{prefix}</span>}
          <Input
            ref={inputRef}
            type={type}
            value={editingValues[`${itemId}-${field}-${proposalIndex || 'new'}`] || ''}
            onChange={(e) => setEditingValues(prev => ({
              ...prev,
              [`${itemId}-${field}-${proposalIndex || 'new'}`]: e.target.value
            }))}
            onKeyDown={handleKeyDown}
            onBlur={saveEdit}
            className="h-6 w-20 text-xs"
            placeholder={placeholder}
          />
          {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
        </div>
      )
    }

    return (
      <div 
        className={cn(
          "cursor-pointer hover:bg-muted/50 px-2 py-1 rounded text-xs transition-colors",
          className,
          !displayValue && "text-muted-foreground italic"
        )}
        onClick={() => startEdit(itemId, field, displayValue, proposalIndex)}
      >
        {prefix}{displayValue || placeholder}{suffix}
      </div>
    )
  }

  const totalProposalsCount = Object.values(proposals).reduce((sum, items) => sum + items.length, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Ультра-быстрое ценообразование
          </CardTitle>
          <div className="flex items-center gap-2">
            {canCreateQuotations() && currencies.length > 0 && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={selectedCurrency?.id.toString()}
                  onValueChange={(value) => {
                    const currency = currencies.find(c => c.id.toString() === value)
                    handleCurrencyChange(currency || null)
                  }}
                >
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue placeholder="Валюта" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.id} value={currency.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{currency.symbol}</span>
                          <span>{currency.code}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Badge variant="outline" className="flex items-center gap-1">
              <Calculator className="h-3 w-3" />
              {totalProposalsCount} предложений
            </Badge>
            {canCreateQuotations() && totalProposalsCount > 0 && (
              <Button onClick={onCreateQuotation} size="sm" className="h-7">
                <ArrowRight className="h-3 w-3 mr-1" />
                Отправить котировку
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead className="min-w-[200px]">Товар</TableHead>
                <TableHead className="w-20">Кол-во</TableHead>
                {canCreateQuotations() && (
                  <>
                    <TableHead className="w-24">Себестоимость</TableHead>
                    <TableHead className="w-20">Наценка %</TableHead>
                    <TableHead className="w-24">Цена за ед.</TableHead>
                    <TableHead className="w-24">Общая сумма</TableHead>
                    <TableHead className="w-28">Срок поставки</TableHead>
                    <TableHead className="w-16">Действия</TableHead>
                  </>
                )}
                {!canCreateQuotations() && (
                  <>
                    <TableHead className="w-24">Цена за ед.</TableHead>
                    <TableHead className="w-24">Общая сумма</TableHead>
                    <TableHead className="w-28">Срок поставки</TableHead>
                    <TableHead className="w-16">Статус</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rfqItems.map((item) => {
                const itemProposals = proposals[item.id] || []
                const pending = pendingProposals[item.id]
                const hasProposals = itemProposals.length > 0

                return (
                  <>
                    {/* Основная строка товара */}
                    <TableRow key={item.id} className={cn(
                      "group transition-colors",
                      hasProposals ? "bg-green-50 dark:bg-green-950/20" : "",
                      pending ? "bg-blue-50 dark:bg-blue-950/20" : ""
                    )}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {item.line_number}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{item.product_name_display}</div>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            {item.manufacturer_display !== '—' && (
                              <div>Производитель: {item.manufacturer_display}</div>
                            )}
                            {item.part_number_display !== '—' && (
                              <div>Артикул: {item.part_number_display}</div>
                            )}
                            {item.specifications && (
                              <div className="line-clamp-2">Спецификация: {item.specifications}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{item.quantity}</span>
                          <span className="text-xs text-muted-foreground">{item.unit}</span>
                        </div>
                      </TableCell>

                      {canCreateQuotations() ? (
                        <>
                          {/* Продукт менеджер - может редактировать цены */}
                          <TableCell>
                            <EditableCell
                              itemId={item.id}
                              field="cost_price"
                              value={pending?.unit_cost_price || ''}
                              type="number"
                              placeholder="0.00"
                              suffix={getCurrencySymbol()}
                              className="font-medium"
                            />
                          </TableCell>
                          <TableCell>
                            <EditableCell
                              itemId={item.id}
                              field="markup"
                              value={pending?.cost_markup_percent || 20}
                              type="number"
                              placeholder="20"
                              suffix="%"
                            />
                          </TableCell>
                          <TableCell>
                            {pending?.unit_cost_price ? (
                              <div className="text-sm font-medium text-green-600">
                                {calculatePrices(
                                  pending.unit_cost_price, 
                                  pending.cost_markup_percent || 20, 
                                  item.quantity
                                ).unitSellingPrice.toFixed(2)}{getCurrencySymbol()}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground italic">Не рассчитано</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {pending?.unit_cost_price ? (
                              <div className="text-sm font-bold text-green-600">
                                {calculatePrices(
                                  pending.unit_cost_price, 
                                  pending.cost_markup_percent || 20, 
                                  item.quantity
                                ).totalSellingPrice.toFixed(2)}{getCurrencySymbol()}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground italic">Не рассчитано</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <EditableCell
                                itemId={item.id}
                                field="delivery_time"
                                value={pending?.delivery_time || ''}
                                placeholder="14 дней"
                                className="w-full"
                              />
                              {!pending?.delivery_time && (
                                <div className="flex gap-1">
                                  {quickTemplates.map((template, idx) => (
                                    <Button
                                      key={idx}
                                      onClick={() => applyQuickTemplate(item, template)}
                                      variant="outline"
                                      size="sm"
                                      className="h-5 text-xs px-1"
                                      title={`${template.delivery}, наценка ${template.markup}%`}
                                    >
                                      <Timer className="h-2 w-2 mr-1" />
                                      {template.name}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {pending?.unit_cost_price && pending?.delivery_time ? (
                              <Button
                                onClick={() => handleQuickAddProposal(item)}
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Добавить предложение"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            ) : (
                              <div className="text-xs text-muted-foreground">
                                {!pending?.unit_cost_price ? 'Цена' : 'Срок'}
                              </div>
                            )}
                          </TableCell>
                        </>
                      ) : (
                        <>
                          {/* Сейл менеджер - видит только готовые предложения */}
                          <TableCell>
                            {hasProposals ? (
                              <div className="text-sm font-medium text-green-600">
                                {itemProposals[0] && calculatePrices(
                                  itemProposals[0].unit_cost_price,
                                  itemProposals[0].cost_markup_percent,
                                  item.quantity
                                ).unitSellingPrice.toFixed(2)}{getCurrencySymbol()}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground italic">Нет предложения</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {hasProposals ? (
                              <div className="text-sm font-bold text-green-600">
                                {itemProposals[0] && calculatePrices(
                                  itemProposals[0].unit_cost_price,
                                  itemProposals[0].cost_markup_percent,
                                  item.quantity
                                ).totalSellingPrice.toFixed(2)}{getCurrencySymbol()}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground italic">Нет предложения</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {hasProposals ? (
                              <div className="flex items-center gap-1 text-xs">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {itemProposals[0]?.delivery_time}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground italic">—</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {hasProposals ? (
                              <Badge variant="default" className="text-xs">
                                <Check className="h-3 w-3 mr-1" />
                                Готово
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Ожидание
                              </Badge>
                            )}
                          </TableCell>
                        </>
                      )}
                    </TableRow>

                    {/* Строки для существующих предложений (только для продукт менеджера) */}
                    {canCreateQuotations() && itemProposals.map((proposal, index) => (
                      <TableRow key={`${item.id}-proposal-${index}`} className="bg-green-100 dark:bg-green-950/30 border-l-4 border-l-green-500">
                        <TableCell>
                          <Badge variant="default" className="text-xs">
                            #{index + 1}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            📦 {proposal.proposed_product_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            {proposal.quantity} {item.unit}
                          </div>
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            itemId={item.id}
                            field="cost_price"
                            value={proposal.unit_cost_price}
                            proposalIndex={index}
                            type="number"
                            suffix={getCurrencySymbol()}
                            className="font-medium text-green-700"
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            itemId={item.id}
                            field="markup"
                            value={proposal.cost_markup_percent}
                            proposalIndex={index}
                            type="number"
                            suffix="%"
                            className="text-green-700"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-medium text-green-700">
                            {calculatePrices(
                              proposal.unit_cost_price,
                              proposal.cost_markup_percent,
                              proposal.quantity
                            ).unitSellingPrice.toFixed(2)}{getCurrencySymbol()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-bold text-green-700">
                            {calculatePrices(
                              proposal.unit_cost_price,
                              proposal.cost_markup_percent,
                              proposal.quantity
                            ).totalSellingPrice.toFixed(2)}{getCurrencySymbol()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            itemId={item.id}
                            field="delivery_time"
                            value={proposal.delivery_time}
                            proposalIndex={index}
                            className="text-green-700"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => onRemoveProposal(item.id, proposal.id)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            title="Удалить предложение"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {rfqItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Позиции не добавлены</p>
          </div>
        )}

        {/* Статистика и подсказки */}
        <div className="mt-4 space-y-3">
          {/* Итоговая статистика */}
          {totalProposalsCount > 0 && (
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Object.values(proposals).reduce((sum, items) => 
                        sum + items.reduce((itemSum, item) => 
                          itemSum + calculatePrices(item.unit_cost_price, item.cost_markup_percent, item.quantity).totalSellingPrice, 0
                        ), 0
                      ).toFixed(0)}{getCurrencySymbol()}
                    </div>
                    <div className="text-xs text-muted-foreground">Общая сумма</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{totalProposalsCount}</div>
                    <div className="text-xs text-muted-foreground">Предложений</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(totalProposalsCount / rfqItems.length * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Готовность</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {Object.values(proposals).reduce((sum, items) => 
                        sum + items.reduce((itemSum, item) => itemSum + item.cost_markup_percent, 0), 0
                      ) / Math.max(totalProposalsCount, 1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Средняя наценка</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {canCreateQuotations() && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-xs text-muted-foreground mb-2">
                💡 <strong>Быстрые команды:</strong>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div>• Клик по ячейке - редактирование</div>
                <div>• Enter - сохранить</div>
                <div>• Escape - отменить</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 