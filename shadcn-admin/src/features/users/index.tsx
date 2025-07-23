import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, AlertCircle, Users as UsersIcon } from 'lucide-react'
import { useUsers } from '@/hooks/useUsers'
import { columns } from './components/users-columns'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersTable } from './components/users-table'
import UsersProvider from './context/users-context'

export default function Users() {
  const { data: users, isLoading, error, refetch, isRefetching } = useUsers()

  const handleRefresh = () => {
    refetch()
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <Loader2 className='h-12 w-12 animate-spin mx-auto mb-4 text-primary' />
          <h2 className='text-lg font-semibold mb-2'>Загрузка пользователей...</h2>
          <p className='text-sm text-muted-foreground'>
            Пожалуйста, подождите, данные загружаются
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center max-w-md'>
          <AlertCircle className='h-12 w-12 mx-auto mb-4 text-destructive' />
          <h2 className='text-xl font-bold text-destructive mb-2'>Ошибка загрузки</h2>
          <p className='text-muted-foreground mb-4'>
            {error.message || 'Не удалось загрузить список пользователей. Проверьте подключение к интернету и попробуйте снова.'}
          </p>
          <Button onClick={handleRefresh} variant='outline' className='gap-2'>
            <RefreshCw className='h-4 w-4' />
            Повторить попытку
          </Button>
        </div>
      </div>
    )
  }

  return (
    <UsersProvider>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-6'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div className='flex items-center space-x-2'>
              <UsersIcon className='h-8 w-8 text-primary' />
              <div>
                <h1 className='text-3xl font-bold tracking-tight'>Пользователи</h1>
                <p className='text-muted-foreground mt-1'>
                  {users?.length ? (
                    `Управление ${users.length} пользователями и их ролями`
                  ) : (
                    'Управление пользователями и их ролями'
                  )}
                </p>
              </div>
            </div>
            <div className='flex flex-wrap items-center gap-2 sm:space-x-2'>
              <Button
                onClick={handleRefresh}
                variant='outline'
                size='sm'
                disabled={isRefetching}
                className='gap-2'
              >
                <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                {isRefetching ? 'Обновление...' : 'Обновить'}
              </Button>
              <UsersPrimaryButtons />
            </div>
          </div>
        </div>

        <div className='space-y-4'>
          {users && users.length > 0 ? (
            <UsersTable data={users} columns={columns} />
          ) : (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <UsersIcon className='h-12 w-12 text-muted-foreground mb-4' />
              <h3 className='text-lg font-semibold mb-2'>Нет пользователей</h3>
              <p className='text-muted-foreground mb-4 max-w-sm'>
                Пользователи не найдены. Создайте первого пользователя, чтобы начать работу.
              </p>
              <UsersPrimaryButtons />
            </div>
          )}
        </div>
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}
