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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useProductsContext } from '../context/products-context'
import { 
  useUpdateProduct, 
  useDeleteProduct, 
  useDeleteProducts,
  useBrands,
  useProductSubgroups
} from '@/hooks/useProducts'
import { useUsers } from '@/hooks/useUsers'
import { useEffect } from 'react'
import { ProductFormData } from '@/lib/types'
import { EnhancedProductForm } from './enhanced-product-form'

const productSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  subgroup_id: z.number().min(1, 'Подгруппа обязательна'),
  brand_id: z.number().optional(),
  product_manager_id: z.number().optional(),
  isEdit: z.boolean(),
})

export function ProductsDialogs() {
  const {
    editingProduct,
    setEditingProduct,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    productToDelete,
    setProductToDelete,
    isDeleteMultipleDialogOpen,
    setIsDeleteMultipleDialogOpen,
    productsToDelete,
    setProductsToDelete,
  } = useProductsContext()

  const updateProductMutation = useUpdateProduct()
  const deleteProductMutation = useDeleteProduct()
  const deleteProductsMutation = useDeleteProducts()

  const { data: brands } = useBrands()
  const { data: subgroups } = useProductSubgroups()
  const { data: users } = useUsers()

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
      subgroup_id: 0,
      brand_id: undefined,
      product_manager_id: undefined,
      isEdit: false,
    },
  })

  // Заполняем форму при редактировании
  useEffect(() => {
    if (editingProduct && isEditDialogOpen) {
      setValue('name', editingProduct.name)
      setValue('subgroup_id', editingProduct.subgroup_id)
      setValue('brand_id', editingProduct.brand_id)
      setValue('product_manager_id', editingProduct.product_manager_id)
      setValue('isEdit', true)
    } else {
      setValue('isEdit', false)
    }
  }, [editingProduct, isEditDialogOpen, setValue])

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (isEditDialogOpen && editingProduct) {
        await updateProductMutation.mutateAsync({
          productId: editingProduct.id,
          productData: {
            name: data.name,
            subgroup_id: data.subgroup_id,
            brand_id: data.brand_id || undefined,
            product_manager_id: data.product_manager_id || undefined,
          },
        })
        setIsEditDialogOpen(false)
        setEditingProduct(null)
      }
      reset()
    } catch (error) {
      console.error('Ошибка при сохранении товара:', error)
    }
  }

  const handleDelete = async () => {
    if (productToDelete) {
      try {
        await deleteProductMutation.mutateAsync(productToDelete.id)
        setIsDeleteDialogOpen(false)
        setProductToDelete(null)
      } catch (error) {
        console.error('Ошибка при удалении товара:', error)
      }
    }
  }

  const handleDeleteMultiple = async () => {
    if (productsToDelete.length > 0) {
      try {
        await deleteProductsMutation.mutateAsync(productsToDelete.map(p => p.id))
        setIsDeleteMultipleDialogOpen(false)
        setProductsToDelete([])
      } catch (error) {
        console.error('Ошибка при удалении товаров:', error)
      }
    }
  }

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false)
    setEditingProduct(null)
    reset()
  }

  return (
    <>
      {/* Улучшенная форма создания товара */}
      <EnhancedProductForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          // Дополнительная логика после успешного создания
        }}
      />

      {/* Диалог редактирования товара */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleCloseEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Редактировать товар</DialogTitle>
            <DialogDescription>
              Обновите информацию о товаре
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Название
                </Label>
                <div className="col-span-3">
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Введите название товара"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subgroup_id" className="text-right">
                  Подгруппа
                </Label>
                <div className="col-span-3">
                  <Select
                    value={watch('subgroup_id')?.toString() || ''}
                    onValueChange={(value) => setValue('subgroup_id', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите подгруппу" />
                    </SelectTrigger>
                    <SelectContent>
                      {subgroups?.map((subgroup) => (
                        <SelectItem key={subgroup.id} value={subgroup.id.toString()}>
                          {subgroup.name} ({subgroup.group.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.subgroup_id && (
                    <p className="text-sm text-red-500 mt-1">{errors.subgroup_id.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="brand_id" className="text-right">
                  Бренд
                </Label>
                <div className="col-span-3">
                  <Select
                    value={watch('brand_id')?.toString() || 'no_brand'}
                    onValueChange={(value) => setValue('brand_id', value === 'no_brand' ? undefined : parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите бренд (опционально)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_brand">Без бренда</SelectItem>
                      {brands?.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id.toString()}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="product_manager_id" className="text-right">
                  Менеджер
                </Label>
                <div className="col-span-3">
                  <Select
                    value={watch('product_manager_id')?.toString() || 'no_manager'}
                    onValueChange={(value) => setValue('product_manager_id', value === 'no_manager' ? undefined : parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите менеджера (опционально)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_manager">Без менеджера</SelectItem>
                      {users?.filter(user => user.role === 'product').map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.first_name} {user.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseEditDialog}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={updateProductMutation.isPending}
              >
                {updateProductMutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Диалог удаления одного товара */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить товар</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить товар "{productToDelete?.name}"?
              Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending ? 'Удаление...' : 'Удалить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог массового удаления товаров */}
      <Dialog open={isDeleteMultipleDialogOpen} onOpenChange={setIsDeleteMultipleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить товары</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить {productsToDelete.length} товаров?
              Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteMultipleDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMultiple}
              disabled={deleteProductsMutation.isPending}
            >
              {deleteProductsMutation.isPending ? 'Удаление...' : 'Удалить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 