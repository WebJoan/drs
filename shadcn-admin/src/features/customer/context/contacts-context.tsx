import { Contact } from '@/hooks/useContacts'
import { createContext, useContext, useEffect, useState } from 'react'

interface ContactsContextType {
  editingContact: Contact | null
  setEditingContact: (contact: Contact | null) => void
  isCreateDialogOpen: boolean
  setIsCreateDialogOpen: (open: boolean) => void
  isEditDialogOpen: boolean
  setIsEditDialogOpen: (open: boolean) => void
  isDeleteDialogOpen: boolean
  setIsDeleteDialogOpen: (open: boolean) => void
  contactToDelete: Contact | null
  setContactToDelete: (contact: Contact | null) => void
  isDeleteMultipleDialogOpen: boolean
  setIsDeleteMultipleDialogOpen: (open: boolean) => void
  contactsToDelete: Contact[]
  setContactsToDelete: (contacts: Contact[]) => void
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined)

export const useContactsContext = () => {
  const context = useContext(ContactsContext)
  if (!context) {
    throw new Error('useContactsContext must be used within a ContactsProvider')
  }
  return context
}

interface ContactsProviderProps {
  children: React.ReactNode
}

export default function ContactsProvider({ children }: ContactsProviderProps) {
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)
  const [isDeleteMultipleDialogOpen, setIsDeleteMultipleDialogOpen] = useState(false)
  const [contactsToDelete, setContactsToDelete] = useState<Contact[]>([])

  useEffect(() => {
    const handleEditContact = (event: CustomEvent) => {
      const contact = event.detail as Contact
      setEditingContact(contact)
      setIsEditDialogOpen(true)
    }

    const handleDeleteContact = (event: CustomEvent) => {
      const contact = event.detail as Contact
      setContactToDelete(contact)
      setIsDeleteDialogOpen(true)
    }

    const handleDeleteMultipleContacts = (event: CustomEvent) => {
      const contacts = event.detail as Contact[]
      setContactsToDelete(contacts)
      setIsDeleteMultipleDialogOpen(true)
    }

    document.addEventListener('edit-contact', handleEditContact as EventListener)
    document.addEventListener('delete-contact', handleDeleteContact as EventListener)
    document.addEventListener('delete-multiple-contacts', handleDeleteMultipleContacts as EventListener)

    return () => {
      document.removeEventListener('edit-contact', handleEditContact as EventListener)
      document.removeEventListener('delete-contact', handleDeleteContact as EventListener)
      document.removeEventListener('delete-multiple-contacts', handleDeleteMultipleContacts as EventListener)
    }
  }, [])

  const value: ContactsContextType = {
    editingContact,
    setEditingContact,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    contactToDelete,
    setContactToDelete,
    isDeleteMultipleDialogOpen,
    setIsDeleteMultipleDialogOpen,
    contactsToDelete,
    setContactsToDelete,
  }

  return (
    <ContactsContext.Provider value={value}>
      {children}
    </ContactsContext.Provider>
  )
} 