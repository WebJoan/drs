import * as React from 'react'
import { useState, useEffect, ReactNode } from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Table as TanStackTable,
} from '@tanstack/react-table'
import { ChevronDown, Search, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from '@/components/ui/data-table-pagination'

// Интерфейс для внешней пагинации
interface ExternalPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

// Интерфейс для поиска
interface SearchConfig {
  enabled: boolean
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  isSearching?: boolean
}

// Интерфейс для массовых действий
interface BulkActions<TData> {
  enabled: boolean
  getSelectedItems: (selectedRows: TData[]) => void
  actions?: {
    label: string
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    onClick: (selectedRows: TData[]) => void
  }[]
}

// Интерфейс для кастомного тулбара
interface ToolbarConfig<TData> {
  enabled: boolean
  renderToolbar?: (table: TanStackTable<TData>) => ReactNode
}

// Основной интерфейс пропсов
interface UniversalDataTableProps<TData, TValue> {
  // Основные данные
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  
  // Конфигурация функций
  enableRowSelection?: boolean
  enableSorting?: boolean
  enableColumnVisibility?: boolean
  enableFiltering?: boolean
  
  // Пагинация
  pagination?: {
    type: 'internal' | 'external'
    config?: ExternalPagination
    pageSizeOptions?: number[]
    showRowsSelected?: boolean
  }
  
  // Поиск
  search?: SearchConfig
  
  // Массовые действия  
  bulkActions?: BulkActions<TData>
  
  // Кастомный тулбар
  toolbar?: ToolbarConfig<TData>
  
  // Стили и классы
  className?: string
  containerClassName?: string
  
  // Сообщения
  emptyMessage?: string
  
  // Колбэки
  onRowSelectionChange?: (selectedRows: TData[]) => void
  onSortingChange?: (sorting: SortingState) => void
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void
}

export function UniversalDataTable<TData, TValue>({
  columns,
  data,
  enableRowSelection = true,
  enableSorting = true,
  enableColumnVisibility = true,
  enableFiltering = true,
  pagination = { type: 'internal' },
  search = { enabled: false },
  bulkActions = { enabled: false, getSelectedItems: () => {} },
  toolbar = { enabled: false },
  className,
  containerClassName,
  emptyMessage = 'Нет данных для отображения.',
  onRowSelectionChange,
  onSortingChange,
  onColumnFiltersChange,
}: UniversalDataTableProps<TData, TValue>) {
  // Состояния таблицы
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  // Конфигурация таблицы
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: pagination.type === 'internal' ? getPaginationRowModel() : undefined,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFacetedRowModel: enableFiltering ? getFacetedRowModel() : undefined,
    getFacetedUniqueValues: enableFiltering ? getFacetedUniqueValues() : undefined,
    manualPagination: pagination.type === 'external',
  })

  // Синхронизация выбранных строк
  useEffect(() => {
    if (enableRowSelection && (onRowSelectionChange || bulkActions.enabled)) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)
      onRowSelectionChange?.(selectedRows)
      bulkActions.getSelectedItems(selectedRows)
    }
  }, [rowSelection, table, onRowSelectionChange, bulkActions, enableRowSelection])

  // Синхронизация сортировки
  useEffect(() => {
    if (onSortingChange) {
      onSortingChange(sorting)
    }
  }, [sorting, onSortingChange])

  // Синхронизация фильтров
  useEffect(() => {
    if (onColumnFiltersChange) {
      onColumnFiltersChange(columnFilters)
    }
  }, [columnFilters, onColumnFiltersChange])

  // Рендер тулбара по умолчанию
  const renderDefaultToolbar = () => (
    <div className="flex items-center py-4">
      {/* Поиск */}
      {search.enabled && (
        <div className="relative flex-1 max-w-sm">
          {search.isSearching ? (
            <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          )}
          <Input
            placeholder={search.placeholder ?? 'Поиск...'}
            value={search.value ?? ''}
            onChange={(event) => search.onChange?.(event.target.value)}
            className="pl-10"
          />
        </div>
      )}

      <div className="flex items-center space-x-2 ml-auto">
        {/* Массовые действия */}
        {bulkActions.enabled && enableRowSelection && table.getFilteredSelectedRowModel().rows.length > 0 && (
          <>
            {bulkActions.actions?.map((action, index) => (
              <Button
                key={index}
                variant={action.variant ?? 'default'}
                size="sm"
                onClick={() => action.onClick(table.getFilteredSelectedRowModel().rows.map(row => row.original))}
                className="h-8"
              >
                {action.label} ({table.getFilteredSelectedRowModel().rows.length})
              </Button>
            )) ?? (
              <div className="text-sm text-muted-foreground">
                Выбрано: {table.getFilteredSelectedRowModel().rows.length}
              </div>
            )}
          </>
        )}

        {/* Видимость колонок */}
        {enableColumnVisibility && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8">
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
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )

  return (
    <div className={containerClassName ?? 'w-full space-y-4'}>
      {/* Тулбар */}
      {(toolbar.enabled || search.enabled || bulkActions.enabled || enableColumnVisibility) && (
        toolbar.renderToolbar ? toolbar.renderToolbar(table) : renderDefaultToolbar()
      )}

      {/* Таблица */}
      <div className="rounded-md border relative">
        {/* Индикатор загрузки поиска */}
        {search.enabled && search.isSearching && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary/20 rounded-t-md overflow-hidden">
            <div className="h-full bg-primary w-full animate-pulse transition-all duration-200"></div>
          </div>
        )}
        
        <Table className={className}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead 
                      key={header.id} 
                      colSpan={header.colSpan}
                      className={header.column.columnDef.meta?.className ?? ''}
                    >
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
          <TableBody 
            className={
              search.enabled && search.isSearching 
                ? 'opacity-60 transition-opacity duration-200' 
                : 'transition-opacity duration-200'
            }
          >
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={row.getIsSelected() ? 'bg-muted/50' : ''}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id}
                      className={cell.column.columnDef.meta?.className ?? ''}
                    >
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
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Пагинация */}
      {pagination && (
        <DataTablePagination
          table={table}
          pagination={pagination.config}
          customPagination={pagination.type === 'external'}
          pageSizeOptions={pagination.pageSizeOptions}
          showRowsSelected={pagination.showRowsSelected}
        />
      )}
    </div>
  )
}

// Экспорт типов для удобства использования
export type { 
  UniversalDataTableProps, 
  ExternalPagination, 
  SearchConfig, 
  BulkActions, 
  ToolbarConfig 
} 