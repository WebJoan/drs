import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, Info, Package } from 'lucide-react'
import { Product } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 p-0 font-semibold"
        >
          Название
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const product = row.original as any
      // Поддержка подсветки для результатов поиска из MeiliSearch
      const name = product._formatted?.name || product.name
      
      return (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <div>
            <div 
              className="font-medium"
              dangerouslySetInnerHTML={{ __html: name }}
            />
            <div className="text-sm text-muted-foreground">
              ID: {product.id}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'brand',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 p-0 font-semibold"
        >
          Бренд
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const product = row.original as any
      // Поддержка обоих форматов: Django API (объекты) и MeiliSearch (строки)
      const brandName = product._formatted?.brand_name || product.brand_name || product.brand?.name
      
      return brandName ? (
        <Badge 
          variant="outline" 
          dangerouslySetInnerHTML={{ __html: brandName }}
        />
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
    sortingFn: (rowA, rowB) => {
      const a = (rowA.original as any).brand_name || rowA.original.brand?.name || ''
      const b = (rowB.original as any).brand_name || rowB.original.brand?.name || ''
      return a.localeCompare(b)
    },
  },
  {
    accessorKey: 'subgroup',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 p-0 font-semibold"
        >
          Подгруппа
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const product = row.original as any
      // Поддержка обоих форматов: Django API (объекты) и MeiliSearch (строки)
      const subgroupName = product._formatted?.subgroup_name || product.subgroup_name || product.subgroup?.name
      const groupName = product._formatted?.group_name || product.group_name || product.subgroup?.group?.name
      
      return (
        <div>
          <div 
            className="font-medium"
            dangerouslySetInnerHTML={{ __html: subgroupName || 'Не указана' }}
          />
          <div 
            className="text-sm text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: groupName || '' }}
          />
        </div>
      )
    },
    sortingFn: (rowA, rowB) => {
      const a = (rowA.original as any).subgroup_name || rowA.original.subgroup?.name || ''
      const b = (rowB.original as any).subgroup_name || rowB.original.subgroup?.name || ''
      return a.localeCompare(b)
    },
  },
  {
    accessorKey: 'product_manager',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 p-0 font-semibold"
        >
          Product менеджер
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const product = row.original as any
      // Поддержка обоих форматов: Django API (объекты) и MeiliSearch (строки)
      const manager = product.product_manager
      const managerName = product.product_manager_name || (manager ? `${manager.first_name} ${manager.last_name}` : '')
      
      return managerName ? (
        <div className="text-sm">
          {managerName}
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
    sortingFn: (rowA, rowB) => {
      const a = (rowA.original as any).product_manager_name || 
                (rowA.original.product_manager 
                  ? `${rowA.original.product_manager.first_name} ${rowA.original.product_manager.last_name}`
                  : '')
      const b = (rowB.original as any).product_manager_name || 
                (rowB.original.product_manager 
                  ? `${rowB.original.product_manager.first_name} ${rowB.original.product_manager.last_name}`
                  : '')
      return a.localeCompare(b)
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const product = row.original as any
      // Безопасное получение данных для диалога
      const productName = product._formatted?.name || product.name
      const subgroupName = product.subgroup_name || product.subgroup?.name || 'Не указана'
      const groupName = product.group_name || product.subgroup?.group?.name || 'Не указана'
      const brandName = product.brand_name || product.brand?.name || '—'
      const productManagerName = product.product_manager_name || 
        (product.product_manager ? `${product.product_manager.first_name} ${product.product_manager.last_name}` : '—')
      const responsibleManagerName = product.responsible_manager_name ||
        (product.responsible_manager ? `${product.responsible_manager.first_name} ${product.responsible_manager.last_name}` : '—')
      
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Info className="h-4 w-4 mr-2" />
              Подробнее
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{productName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Основная информация</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">ID:</span> {product.id}</div>
                    <div><span className="font-medium">Название:</span> {productName}</div>
                    <div><span className="font-medium">Ext ID:</span> {product.ext_id || '—'}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Категория</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Группа:</span> {groupName}</div>
                    <div><span className="font-medium">Подгруппа:</span> {subgroupName}</div>
                    <div><span className="font-medium">Бренд:</span> {brandName}</div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Ответственные</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Product менеджер:</span> {productManagerName}
                  </div>
                  <div>
                    <span className="font-medium">Ответственный менеджер:</span> {responsibleManagerName}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )
    },
  },
] 