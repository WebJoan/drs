import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { 
  useCreateProduct, 
  useBrands,
  useProductSubgroups,
  useCreateBrand,
  useCreateProductSubgroup,
  useProductGroups
} from '@/hooks/useProducts'
import { useCurrentUser } from '@/hooks/useAuth'
import { SearchableSelect } from './SearchableSelect'
import { cn } from '@/lib/utils'
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'


const productSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  subgroup_id: z.number().optional(),
  brand_id: z.number().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

interface EnhancedProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EnhancedProductForm({ open, onOpenChange, onSuccess }: EnhancedProductFormProps) {
  const [isCreatingBrand, setIsCreatingBrand] = useState(false)
  const [isCreatingSubgroup, setIsCreatingSubgroup] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')
  const [newSubgroupName, setNewSubgroupName] = useState('')
  const [newSubgroupGroupId, setNewSubgroupGroupId] = useState<number | undefined>(undefined)

  const { data: currentUser } = useCurrentUser()
  const { data: brands } = useBrands()
  const { data: subgroups } = useProductSubgroups()
  const { data: groups } = useProductGroups()

  const createProductMutation = useCreateProduct()
  const createBrandMutation = useCreateBrand()
  const createSubgroupMutation = useCreateProductSubgroup()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      subgroup_id: undefined,
      brand_id: undefined,
    },
  })

  const watchedBrandId = watch('brand_id')
  const watchedSubgroupId = watch('subgroup_id')

  const handleCreateBrand = async (brandName: string) => {
    try {
      const newBrand = await createBrandMutation.mutateAsync({
        name: brandName,
        product_manager_id: currentUser?.id // Автоматически назначаем текущего пользователя
      })
      setValue('brand_id', newBrand.id)
      toast.success(`Бренд "${brandName}" создан`)
    } catch (error) {
      toast.error('Ошибка создания бренда')
    }
  }

  const handleCreateSubgroup = async () => {
    if (!newSubgroupName.trim() || !newSubgroupGroupId) {
      toast.error('Заполните все поля')
      return
    }

    try {
      const newSubgroup = await createSubgroupMutation.mutateAsync({
        name: newSubgroupName,
        group_id: newSubgroupGroupId,
        product_manager_id: currentUser?.id || 1 // Автоматически назначаем текущего пользователя
      })
      setValue('subgroup_id', newSubgroup.id)
      setIsCreatingSubgroup(false)
      setNewSubgroupName('')
      setNewSubgroupGroupId(undefined)
      toast.success(`Подгруппа "${newSubgroupName}" создана`)
    } catch (error) {
      toast.error('Ошибка создания подгруппы')
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    // Проверяем, что subgroup_id был выбран
    if (!data.subgroup_id || data.subgroup_id === 0) {
      toast.error('Необходимо выбрать подгруппу')
      return
    }

    try {
      await createProductMutation.mutateAsync({
        name: data.name,
        subgroup_id: data.subgroup_id,
        brand_id: data.brand_id,
        product_manager_id: currentUser?.id // Автоматически назначаем текущего пользователя
      })
      toast.success('Товар создан успешно')
      reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error('Ошибка при создании товара')
    }
  }

  const handleCloseDialog = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={handleCloseDialog}>
        <SheetContent className="w-full sm:w-[500px] sm:max-w-[540px] flex flex-col h-full" side="right">
          <SheetHeader className="space-y-3 pb-4 border-b">
            <SheetTitle>Создать новый товар</SheetTitle>
            <SheetDescription>
              Заполните форму для создания нового товара. Менеджер автоматически назначится на вас.
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
              <div className="flex-1 space-y-6 p-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Название товара *
                  </Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Введите название товара"
                    className={cn(errors.name && 'border-red-500')}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <SearchableSelect
                    label="Подгруппа"
                    items={subgroups || []}
                    value={watchedSubgroupId}
                    onValueChange={(value) => setValue('subgroup_id', value)}
                    placeholder="Выберите подгруппу"
                    searchPlaceholder="Поиск подгруппы..."
                    emptyText="Подгруппы не найдены"
                    required
                    error={errors.subgroup_id?.message}
                    renderItem={(item) => (
                      <div>
                        <span className="font-medium">{item.name}</span>
                        {item.group && (
                          <span className="text-sm text-muted-foreground ml-2">
                            ({item.group.name})
                          </span>
                        )}
                      </div>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreatingSubgroup(true)}
                    className="w-full"
                  >
                    Создать новую подгруппу
                  </Button>
                </div>

                <div className="space-y-2">
                  <SearchableSelect
                    label="Бренд"
                    items={brands || []}
                    value={watchedBrandId}
                    onValueChange={(value) => setValue('brand_id', value)}
                    placeholder="Выберите бренд (опционально)"
                    searchPlaceholder="Поиск бренда..."
                    emptyText="Бренды не найдены"
                    onCreateNew={handleCreateBrand}
                    createNewLabel="Создать новый бренд"
                  />
                </div>

                {currentUser && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Менеджер</Label>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">
                        Автоматически назначен: <strong>{currentUser.first_name} {currentUser.last_name}</strong>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <SheetFooter className="p-6 pt-4 border-t bg-background">
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    className="flex-1 sm:flex-none"
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    disabled={createProductMutation.isPending}
                    className="flex-1 sm:flex-none"
                  >
                    {createProductMutation.isPending ? 'Создание...' : 'Создать товар'}
                  </Button>
                </div>
              </SheetFooter>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      {/* Диалог создания новой подгруппы */}
      <Dialog open={isCreatingSubgroup} onOpenChange={setIsCreatingSubgroup}>
        <DialogContent className="sm:max-w-[425px] mx-4">
          <DialogHeader>
            <DialogTitle>Создать новую подгруппу</DialogTitle>
            <DialogDescription>
              Выберите группу и введите название подгруппы
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <SearchableSelect
                label="Группа"
                items={groups || []}
                value={newSubgroupGroupId}
                onValueChange={(value) => setNewSubgroupGroupId(value)}
                placeholder="Выберите группу"
                searchPlaceholder="Поиск группы..."
                emptyText="Группы не найдены"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subgroup-name" className="text-sm font-medium">
                Название подгруппы *
              </Label>
              <Input
                id="subgroup-name"
                value={newSubgroupName}
                onChange={(e) => setNewSubgroupName(e.target.value)}
                placeholder="Введите название подгруппы"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateSubgroup()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreatingSubgroup(false)}
              className="w-full sm:w-auto"
            >
              Отмена
            </Button>
            <Button
              type="button"
              onClick={handleCreateSubgroup}
              disabled={!newSubgroupName.trim() || typeof newSubgroupGroupId !== 'number' || createSubgroupMutation.isPending}
              className="w-full sm:w-auto"
            >
              {createSubgroupMutation.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 