import { useUsersContext } from '../context/users-context'
import { UsersActionDialog } from './users-action-dialog'
import { UsersDeleteDialog } from './users-delete-dialog'
import { UsersInviteDialog } from './users-invite-dialog'

export function UsersDialogs() {
  const { 
    open, 
    setOpen, 
    currentRow, 
    setCurrentRow,
    selectedUsers,
    setSelectedUsers,
    isMultipleSelection 
  } = useUsersContext()

  const handleCloseDialog = () => {
    setOpen(null)
    setCurrentRow(null)
    // Не очищаем selectedUsers здесь, так как они могут быть нужны для других операций
  }

  const handleCloseDeleteDialog = () => {
    setOpen(null)
    setCurrentRow(null)
    setSelectedUsers([]) // Очищаем выбранных пользователей после удаления
  }

  return (
    <>
      <UsersActionDialog
        key={`action-${currentRow?.id || 'new'}`}
        currentRow={currentRow || undefined}
        open={open === 'add' || open === 'edit'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleCloseDialog()
          }
        }}
      />

      <UsersDeleteDialog
        key={`delete-${currentRow?.id || selectedUsers.map(u => u.id).join('-')}`}
        currentRow={currentRow || undefined}
        selectedUsers={isMultipleSelection ? selectedUsers : undefined}
        open={open === 'delete'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleCloseDeleteDialog()
          }
        }}
      />

      <UsersInviteDialog
        key="invite"
        open={open === 'invite'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleCloseDialog()
          }
        }}
      />
    </>
  )
}
