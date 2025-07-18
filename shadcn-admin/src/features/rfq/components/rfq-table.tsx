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
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronDown, 
  FileText, 
  Building2, 
  Calendar, 
  MoreHorizontal,
  Eye,
  Edit,
  Send,
  MessageSquare
} from 'lucide-react'
import type { RFQ } from '../types'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

interface RFQTableProps {
  rfqs: RFQ[]
  isLoading?: boolean
  onViewRFQ?: (rfq: RFQ) => void
  onEditRFQ?: (rfq: RFQ) => void
  onSubmitRFQ?: (rfq: RFQ) => void
  onCreateQuotation?: (rfq: RFQ) => void
}

export const columns: ColumnDef<RFQ>[] = [
  {
    accessorKey: 'number',
    header: 'Номер RFQ',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">{row.getValue('number')}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.title}
          </div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'company_name',
    header: 'Компания',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">{row.getValue('company_name')}</div>
          {row.original.contact_person_name && (
            <div className="text-sm text-muted-foreground">
              {row.original.contact_person_name}
            </div>
          )}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Статус',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const statusLabels = {
        draft: 'Черновик',
        submitted: 'Отправлен',
        in_progress: 'В работе',
        completed: 'Завершен',
        cancelled: 'Отменен'
      }
      const statusColors = {
        draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      }
      return (
        <Badge className={statusColors[status as keyof typeof statusColors]}>
          {statusLabels[status as keyof typeof statusLabels] || status}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'priority',
    header: 'Приоритет',
    cell: ({ row }) => {
      const priority = row.getValue('priority') as string
      const priorityLabels = {
        low: 'Низкий',
        medium: 'Средний',
        high: 'Высокий',
        urgent: 'Срочный'
      }
      const priorityColors = {
        low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
        urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      }
      return (
        <Badge variant="outline" className={priorityColors[priority as keyof typeof priorityColors]}>
          {priorityLabels[priority as keyof typeof priorityLabels] || priority}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'items_count',
    header: 'Позиций',
    cell: ({ row }) => (
      <div className="text-center">
        <span className="text-sm font-medium">{row.getValue('items_count')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'quotations_count',
    header: 'Предложений',
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{row.getValue('quotations_count') || 0}</span>
      </div>
    ),
  },
  {
    accessorKey: 'deadline',
    header: 'Срок',
    cell: ({ row }) => {
      const deadline = row.getValue('deadline') as string
      if (!deadline) return <span className="text-sm text-muted-foreground">-</span>
      
      const deadlineDate = new Date(deadline)
      const isOverdue = deadlineDate < new Date()
      
      return (
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
            {formatDistanceToNow(deadlineDate, { addSuffix: true, locale: ru })}
          </span>
        </div>
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
        <span className="text-sm text-muted-foreground">-</span>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const rfq = row.original
      const { onViewRFQ, onEditRFQ, onSubmitRFQ, onCreateQuotation } = table.options.meta as any

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Открыть меню</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewRFQ?.(rfq)}>
              <Eye className="mr-2 h-4 w-4" />
              Просмотр
            </DropdownMenuItem>
            {rfq.status === 'draft' && (
              <DropdownMenuItem onClick={() => onEditRFQ?.(rfq)}>
                <Edit className="mr-2 h-4 w-4" />
                Редактировать
              </DropdownMenuItem>
            )}
            {rfq.status === 'draft' && (
              <DropdownMenuItem onClick={() => onSubmitRFQ?.(rfq)}>
                <Send className="mr-2 h-4 w-4" />
                Отправить
              </DropdownMenuItem>
            )}
            {['submitted', 'in_progress'].includes(rfq.status) && (
              <DropdownMenuItem onClick={() => onCreateQuotation?.(rfq)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Создать предложение
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function RFQTable({ 
  rfqs, 
  isLoading, 
  onViewRFQ,
  onEditRFQ,
  onSubmitRFQ,
  onCreateQuotation
}: RFQTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data: rfqs,
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
    meta: {
      onViewRFQ,
      onEditRFQ,
      onSubmitRFQ,
      onCreateQuotation
    }
  })

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Поиск RFQ..."
          value={(table.getColumn('number')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('number')?.setFilterValue(event.target.value)
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