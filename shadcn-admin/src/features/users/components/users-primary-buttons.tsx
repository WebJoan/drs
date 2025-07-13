import { Button } from '@/components/ui/button'
import { PlusCircle, UserPlus, Trash2 } from 'lucide-react'
import { useUsersContext } from '../context/users-context'

export function UsersPrimaryButtons() {
  const { setOpen, selectedUsers, setSelectedUsers, setCurrentRow } = useUsersContext()

  const handleAddUser = () => {
    setCurrentRow(null)
    setOpen('add')
  }

  const handleInviteUser = () => {
    setCurrentRow(null)
    setOpen('invite')
  }

  const handleDeleteSelected = () => {
    if (selectedUsers.length === 0) return
    
    if (selectedUsers.length === 1) {
      setCurrentRow(selectedUsers[0])
    }
    setOpen('delete')
  }

  const hasSelectedUsers = selectedUsers.length > 0

  return (
    <div className='flex flex-wrap items-center gap-2 sm:gap-2'>
      {hasSelectedUsers && (
        <Button
          variant='destructive'
          size='sm'
          onClick={handleDeleteSelected}
          className='h-8 text-xs sm:text-sm'
        >
          <Trash2 className='mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4' />
          <span className='hidden sm:inline'>Удалить выбранных</span>
          <span className='sm:hidden'>Удалить</span>
          <span className='ml-1'>({selectedUsers.length})</span>
        </Button>
      )}
      
      <Button
        variant='outline'
        size='sm'
        onClick={handleInviteUser}
        className='h-8 text-xs sm:text-sm'
      >
        <UserPlus className='mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4' />
        <span className='hidden sm:inline'>Пригласить</span>
        <span className='sm:hidden'>Пригл.</span>
      </Button>
      
      <Button
        variant='default'
        size='sm'
        onClick={handleAddUser}
        className='h-8 text-xs sm:text-sm'
      >
        <PlusCircle className='mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4' />
        <span className='hidden sm:inline'>Добавить пользователя</span>
        <span className='sm:hidden'>Добавить</span>
      </Button>
    </div>
  )
}
