import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2, Phone, Mail } from 'lucide-react'
import { Contact } from '@/hooks/useContacts'
import { useContactsContext } from '../context/contacts-context'

interface ContactRowActionsProps {
  contact: Contact
}

export function ContactRowActions({ contact }: ContactRowActionsProps) {
  const { setEditingContact, setIsEditDialogOpen, setContactToDelete, setIsDeleteDialogOpen } = useContactsContext()

  const handleEdit = () => {
    setEditingContact(contact)
    setIsEditDialogOpen(true)
  }

  const handleDelete = () => {
    setContactToDelete(contact)
    setIsDeleteDialogOpen(true)
  }

  const handleCall = () => {
    if (contact.phone) {
      window.open(`tel:${contact.phone}`)
    }
  }

  const handleEmail = () => {
    if (contact.email) {
      window.open(`mailto:${contact.email}`)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Открыть меню</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Действия</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(contact.id.toString())}
        >
          Копировать ID
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {contact.phone && (
          <DropdownMenuItem onClick={handleCall}>
            <Phone className="mr-2 h-4 w-4" />
            Позвонить
          </DropdownMenuItem>
        )}
        
        {contact.email && (
          <DropdownMenuItem onClick={handleEmail}>
            <Mail className="mr-2 h-4 w-4" />
            Написать email
          </DropdownMenuItem>
        )}
        
        {(contact.phone || contact.email) && <DropdownMenuSeparator />}
        
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Редактировать
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Удалить
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 