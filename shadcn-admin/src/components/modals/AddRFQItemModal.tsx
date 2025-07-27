import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Plus, Search, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { useCreateRFQItem } from '@/hooks/useRFQ'
import { useProductSearch } from '@/hooks/useProductSearch'
import type { CreateRFQItemData, Product } from '@/lib/types'

// Схема валидации для формы добавления позиции
const addItemSchema = z.object({
  line_number: z.number().min(1, 'Номер строки должен быть больше 0'),
  product: z.number().optional(), // ID выбранного товара из базы
  product_name: z.string(),
  manufacturer: z.string(),
  part_number: z.string(),
  quantity: z.number().min(0.001, 'Количество должно быть больше 0'),
  unit: z.string().min(1, 'Единица измерения обязательна'),
  specifications: z.string(),
  comments: z.string(),
  is_new_product: z.boolean(),
}).refine((data) => {
  // Условная валидация в зависимости от режима
  if (data.is_new_product) {
    // Для нового товара обязательны название и производитель
    return data.product_name.trim().length > 0 && data.manufacturer.trim().length > 0
  } else {
    // Для существующего товара обязателен выбранный товар
    return data.product !== undefined
  }
}, {
  message: 'Заполните обязательные поля для выбранного режима',
  path: ['product_name'], // Привязываем ошибку к полю product_name
})

type AddItemFormData = z.infer<typeof addItemSchema>

interface AddRFQItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rfqId: number
  nextLineNumber: number
}

// Популярные единицы измерения
const commonUnits = [
  'шт',
  'кг',
  'г',
  'л',
  'мл',
  'м',
  'см',
  'мм',
  'м²',
  'м³',
  'упак',
  'комплект',
  'пара',
]

export function AddRFQItemModal({
  open,
  onOpenChange,
  rfqId,
  nextLineNumber,
}: AddRFQItemModalProps) {
  const createRFQItem = useCreateRFQItem()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const form = useForm<AddItemFormData>({
    resolver: zodResolver(addItemSchema),
    defaultValues: {
      line_number: nextLineNumber,
      product: undefined,
      product_name: '',
      manufacturer: '',
      part_number: '',
      quantity: 1,
      unit: 'шт',
      specifications: '',
      comments: '',
      is_new_product: false,
    },
  })

  // Отслеживаем изменение режима (новый товар / существующий)
  const isNewProduct = useWatch({
    control: form.control,
    name: 'is_new_product',
  })

  // Хук для поиска товаров
  const searchResults = useProductSearch(
    searchQuery, 
    !isNewProduct && open // Поиск активен только когда модальное окно открыто и режим "существующий товар"
  )

  // Обработчик выбора товара из поиска
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product)
    setSearchQuery('')
    setIsSearchOpen(false)
    
    // Заполняем форму данными выбранного товара
    form.setValue('product', product.id)
    form.setValue('product_name', product.name)
    form.setValue('manufacturer', product.brand?.name || '')
    form.setValue('part_number', '')
  }

  // Сброс формы при открытии модального окна
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      form.reset({
        line_number: nextLineNumber,
        product: undefined,
        product_name: '',
        manufacturer: '',
        part_number: '',
        quantity: 1,
        unit: 'шт',
        specifications: '',
        comments: '',
        is_new_product: false,
      })
      setSelectedProduct(null)
      setSearchQuery('')
    }
    onOpenChange(newOpen)
  }

  // Обработчик переключения режима (новый товар / существующий)
  const handleModeChange = (isNew: boolean) => {
    if (isNew) {
      // Переключаемся на режим нового товара - очищаем выбранный товар
      setSelectedProduct(null)
      setSearchQuery('')
      form.setValue('product', undefined)
      form.setValue('product_name', '')
      form.setValue('manufacturer', '')
      form.setValue('part_number', '')
    } else {
      // Переключаемся на режим существующего товара - очищаем ручные поля
      setSelectedProduct(null)
      setSearchQuery('')
      form.setValue('product', undefined)
      form.setValue('product_name', '')
      form.setValue('manufacturer', '')
      form.setValue('part_number', '')
    }
  }

  const onSubmit = async (data: AddItemFormData) => {
    setIsSubmitting(true)
    
    try {
      const itemData: CreateRFQItemData = {
        line_number: data.line_number,
        product: data.is_new_product ? undefined : data.product,
        product_name: data.product_name,
        manufacturer: data.manufacturer,
        part_number: data.part_number,
        quantity: data.quantity,
        unit: data.unit,
        specifications: data.specifications,
        comments: data.comments,
        is_new_product: data.is_new_product,
      }

      await createRFQItem.mutateAsync({ rfqId, itemData })
      onOpenChange(false)
    } catch (error) {
      console.error('Ошибка при добавлении позиции:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Добавить позицию в RFQ
          </DialogTitle>
          <DialogDescription>
            Заполните информацию о позиции для добавления в запрос предложений
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="line_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Номер строки *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        min={1}
                        step={1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Единица измерения *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите единицу" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {commonUnits.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Переключатель режима: новый товар / существующий */}
            <FormField
              control={form.control}
              name="is_new_product"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked)
                        handleModeChange(checked as boolean)
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Новый товар</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Отметьте, если это новый товар, который нужно добавить в каталог
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* Поиск существующего товара или ручной ввод нового */}
            {!isNewProduct ? (
              // Режим выбора существующего товара
              <FormField
                control={form.control}
                name="product"
                render={() => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Выберите товар из каталога *</FormLabel>
                    <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="justify-between"
                            onClick={() => setIsSearchOpen(true)}
                          >
                            {selectedProduct ? (
                              <div className="flex items-center gap-2">
                                <span className="truncate">{selectedProduct.name}</span>
                                {selectedProduct.brand && (
                                  <Badge variant="outline" className="shrink-0">
                                    {selectedProduct.brand.name}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Найти товар...</span>
                            )}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Введите название или артикул..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {searchQuery.trim().length === 0 
                                ? "Введите запрос для поиска" 
                                : "Товары не найдены"}
                            </CommandEmpty>
                            {searchResults?.data?.results && searchResults.data.results.length > 0 && (
                              <CommandGroup>
                                {searchResults.data.results.map((product) => (
                                  <CommandItem
                                    key={product.id}
                                    value={product.name}
                                    onSelect={() => handleProductSelect(product)}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <div className="flex flex-col">
                                        <span className="font-medium">{product.name}</span>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                          {product.brand && (
                                            <Badge variant="outline" className="h-5">
                                              {product.brand.name}
                                            </Badge>
                                          )}
                                          {product.subgroup && (
                                            <span>{product.subgroup.name}</span>
                                          )}
                                        </div>
                                      </div>
                                      {selectedProduct?.id === product.id && (
                                        <Check className="h-4 w-4" />
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              // Режим ввода нового товара
              <>
                <FormField
                  control={form.control}
                  name="product_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название товара *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Введите название товара" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Производитель/Бренд *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Введите производителя" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Артикул - показываем только для нового товара */}
            {isNewProduct && (
              <FormField
                control={form.control}
                name="part_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Артикул</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Введите артикул" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                      min={0.001}
                      step={0.001}
                      placeholder="Введите количество"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Технические характеристики</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Введите технические характеристики"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Комментарии</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Дополнительные комментарии"
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />



            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Добавление...' : 'Добавить позицию'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 