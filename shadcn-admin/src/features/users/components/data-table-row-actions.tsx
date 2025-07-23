import { Row } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Edit, MoreHorizontal, Trash2, UserCheck } from 'lucide-react'
import { useUsersContext } from '../context/users-context'
import { User } from '../data/schema'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const { setOpen, setCurrentRow } = useUsersContext()
  const user = row.original as User

  const handleEdit = () => {
    setCurrentRow(user)
    setOpen('edit')
  }

  const handleDelete = () => {
    setCurrentRow(user)
    setOpen('delete')
  }

  const handleViewDetails = () => {
    // Пока что просто логируем, можно добавить модальное окно с деталями
    console.log('Просмотр деталей пользователя:', user)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
        >
          <MoreHorizontal className='h-4 w-4' />
          <span className='sr-only'>Открыть меню</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[160px]'>
        <DropdownMenuItem onClick={handleViewDetails}>
          <UserCheck className='mr-2 h-4 w-4' />
          Детали
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className='mr-2 h-4 w-4' />
          Редактировать
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleDelete}
          className='text-destructive focus:text-destructive'
        >
          <Trash2 className='mr-2 h-4 w-4' />
          Удалить
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
