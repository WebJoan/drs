import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import AuthLayout from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'

export default function SignIn() {
  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>Авторизация</CardTitle>
          <CardDescription>
            Введите ваш email и пароль для <br />
            входа в аккаунт
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserAuthForm />
        </CardContent>
        <CardFooter>
          <p className='text-muted-foreground px-8 text-center text-sm'>
            Нажимая войти, вы соглашаетесь с нашими{' '}
            <a
              href='/terms'
              className='hover:text-primary underline underline-offset-4'
            >
              Условиями использования
            </a>{' '}
            и{' '}
            <a
              href='/privacy'
              className='hover:text-primary underline underline-offset-4'
            >
              Политикой конфиденциальности
            </a>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
