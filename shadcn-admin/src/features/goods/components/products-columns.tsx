import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowUpDown } from 'lucide-react'
import { Product } from '@/lib/types'
import { ProductActions } from './product-actions'

export const columns: ColumnDef<Product>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Выбрать все"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Выбрать строку"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
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
        <div 
          className="font-medium"
          dangerouslySetInnerHTML={{ __html: name }}
        />
      )
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
        <div className="flex flex-col space-y-1">
          <div 
            className="font-medium"
            dangerouslySetInnerHTML={{ __html: subgroupName }}
          />
          <div 
            className="text-sm text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: groupName }}
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
          variant="secondary" 
          dangerouslySetInnerHTML={{ __html: brandName }}
        />
      ) : (
        <span className="text-muted-foreground">Не указан</span>
      )
    },
    sortingFn: (rowA, rowB) => {
      const a = (rowA.original as any).brand_name || rowA.original.brand?.name || ''
      const b = (rowB.original as any).brand_name || rowB.original.brand?.name || ''
      return a.localeCompare(b)
    },
  },
  {
    accessorKey: 'responsible_manager',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 p-0 font-semibold"
        >
          Ответственный менеджер
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const product = row.original as any
      // Поддержка обоих форматов: Django API (объекты) и MeiliSearch (строки)
      const manager = product.responsible_manager
      const managerName = product.product_manager_name || (manager ? `${manager.first_name} ${manager.last_name}` : '')
      
      return managerName ? (
        <div className="flex flex-col space-y-1">
          <div className="font-medium">
            {managerName}
          </div>
          {manager?.email && (
            <div className="text-sm text-muted-foreground">{manager.email}</div>
          )}
        </div>
      ) : (
        <span className="text-muted-foreground">Не назначен</span>
      )
    },
    sortingFn: (rowA, rowB) => {
      const a = (rowA.original as any).product_manager_name || 
                (rowA.original.responsible_manager 
                  ? `${rowA.original.responsible_manager.first_name} ${rowA.original.responsible_manager.last_name}`
                  : '')
      const b = (rowB.original as any).product_manager_name || 
                (rowB.original.responsible_manager 
                  ? `${rowB.original.responsible_manager.first_name} ${rowB.original.responsible_manager.last_name}`
                  : '')
      return a.localeCompare(b)
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const product = row.original
      return <ProductActions product={product} />
    },
  },
] 