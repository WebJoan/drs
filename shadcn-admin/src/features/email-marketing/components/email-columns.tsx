import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowUpDown, Mail, User, Building2, Paperclip, Calendar, Send, Eye } from 'lucide-react'
import { AiEmail, EMAIL_STATUS_LABELS, EmailStatus } from '../types'
import { EmailRowActions } from './email-row-actions'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import LongText from '@/components/long-text'

// Утилитарные функции
const getStatusVariant = (status: EmailStatus) => {
  switch (status) {
    case 'draft':
      return 'secondary'
    case 'sent':
      return 'default'
    case 'delivered':
      return 'default'
    case 'error':
      return 'destructive'
    case 'archived':
      return 'outline'
    default:
      return 'secondary'
  }
}

const getStatusColor = (status: EmailStatus) => {
  switch (status) {
    case 'draft':
      return 'text-gray-600'
    case 'sent':
      return 'text-blue-600'
    case 'delivered':
      return 'text-green-600'
    case 'error':
      return 'text-red-600'
    case 'archived':
      return 'text-gray-500'
    default:
      return 'text-gray-600'
  }
}

const getUserInitials = (firstName: string, lastName: string) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`
}

const getPersonInitials = (name: string | undefined | null) => {
  if (!name) {
    return '??'
  }
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`
  }
  return parts[0].charAt(0) + (parts[0].charAt(1) || '')
}

export const columns: ColumnDef<AiEmail>[] = [
  {
    accessorKey: 'subject',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 p-0 font-semibold"
        >
          Тема письма
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const email = row.original
      
      return (
        <div className="flex items-center gap-3 max-w-sm">
          <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">
              {email.subject}
            </div>
            <div className="text-sm text-muted-foreground">
              ID: {email.id}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 p-0 font-semibold"
        >
          Статус
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const status = row.getValue('status') as EmailStatus
      
      return (
        <Badge variant={getStatusVariant(status)} className={getStatusColor(status)}>
          {EMAIL_STATUS_LABELS[status]}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'recipient',
    header: 'Получатель',
    cell: ({ row }) => {
      const recipient = row.original.recipient
      
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getPersonInitials(recipient.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{recipient.name}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {recipient.email}
            </div>
            {recipient.company && (
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {recipient.company}
              </div>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'sales_manager',
    header: 'Менеджер',
    cell: ({ row }) => {
      const manager = row.original.sales_manager
      
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getUserInitials(manager.first_name, manager.last_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">
              {manager.first_name} {manager.last_name}
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {manager.email}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'body',
    header: 'Содержание',
    cell: ({ row }) => {
      const body = row.getValue('body') as string
      
      return (
        <div className="max-w-md">
          <LongText text={body} maxLength={100} />
        </div>
      )
    },
  },
  {
    accessorKey: 'attachments',
    header: 'Вложения',
    cell: ({ row }) => {
      const attachments = row.original.attachments
      
      if (!attachments || attachments.length === 0) {
        return <span className="text-muted-foreground">-</span>
      }
      
      return (
        <div className="flex items-center gap-1">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{attachments.length}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 p-0 font-semibold"
        >
          Создано
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at'))
      
      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm font-medium">
              {format(date, 'dd.MM.yyyy', { locale: ru })}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(date, 'HH:mm', { locale: ru })}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'updated_at',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 p-0 font-semibold"
        >
          Обновлено
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('updated_at'))
      
      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm font-medium">
              {format(date, 'dd.MM.yyyy', { locale: ru })}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(date, 'HH:mm', { locale: ru })}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    id: 'actions',
    header: 'Действия',
    cell: ({ row }) => {
      return <EmailRowActions email={row.original} />
    },
  },
]