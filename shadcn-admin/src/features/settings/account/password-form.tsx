import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { PasswordInput } from '@/components/password-input'
import { useUpdatePassword } from '@/hooks/useProfile'

const passwordFormSchema = z.object({
  current_password: z
    .string()
    .min(1, {
      message: 'Введите текущий пароль.',
    }),
  new_password: z
    .string()
    .min(7, {
      message: 'Новый пароль должен быть не менее 7 символов.',
    }),
  confirm_password: z
    .string()
    .min(1, {
      message: 'Подтвердите новый пароль.',
    }),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Пароли не совпадают.',
  path: ['confirm_password'],
})

type PasswordFormValues = z.infer<typeof passwordFormSchema>

export function PasswordForm() {
  const { mutate: updatePassword, isPending } = useUpdatePassword()

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  })

  const onSubmit = (data: PasswordFormValues) => {
    updatePassword({
      current_password: data.current_password,
      new_password: data.new_password,
    })
    // Очищаем форму после успешной отправки
    form.reset()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='current_password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Текущий пароль</FormLabel>
              <FormControl>
                <PasswordInput placeholder='Введите текущий пароль' {...field} />
              </FormControl>
              <FormDescription>
                Для безопасности введите ваш текущий пароль.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='new_password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Новый пароль</FormLabel>
              <FormControl>
                <PasswordInput placeholder='Введите новый пароль' {...field} />
              </FormControl>
              <FormDescription>
                Пароль должен быть не менее 7 символов.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='confirm_password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Подтверждение пароля</FormLabel>
              <FormControl>
                <PasswordInput placeholder='Подтвердите новый пароль' {...field} />
              </FormControl>
              <FormDescription>
                Повторите новый пароль для подтверждения.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' disabled={isPending}>
          {isPending ? 'Обновление...' : 'Обновить пароль'}
        </Button>
      </form>
    </Form>
  )
} 