import { useState } from 'react'
import { MoreHorizontal, Eye, Edit, Send, Archive, Trash2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AiEmail } from '../types'
import { useDeleteAiEmail, useSendAiEmail, useUpdateAiEmail } from '../hooks/useEmailMarketing'
import { toast } from 'sonner'

interface EmailRowActionsProps {
  email: AiEmail
}

export function EmailRowActions({ email }: EmailRowActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  
  const deleteEmailMutation = useDeleteAiEmail()
  const sendEmailMutation = useSendAiEmail()
  const updateEmailMutation = useUpdateAiEmail()

  const handleView = () => {
    setShowViewDialog(true)
  }

  const handleEdit = () => {
    // TODO: Открыть диалог редактирования
    toast.info('Функция редактирования будет добавлена')
  }

  const handleSend = () => {
    if (email.status !== 'draft') {
      toast.error('Можно отправить только черновики')
      return
    }
    
    sendEmailMutation.mutate(email.id)
  }

  const handleArchive = () => {
    updateEmailMutation.mutate({
      id: email.id,
      data: { status: 'archived' }
    })
  }

  const handleCopy = () => {
    // TODO: Создать копию письма
    toast.info('Функция копирования будет добавлена')
  }

  const handleDelete = () => {
    deleteEmailMutation.mutate(email.id, {
      onSuccess: () => {
        setShowDeleteDialog(false)
      }
    })
  }

  const canSend = email.status === 'draft'
  const canArchive = email.status !== 'archived'
  const isDeleting = deleteEmailMutation.isPending
  const isSending = sendEmailMutation.isPending
  const isArchiving = updateEmailMutation.isPending

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Открыть меню</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuLabel>Действия</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleView}>
            <Eye className="mr-2 h-4 w-4" />
            Просмотр
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Редактировать
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Копировать
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {canSend && (
            <DropdownMenuItem 
              onClick={handleSend}
              disabled={isSending}
            >
              <Send className="mr-2 h-4 w-4" />
              {isSending ? 'Отправка...' : 'Отправить'}
            </DropdownMenuItem>
          )}
          {canArchive && (
            <DropdownMenuItem 
              onClick={handleArchive}
              disabled={isArchiving}
            >
              <Archive className="mr-2 h-4 w-4" />
              {isArchiving ? 'Архивация...' : 'В архив'}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
            className="text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? 'Удаление...' : 'Удалить'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Диалог просмотра письма */}
      <AlertDialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>{email.subject}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>От:</strong> {email.sales_manager.first_name} {email.sales_manager.last_name} ({email.sales_manager.email})
                  </div>
                  <div>
                    <strong>Кому:</strong> {email.recipient.name} ({email.recipient.email})
                  </div>
                  <div>
                    <strong>Статус:</strong> {email.status}
                  </div>
                  <div>
                    <strong>Создано:</strong> {new Date(email.created_at).toLocaleString('ru-RU')}
                  </div>
                </div>
                <div>
                  <strong>Содержание:</strong>
                  <div className="mt-2 p-4 bg-muted rounded-md whitespace-pre-wrap">
                    {email.body}
                  </div>
                </div>
                {email.attachments && email.attachments.length > 0 && (
                  <div>
                    <strong>Вложения:</strong>
                    <ul className="mt-2 space-y-1">
                      {email.attachments.map((attachment) => (
                        <li key={attachment.id} className="text-sm">
                          📎 {attachment.name || attachment.file}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Закрыть</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить письмо?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы действительно хотите удалить письмо "{email.subject}"? 
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}