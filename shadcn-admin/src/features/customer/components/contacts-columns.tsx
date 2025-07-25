import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Building2, Mail, Phone, Star } from 'lucide-react'
import { Contact } from '@/hooks/useContacts'
import LongText from '@/components/long-text'
import { ContactRowActions } from './contact-row-actions'

// Утилитарные функции
const getContactDisplayName = (contact: Contact) => {
  if (contact.full_name) {
    return contact.full_name
  }
  if (contact.first_name && contact.last_name) {
    return `${contact.first_name} ${contact.last_name}`
  }
  if (contact.first_name) {
    return contact.first_name
  }
  if (contact.last_name) {
    return contact.last_name
  }
  return contact.email || 'Неизвестно'
}

const getContactInitials = (contact: Contact) => {
  if (contact.first_name && contact.last_name) {
    return `${contact.first_name.charAt(0)}${contact.last_name.charAt(0)}`
  }
  if (contact.full_name) {
    const parts = contact.full_name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`
    }
    return parts[0].charAt(0) + (parts[0].charAt(1) || '')
  }
  if (contact.first_name) {
    return contact.first_name.charAt(0) + (contact.first_name.charAt(1) || '')
  }
  if (contact.last_name) {
    return contact.last_name.charAt(0) + (contact.last_name.charAt(1) || '')
  }
  return contact.email?.charAt(0)?.toUpperCase() || '?'
}

const getCompanyName = (contact: Contact) => {
  return contact.company_name || contact.company?.name || 'Неизвестная компания'
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'inactive':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    case 'suspended':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'active':
      return 'Активный'
    case 'inactive':
      return 'Неактивный'
    case 'suspended':
      return 'Приостановлен'
    default:
      return status
  }
}

export const contactsColumns: ColumnDef<Contact>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Выбрать все"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Выбрать строку"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'contact',
    header: 'Контакт',
    cell: ({ row }) => {
      const contact = row.original
      const displayName = getContactDisplayName(contact)
      const initials = getContactInitials(contact)
      
      return (
        <div className='flex items-center space-x-3 min-w-[200px]'>
          <Avatar className='h-9 w-9 flex-shrink-0'>
            <AvatarImage 
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`} 
              alt={displayName}
            />
            <AvatarFallback className='text-xs font-medium'>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-2'>
              <span className='font-medium text-sm truncate'>{displayName}</span>
              {contact.is_primary_contact && (
                <Star className='h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0' />
              )}
            </div>
            {contact.position && (
              <div className='text-xs text-muted-foreground truncate'>
                {contact.position}
              </div>
            )}
          </div>
        </div>
      )
    },
    enableHiding: false,
  },
  {
    id: 'company',
    header: 'Компания',
    cell: ({ row }) => {
      const contact = row.original
      const companyName = getCompanyName(contact)
      
      return (
        <div className='flex items-center space-x-2 min-w-[150px]'>
          <Building2 className='h-4 w-4 text-muted-foreground flex-shrink-0' />
          <span className='text-sm truncate'>{companyName}</span>
        </div>
      )
    },
  },
  {
    id: 'contacts',
    header: 'Контактные данные',
    cell: ({ row }) => {
      const contact = row.original
      
      return (
        <div className='space-y-1 min-w-[180px] max-w-[200px]'>
          {contact.email && (
            <div className='flex items-center space-x-2'>
              <Mail className='h-3 w-3 text-muted-foreground flex-shrink-0' />
              <a 
                href={`mailto:${contact.email}`}
                className='text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline truncate'
                onClick={(e) => e.stopPropagation()}
                title={contact.email}
              >
                {contact.email}
              </a>
            </div>
          )}
          {contact.phone && (
            <div className='flex items-center space-x-2'>
              <Phone className='h-3 w-3 text-muted-foreground flex-shrink-0' />
              <a 
                href={`tel:${contact.phone}`}
                className='text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline'
                onClick={(e) => e.stopPropagation()}
              >
                {contact.phone}
              </a>
            </div>
          )}
          {!contact.email && !contact.phone && (
            <span className="text-xs text-muted-foreground">Нет данных</span>
          )}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    header: 'Статус',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      
      return (
        <Badge 
          className={`${getStatusColor(status)} text-xs whitespace-nowrap`}
        >
          {getStatusText(status)}
        </Badge>
      )
    },
    enableSorting: false,
  },
  {
    id: 'type',
    header: 'Тип',
    cell: ({ row }) => {
      const contact = row.original
      
      return (
        <Badge 
          variant={contact.is_primary_contact ? 'default' : 'secondary'}
          className='text-xs whitespace-nowrap'
        >
          {contact.is_primary_contact ? 'Основной' : 'Обычный'}
        </Badge>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'created_at',
    header: 'Добавлен',
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at'))
      return (
        <div className='text-xs text-muted-foreground whitespace-nowrap'>
          {date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })}
        </div>
      )
    },
  },
  {
    id: 'quick-actions',
    header: 'Действия',
    cell: ({ row }) => {
      const contact = row.original
      
      return (
        <div className='flex items-center space-x-1'>
          {contact.phone && (
            <Button
              variant='ghost'
              size='sm'
              className='h-7 w-7 p-0'
              onClick={(e) => {
                e.stopPropagation()
                window.open(`tel:${contact.phone}`)
              }}
              title='Позвонить'
            >
              <Phone className='h-3 w-3' />
            </Button>
          )}
          {contact.email && (
            <Button
              variant='ghost'
              size='sm'
              className='h-7 w-7 p-0'
              onClick={(e) => {
                e.stopPropagation()
                window.open(`mailto:${contact.email}`)
              }}
              title='Написать email'
            >
              <Mail className='h-3 w-3' />
            </Button>
          )}
          <ContactRowActions contact={row.original} />
        </div>
      )
    },
    enableSorting: false,
    enableHiding: false,
  },
] 