import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
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
import { Input } from '@/components/ui/input'
import { useAuth } from '@/stores/authStore'
import { useUpdateProfile } from '@/hooks/useProfile'

const profileFormSchema = z.object({
  email: z
    .string({
      required_error: 'Пожалуйста, введите email.',
    })
    .email({ message: 'Введите корректный email.' }),
  first_name: z
    .string()
    .min(1, {
      message: 'Имя обязательно для заполнения.',
    })
    .max(30, {
      message: 'Имя не должно быть длиннее 30 символов.',
    }),
  last_name: z
    .string()
    .min(1, {
      message: 'Фамилия обязательна для заполнения.',
    })
    .max(30, {
      message: 'Фамилия не должна быть длиннее 30 символов.',
    }),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export default function ProfileForm() {
  const { user } = useAuth()
  const { mutate: updateProfile, isPending } = useUpdateProfile()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      email: '',
      first_name: '',
      last_name: '',
    },
    mode: 'onChange',
  })

  // Заполняем форму данными пользователя при загрузке
  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
      })
    }
  }, [user, form])

  const onSubmit = (data: ProfileFormValues) => {
    updateProfile(data)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder='name@example.com' {...field} />
              </FormControl>
              <FormDescription>
                Это ваш адрес электронной почты, который будет использоваться для входа в систему.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='first_name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Имя</FormLabel>
              <FormControl>
                <Input placeholder='Иван' {...field} />
              </FormControl>
              <FormDescription>
                Ваше имя, которое будет отображаться в интерфейсе.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='last_name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Фамилия</FormLabel>
              <FormControl>
                <Input placeholder='Иванов' {...field} />
              </FormControl>
              <FormDescription>
                Ваша фамилия, которая будет отображаться в интерфейсе.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' disabled={isPending}>
          {isPending ? 'Обновление...' : 'Обновить профиль'}
        </Button>
      </form>
    </Form>
  )
}
