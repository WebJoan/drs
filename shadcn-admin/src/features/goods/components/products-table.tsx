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
import { ChevronDown, Search, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

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
import { Product } from '@/lib/types'
import { useProductsContext } from '../context/products-context'

interface ProductsTableProps {
  columns: ColumnDef<Product>[]
  data: Product[]
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
}

export function ProductsTable({ columns, data, pagination, onSearchChange, searchValue, isSearching, hideSearch }: ProductsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const { setProductsToDelete, setIsDeleteMultipleDialogOpen, setClearSelection } = useProductsContext()

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination: true, // Используем внешнюю пагинацию
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  // Регистрируем функцию сброса выбора в контексте
  useEffect(() => {
    const clearSelectionFn = () => {
      setRowSelection({})
    }
    setClearSelection(() => clearSelectionFn)
    
    return () => {
      setClearSelection(null)
    }
  }, [setClearSelection])

  const handleDeleteSelected = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const selectedProducts = selectedRows.map(row => row.original)
    setProductsToDelete(selectedProducts)
    setIsDeleteMultipleDialogOpen(true)
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
              placeholder="Поиск товаров..."
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
              onClick={handleDeleteSelected}
              className="h-8"
            >
              Удалить выбранные ({table.getFilteredSelectedRowModel().rows.length})
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto h-8">
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Нет результатов.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pagination && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} из{' '}
            {data.length} строк выбрано на странице. Всего: {pagination.total} товаров.
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Строк на странице</p>
              <select
                value={pagination.pageSize}
                onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
                className="h-8 w-[70px] rounded border border-input bg-background px-3 py-1 text-sm"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">
                Страница {pagination.page} из {pagination.totalPages}
              </p>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pagination.onPageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Предыдущая
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pagination.onPageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Следующая
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 