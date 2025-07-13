'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDeleteUser, useDeleteUsers } from '@/hooks/useUsers'
import { User } from '../data/schema'
import { AlertTriangle } from 'lucide-react'

interface Props {
  currentRow?: User
  selectedUsers?: User[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersDeleteDialog({ currentRow, selectedUsers, open, onOpenChange }: Props) {
  const deleteUserMutation = useDeleteUser()
  const deleteUsersMutation = useDeleteUsers()
  const [isDeleting, setIsDeleting] = useState(false)

  const isMultipleDelete = selectedUsers && selectedUsers.length > 1
  const isSingleDelete = currentRow && !isMultipleDelete

  const handleDelete = async () => {
    if (isDeleting) return

    setIsDeleting(true)
    try {
      if (isMultipleDelete) {
        const userIds = selectedUsers.map(user => user.id)
        await deleteUsersMutation.mutateAsync(userIds)
      } else if (isSingleDelete) {
        await deleteUserMutation.mutateAsync(currentRow.id)
      }
      
      onOpenChange(false)
    } catch (error) {
      console.error('Ошибка при удалении пользователя(ей):', error)
      // Ошибка уже обработана в хуках и показана через toast
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOpenChange = (state: boolean) => {
    if (!isDeleting) {
      onOpenChange(state)
    }
  }

  const getUserName = (user: User) => {
    const fullName = `${user.first_name} ${user.last_name}`.trim()
    return fullName || user.email
  }

  const getDialogContent = () => {
    if (isMultipleDelete) {
      return {
        title: `Удалить ${selectedUsers.length} пользователей?`,
        description: `Вы уверены, что хотите удалить ${selectedUsers.length} пользователей? Это действие нельзя отменить.`,
        userInfo: selectedUsers.length <= 5 ? (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Пользователи для удаления:</p>
            <ul className="text-sm space-y-1">
              {selectedUsers.map((user) => (
                <li key={user.id} className="flex items-center space-x-2">
                  <span className="text-muted-foreground">•</span>
                  <span>{getUserName(user)}</span>
                  <span className="text-muted-foreground">({user.email})</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>{selectedUsers.length}</strong> пользователей будут удалены.
            </p>
          </div>
        )
      }
    } else if (isSingleDelete) {
      return {
        title: 'Удалить пользователя?',
        description: `Вы уверены, что хотите удалить пользователя "${getUserName(currentRow)}"? Это действие нельзя отменить.`,
        userInfo: (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-2">
              <div>
                <p className="text-sm font-medium">{getUserName(currentRow)}</p>
                <p className="text-sm text-muted-foreground">{currentRow.email}</p>
              </div>
            </div>
          </div>
        )
      }
    }
    
    return {
      title: 'Удалить пользователя?',
      description: 'Выберите пользователя для удаления.',
      userInfo: null
    }
  }

  const content = getDialogContent()

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle className="text-destructive">
              {content.title}
            </DialogTitle>
          </div>
          <DialogDescription>
            {content.description}
          </DialogDescription>
        </DialogHeader>
        
        {content.userInfo}
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
          >
            Отмена
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting || (!currentRow && !selectedUsers?.length)}
          >
            {isDeleting ? 'Удаление...' : 'Удалить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
