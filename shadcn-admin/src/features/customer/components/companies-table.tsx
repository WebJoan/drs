import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, Building2, Users, Phone, Mail } from 'lucide-react'
import type { Company } from '../types'

interface CompaniesTableProps {
  companies: Company[]
  isLoading?: boolean
}

export const columns: ColumnDef<Company>[] = [
  {
    accessorKey: 'name',
    header: 'Название компании',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">{row.getValue('name')}</div>
          {row.original.short_name && (
            <div className="text-sm text-muted-foreground">
              {row.original.short_name}
            </div>
          )}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'company_type',
    header: 'Тип',
    cell: ({ row }) => {
      const type = row.getValue('company_type') as string
      const typeLabels = {
        manufacturer: 'Производитель',
        distributor: 'Дистрибьютор',
        integrator: 'Интегратор',
        end_user: 'Конечный пользователь',
        other: 'Другое'
      }
      return (
        <Badge variant="outline">
          {typeLabels[type as keyof typeof typeLabels] || type}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Статус',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const statusLabels = {
        active: 'Активный',
        potential: 'Потенциальный',
        inactive: 'Неактивный',
        blacklist: 'Черный список'
      }
      const statusColors = {
        active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        potential: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        blacklist: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      }
      return (
        <Badge className={statusColors[status as keyof typeof statusColors]}>
          {statusLabels[status as keyof typeof statusLabels] || status}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'industry',
    header: 'Отрасль',
    cell: ({ row }) => {
      const industry = row.getValue('industry') as string
      return industry ? (
        <span className="text-sm">{industry}</span>
      ) : (
        <span className="text-sm text-muted-foreground">-</span>
      )
    },
  },
  {
    accessorKey: 'sales_manager_name',
    header: 'Менеджер',
    cell: ({ row }) => {
      const manager = row.getValue('sales_manager_name') as string
      return manager ? (
        <span className="text-sm">{manager}</span>
      ) : (
        <span className="text-sm text-muted-foreground">Не назначен</span>
      )
    },
  },
  {
    accessorKey: 'employees_count_actual',
    header: 'Контакты',
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{row.getValue('employees_count_actual') || 0}</span>
      </div>
    ),
  },
  {
    accessorKey: 'phone',
    header: 'Контакты',
    cell: ({ row }) => (
      <div className="space-y-1">
        {row.original.phone && (
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs">{row.original.phone}</span>
          </div>
        )}
        {row.original.email && (
          <div className="flex items-center gap-1">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs">{row.original.email}</span>
          </div>
        )}
      </div>
    ),
  },
]

export function CompaniesTable({ companies, isLoading }: CompaniesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data: companies,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Поиск компаний..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Колонки <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {isLoading ? 'Загрузка...' : 'Нет данных.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} из{' '}
          {table.getFilteredRowModel().rows.length} строк выбрано.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Назад
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Вперед
          </Button>
        </div>
      </div>
    </div>
  )
} 