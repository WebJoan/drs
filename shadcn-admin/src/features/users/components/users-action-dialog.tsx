'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { useCreateUser, useUpdateUser } from '@/hooks/useUsers'
import { userFormSchema, type UserForm } from '../data/schema'
import { User } from '../data/schema'

interface Props {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersActionDialog({ currentRow, open, onOpenChange }: Props) {
  const isEdit = !!currentRow
  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()

  const form = useForm<UserForm>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirmPassword: '',
      isEdit,
    },
  })

  // Обновляем форму при изменении currentRow
  useEffect(() => {
    if (isEdit && currentRow) {
      form.reset({
        first_name: currentRow.first_name || '',
        last_name: currentRow.last_name || '',
        email: currentRow.email || '',
        password: '',
        confirmPassword: '',
        isEdit: true,
      })
    } else {
      form.reset({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        isEdit: false,
      })
    }
  }, [currentRow, isEdit, form])

  const onSubmit = async (values: UserForm) => {
    try {
      if (isEdit && currentRow) {
        const updateData: any = {
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
        }
        
        // Добавляем пароль только если он был введен
        if (values.password) {
          updateData.password = values.password
        }

        await updateUserMutation.mutateAsync({
          userId: currentRow.id,
          userData: updateData,
        })
      } else {
        await createUserMutation.mutateAsync({
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          password: values.password,
        })
      }
      
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Ошибка при сохранении пользователя:', error)
      // Ошибка уже обработана в хуках и показана через toast
    }
  }

  const isLoading = createUserMutation.isPending || updateUserMutation.isPending

  const handleOpenChange = (state: boolean) => {
    if (!isLoading) {
      form.reset()
      onOpenChange(state)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-left'>
          <DialogTitle>
            {isEdit ? 'Редактировать пользователя' : 'Добавить нового пользователя'}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Обновите информацию о пользователе. Оставьте поле пароля пустым, чтобы не изменять его.' 
              : 'Создайте нового пользователя. Все поля обязательны для заполнения.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className='-mr-4 h-auto w-full overflow-y-auto py-1 pr-4'>
          <Form {...form}>
            <form
              id='user-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 p-0.5'
            >
              <FormField
                control={form.control}
                name='first_name'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Имя *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Иван'
                        className='col-span-4'
                        autoComplete='given-name'
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name='last_name'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Фамилия *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Иванов'
                        className='col-span-4'
                        autoComplete='family-name'
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Email *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='ivan@example.com'
                        className='col-span-4'
                        autoComplete='email'
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Пароль {!isEdit && '*'}
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder={
                          isEdit 
                            ? 'Оставьте пустым, чтобы не изменять' 
                            : 'Минимум 8 символов'
                        }
                        className='col-span-4'
                        autoComplete='new-password'
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Подтвердить пароль {!isEdit && '*'}
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder='Подтвердите пароль'
                        className='col-span-4'
                        autoComplete='new-password'
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button 
            type='submit' 
            form='user-form'
            disabled={isLoading}
          >
            {isLoading 
              ? (isEdit ? 'Сохранение...' : 'Создание...') 
              : (isEdit ? 'Сохранить' : 'Создать')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
