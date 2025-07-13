import { Link } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import AuthLayout from '../auth-layout'
import { SignUpForm } from './components/sign-up-form'

export default function SignUp() {
  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            Создать аккаунт
          </CardTitle>
          <CardDescription>
            Введите ваш email и пароль для создания аккаунта. <br />
            Уже есть аккаунт?{' '}
            <Link
              to='/sign-in'
              className='hover:text-primary underline underline-offset-4'
            >
              Войти
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
        <CardFooter>
          <p className='text-muted-foreground px-8 text-center text-sm'>
            Создавая аккаунт, вы соглашаетесь с нашими{' '}
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
