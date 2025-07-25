import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Building2, Users, Phone, Mail, ChevronDown, Search, Loader2 } from 'lucide-react'
import { DataTablePagination as CommonPagination } from '@/components/ui/data-table-pagination'
import type { Company } from '../types'

interface CompaniesTableProps {
  companies: Company[]
  isLoading?: boolean
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    onPageChange: (page: number) => void
    onPageSizeChange: (pageSize: number) => void
  }
  onSearchChange?: (search: string) => void
  searchValue?: string
  isSearching?: boolean
  hideSearch?: boolean
  hideColumnsButton?: boolean
  onTableInstanceChange?: (table: any) => void
  columnVisibility?: any
  onColumnVisibilityChange?: (visibility: any) => void
}

export const columns: ColumnDef<Company>[] = [
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
    header: 'Название компании',
    cell: ({ row }) => (
      <div className="flex items-start gap-3 min-w-[200px]">
        <Building2 className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm leading-5 truncate">{row.getValue('name')}</div>
          {row.original.short_name && (
            <div className="text-xs text-muted-foreground truncate mt-1">
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
        <Badge variant="outline" className="text-xs whitespace-nowrap">
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
        <Badge className={`${statusColors[status as keyof typeof statusColors]} text-xs whitespace-nowrap`}>
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
        <span className="text-sm max-w-[120px] truncate block">{industry}</span>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      )
    },
  },
  {
    accessorKey: 'sales_manager_name',
    header: 'Менеджер',
    cell: ({ row }) => {
      const manager = row.getValue('sales_manager_name') as string
      return manager ? (
        <span className="text-sm max-w-[120px] truncate block">{manager}</span>
      ) : (
        <span className="text-sm text-muted-foreground">Не назначен</span>
      )
    },
  },
  {
    accessorKey: 'employees_count_actual',
    header: 'Сотрудники',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{row.getValue('employees_count_actual') || 0}</span>
      </div>
    ),
  },
  {
    accessorKey: 'contacts',
    header: 'Контакты',
    cell: ({ row }) => (
      <div className="space-y-1 min-w-[180px] max-w-[200px]">
        {row.original.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs truncate">{row.original.phone}</span>
          </div>
        )}
        {row.original.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs truncate" title={row.original.email}>{row.original.email}</span>
          </div>
        )}
        {!row.original.phone && !row.original.email && (
          <span className="text-xs text-muted-foreground">Нет данных</span>
        )}
      </div>
    ),
  },
]

export function CompaniesTable({ 
  companies, 
  isLoading,
  pagination,
  onSearchChange,
  searchValue,
  isSearching,
  hideSearch,
  hideColumnsButton = false,
  onTableInstanceChange,
  columnVisibility: externalColumnVisibility,
  onColumnVisibilityChange
}: CompaniesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(externalColumnVisibility || {})
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data: companies,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: onColumnVisibilityChange || setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination: true, // Используем внешнюю пагинацию
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  // Передаём экземпляр таблицы наверх
  useEffect(() => {
    if (onTableInstanceChange) {
      onTableInstanceChange(table)
    }
  }, [table, onTableInstanceChange])

  // Обновляем видимость колонок при изменении извне
  useEffect(() => {
    if (externalColumnVisibility) {
      setColumnVisibility(externalColumnVisibility)
    }
  }, [externalColumnVisibility])

  // Функция для получения читаемых названий колонок
  const getColumnDisplayName = (columnId: string): string => {
    const columnNames: Record<string, string> = {
      select: 'Выбор',
      name: 'Название',
      company_type: 'Тип компании',
      status: 'Статус',
      industry: 'Отрасль',
      sales_manager_name: 'Менеджер',
      employees_count_actual: 'Сотрудники',
      contacts: 'Контакты',
    }
    
    return columnNames[columnId] || columnId
  }

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        {!hideSearch && (
          <div className="relative flex-1 max-w-sm">
            {isSearching ? (
              <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            )}
            <Input
              placeholder="Поиск компаний..."
              value={searchValue ?? ''}
              onChange={(event) => onSearchChange?.(event.target.value)}
              className="pl-10"
            />
          </div>
        )}
        <div className="flex items-center space-x-2 ml-auto">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="h-8"
            >
              Удалить выбранные ({table.getFilteredSelectedRowModel().rows.length})
            </Button>
          )}
          {!hideColumnsButton && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
               <Button variant="outline" className="w-full sm:w-auto">
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
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {getColumnDisplayName(column.id)}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <div className="rounded-md border relative">
        {isSearching && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary/20 rounded-t-md overflow-hidden">
            <div className="h-full bg-primary w-full animate-pulse transition-all duration-200"></div>
          </div>
        )}
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
          <TableBody className={isSearching ? 'opacity-60 transition-opacity duration-200' : 'transition-opacity duration-200'}>
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
                  {isLoading ? 'Загрузка...' : 'Нет результатов.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pagination && (
        <CommonPagination 
          table={table} 
          pagination={pagination}
          customPagination={true}
          showRowsSelected={true}
        />
      )}
    </div>
  )
} 