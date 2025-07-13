import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { User } from '../data/schema'

type UsersDialogType = 'invite' | 'add' | 'edit' | 'delete'

interface UsersContextType {
  open: UsersDialogType | null
  setOpen: (str: UsersDialogType | null) => void
  currentRow: User | null
  setCurrentRow: React.Dispatch<React.SetStateAction<User | null>>
  selectedUsers: User[]
  setSelectedUsers: React.Dispatch<React.SetStateAction<User[]>>
  isMultipleSelection: boolean
}

const UsersContext = React.createContext<UsersContextType | null>(null)

interface Props {
  children: React.ReactNode
}

export default function UsersProvider({ children }: Props) {
  const [open, setOpen] = useDialogState<UsersDialogType>(null)
  const [currentRow, setCurrentRow] = useState<User | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])

  const isMultipleSelection = selectedUsers.length > 1

  const contextValue: UsersContextType = {
    open,
    setOpen,
    currentRow,
    setCurrentRow,
    selectedUsers,
    setSelectedUsers,
    isMultipleSelection,
  }

  return (
    <UsersContext.Provider value={contextValue}>
      {children}
    </UsersContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useUsersContext = () => {
  const usersContext = React.useContext(UsersContext)

  if (!usersContext) {
    throw new Error('useUsersContext has to be used within <UsersProvider>')
  }

  return usersContext
}
