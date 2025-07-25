import { useState, useEffect } from 'react'
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
import { Contact } from '@/hooks/useContacts'
import { useContactsContext } from '../context/contacts-context'
import { DataTablePagination as CommonPagination } from '@/components/ui/data-table-pagination'

interface ContactsTableProps {
  columns: ColumnDef<Contact>[]
  data: Contact[]
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

export function ContactsTable({ 
  columns, 
  data, 
  pagination,
  onSearchChange,
  searchValue,
  isSearching = false,
  hideSearch
}: ContactsTableProps) {
  const { setContactsToDelete, setIsDeleteMultipleDialogOpen } = useContactsContext()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

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

  const handleDeleteSelected = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const selectedContacts = selectedRows.map(row => row.original)
    setContactsToDelete(selectedContacts)
    setIsDeleteMultipleDialogOpen(true)
  }

  // Функция для получения читаемых названий колонок
  const getColumnDisplayName = (columnId: string): string => {
    const columnNames: Record<string, string> = {
      select: 'Выбор',
      contact: 'Контакт',
      company: 'Компания',
      contacts: 'Контактные данные',
      status: 'Статус',
      type: 'Тип',
      created_at: 'Добавлен',
      'quick-actions': 'Быстрые действия',
      actions: 'Действия',
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
              placeholder="Поиск контактов..."
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
        </div>
      </div>
      <div className='rounded-md border relative'>
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
                  className='h-24 text-center'
                >
                  Нет результатов.
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