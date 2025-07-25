import { Table } from '@tanstack/react-table'
import { DataTablePagination as CommonDataTablePagination } from '@/components/ui/data-table-pagination'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <CommonDataTablePagination 
      table={table} 
      customPagination={false}
      pageSizeOptions={[10, 20, 30, 40, 50]}
      showRowsSelected={true}
    />
  )
}
