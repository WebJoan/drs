import { z } from 'zod'

// Схема пользователя соответствует UserSimpleSerializer из Django
const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
})

export type User = z.infer<typeof userSchema>

export const userListSchema = z.array(userSchema)

// Схема для создания пользователя
export const createUserSchema = z.object({
  email: z.string().email('Некорректный email'),
  first_name: z.string().min(1, 'Имя обязательно'),
  last_name: z.string().min(1, 'Фамилия обязательна'),
  password: z.string().min(8, 'Пароль должен быть не менее 8 символов'),
})

// Схема для обновления пользователя
export const updateUserSchema = z.object({
  email: z.string().email('Некорректный email').optional(),
  first_name: z.string().min(1, 'Имя обязательно').optional(),
  last_name: z.string().min(1, 'Фамилия обязательна').optional(),
  password: z.string().min(8, 'Пароль должен быть не менее 8 символов').optional(),
})

// Схема для формы пользователя
export const userFormSchema = z
  .object({
    first_name: z.string().min(1, { message: 'Имя обязательно.' }),
    last_name: z.string().min(1, { message: 'Фамилия обязательна.' }),
    email: z
      .string()
      .min(1, { message: 'Email обязателен.' })
      .email({ message: 'Email неверный.' }),
    password: z.string().transform((pwd) => pwd.trim()),
    confirmPassword: z.string().transform((pwd) => pwd.trim()),
    isEdit: z.boolean(),
  })
  .superRefine(({ isEdit, password, confirmPassword }, ctx) => {
    // Для создания пользователя пароль обязателен
    // Для редактирования пароль опционален
    if (!isEdit || (isEdit && password !== '')) {
      if (!isEdit && password === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Пароль обязателен.',
          path: ['password'],
        })
      }

      if (password !== '' && password.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Пароль должен быть не менее 8 символов.',
          path: ['password'],
        })
      }

      if (password !== '' && password !== confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Пароли не совпадают.',
          path: ['confirmPassword'],
        })
      }
    }
  })

export type UserForm = z.infer<typeof userFormSchema>
export type CreateUserData = z.infer<typeof createUserSchema>
export type UpdateUserData = z.infer<typeof updateUserSchema>
