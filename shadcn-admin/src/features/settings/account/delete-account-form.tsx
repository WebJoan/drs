import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useDeleteAccount } from '@/hooks/useProfile'

export function DeleteAccountForm() {
  const [isOpen, setIsOpen] = useState(false)
  const { mutate: deleteAccount, isPending } = useDeleteAccount()

  const handleDelete = () => {
    deleteAccount()
    setIsOpen(false)
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Удаление аккаунта</h3>
        <p className='text-sm text-muted-foreground'>
          Безвозвратно удалить ваш аккаунт и все связанные данные.
        </p>
      </div>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant='destructive'>
            Удалить аккаунт
          </Button>
        </DialogTrigger>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Удаление аккаунта</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить свой аккаунт? Это действие необратимо.
              Все ваши данные будут безвозвратно удалены.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Отмена
            </Button>
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? 'Удаление...' : 'Удалить аккаунт'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 