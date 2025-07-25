import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Building2, RefreshCw, Loader2, Plus, User, TrendingUp, Star } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useContacts, type Contact } from '@/hooks/useContacts'
import ContactsProvider, { useContactsContext } from '../context/contacts-context'
import { ContactsDialogs } from './contacts-dialogs'
import { ContactsTable } from './contacts-table'
import { contactsColumns } from './contacts-columns'

function MyContactsContentInner() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showSearchLoader, setShowSearchLoader] = useState(false)

  const { setIsCreateDialogOpen } = useContactsContext()

  // Дебаунс для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { 
    data: contactsResponse, 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = useContacts({
    page,
    pageSize,
    search: debouncedSearch
  })

  const contacts = contactsResponse?.results || []

  // Управление индикатором загрузки поиска
  useEffect(() => {
    if (isRefetching && debouncedSearch) {
      const timer = setTimeout(() => {
        setShowSearchLoader(true)
      }, 100)

      return () => clearTimeout(timer)
    } else {
      setShowSearchLoader(false)
    }
  }, [isRefetching, debouncedSearch])

  const handleRefresh = () => {
    refetch()
  }

  const handleAddContact = () => {
    setIsCreateDialogOpen(true)
  }



  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-16'>
        <div className='text-center'>
          <Loader2 className='h-12 w-12 animate-spin mx-auto mb-4 text-primary' />
          <h2 className='text-lg font-semibold mb-2'>Загрузка контактов...</h2>
          <p className='text-sm text-muted-foreground'>
            Пожалуйста, подождите, данные загружаются
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='flex items-center space-x-2'>
          <div>
            <p className='text-muted-foreground text-sm sm:text-base'>
              {contactsResponse?.results?.length ? (
                `Управление ${contactsResponse.count} контактами (показано ${contactsResponse.results.length} из ${contactsResponse.count})`
              ) : (
                'Управление контактными лицами'
              )}
            </p>
          </div>
        </div>
        <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-2'>
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
          <Button
            onClick={handleAddContact}
            className='gap-2'
          >
            <Plus className='h-4 w-4' />
            Добавить контакт
          </Button>
        </div>
      </div>

      {/* Бизнес-статистика */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего контактов</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contactsResponse?.count || 0}</div>
            <p className="text-xs text-muted-foreground">в базе данных</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активных</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {contacts.filter(c => c.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">готовы к работе</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ключевых</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {contacts.filter(c => c.is_primary_contact).length}
            </div>
            <p className="text-xs text-muted-foreground">лиц принятия решений</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Компаний</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(contacts.map(c => c.company?.id || c.company_name)).size}
            </div>
            <p className="text-xs text-muted-foreground">бизнес-партнеров</p>
          </CardContent>
        </Card>
      </div>

      {/* Стильная таблица контактов */}
      <div className='space-y-4'>
        {contacts && contacts.length > 0 ? (
          <ContactsTable 
            data={contacts} 
            columns={contactsColumns}
            pagination={{
              page,
              pageSize,
              total: contactsResponse?.count || 0,
              totalPages: Math.ceil((contactsResponse?.count || 0) / pageSize),
              onPageChange: (newPage) => {
                setPage(newPage)
              },
              onPageSizeChange: (newPageSize) => {
                setPageSize(newPageSize)
                setPage(1) // Сброс на первую страницу при изменении размера
              }
            }}
            onSearchChange={(value) => {
              setSearch(value)
              setPage(1) // Сброс на первую страницу при поиске
            }}
            searchValue={search}
            isSearching={showSearchLoader}
          />
        ) : (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-16 text-center'>
              <User className='h-16 w-16 text-muted-foreground mb-6' />
              <h3 className='text-xl font-semibold mb-3'>
                {search ? 'Контакты не найдены' : 'Нет контактов'}
              </h3>
              <p className='text-muted-foreground mb-6 max-w-md text-sm'>
                {search 
                  ? `По запросу "${search}" контакты не найдены. Попробуйте изменить поисковый запрос.`
                  : 'Контакты не найдены. Добавьте первый контакт, чтобы начать работу.'
                }
              </p>
              <Button className='gap-2' onClick={handleAddContact}>
                <Plus className='h-4 w-4' />
                Добавить контакт
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function MyContactsContent() {
  return (
    <ContactsProvider>
      <MyContactsContentInner />
      <ContactsDialogs />
    </ContactsProvider>
  )
} 