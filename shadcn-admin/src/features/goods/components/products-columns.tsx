import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArrowUpDown, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { Product } from '@/lib/types'

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
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('name')}</div>
    ),
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
      const subgroup = row.original.subgroup
      return (
        <div className="flex flex-col space-y-1">
          <div className="font-medium">{subgroup.name}</div>
          <div className="text-sm text-muted-foreground">
            {subgroup.group.name}
          </div>
        </div>
      )
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.subgroup.name
      const b = rowB.original.subgroup.name
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
      const brand = row.original.brand
      return brand ? (
        <Badge variant="secondary">{brand.name}</Badge>
      ) : (
        <span className="text-muted-foreground">Не указан</span>
      )
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.brand?.name || ''
      const b = rowB.original.brand?.name || ''
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
      const manager = row.original.responsible_manager
      return manager ? (
        <div className="flex flex-col space-y-1">
          <div className="font-medium">
            {manager.first_name} {manager.last_name}
          </div>
          <div className="text-sm text-muted-foreground">{manager.email}</div>
        </div>
      ) : (
        <span className="text-muted-foreground">Не назначен</span>
      )
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.responsible_manager
        ? `${rowA.original.responsible_manager.first_name} ${rowA.original.responsible_manager.last_name}`
        : ''
      const b = rowB.original.responsible_manager
        ? `${rowB.original.responsible_manager.first_name} ${rowB.original.responsible_manager.last_name}`
        : ''
      return a.localeCompare(b)
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const product = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Открыть меню</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Действия</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(product.id.toString())}
            >
              Копировать ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => {
                // Будем обрабатывать через контекст
                window.dispatchEvent(new CustomEvent('edit-product', { detail: product }))
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                // Будем обрабатывать через контекст
                window.dispatchEvent(new CustomEvent('delete-product', { detail: product }))
              }}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 