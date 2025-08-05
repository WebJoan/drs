import { useState, useEffect } from 'react'
import { Mail, Plus, Bot, Users, Send, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { UniversalDataTable } from '@/components/ui/universal-data-table'
import { Badge } from '@/components/ui/badge'
import { useAiEmails } from '../hooks/useEmailMarketing'
import { columns } from '../components/email-columns'
import { EmailDialogs } from '../components/email-dialogs'
import { AiEmail, EMAIL_STATUS_LABELS, EmailStatus } from '../types'

// Импорты для получения данных селектов
import { useRecipients, useSalesManagers, useProducts } from '../hooks/useDataSelects'

export function EmailMarketingPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showSearchLoader, setShowSearchLoader] = useState(false)

  // Состояния для диалогов
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [editingEmail, setEditingEmail] = useState<AiEmail | null>(null)

  // Дебаунс для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading, error, refetch, isRefetching } = useAiEmails(page, pageSize, debouncedSearch)

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

  // Получение реальных данных для селектов
  const { data: recipients = [], isLoading: recipientsLoading } = useRecipients()
  const { data: salesManagers = [], isLoading: salesManagersLoading } = useSalesManagers()
  const { data: products = [], isLoading: productsLoading } = useProducts()

  // Обработчики для открытия диалогов
  const handleCreateEmail = () => {
    setIsCreateDialogOpen(true)
  }

  const handleGenerateEmail = () => {
    setIsGenerateDialogOpen(true)
  }

  const handleEditEmail = (email: AiEmail) => {
    setEditingEmail(email)
    setIsEditDialogOpen(true)
  }

  // Подсчет статистики
  const getEmailStats = () => {
    if (!data?.results) return null

    const stats = data.results.reduce((acc, email) => {
      acc[email.status] = (acc[email.status] || 0) + 1
      return acc
    }, {} as Record<EmailStatus, number>)

    return {
      total: data.count,
      draft: stats.draft || 0,
      sent: stats.sent || 0,
      delivered: stats.delivered || 0,
      error: stats.error || 0,
      archived: stats.archived || 0,
    }
  }

  const stats = getEmailStats()

  // Показываем полноэкранный спиннер только при первоначальной загрузке без данных
  if (isLoading && !data) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <Loader2 className='h-12 w-12 animate-spin mx-auto mb-4 text-primary' />
          <h2 className='text-lg font-semibold mb-2'>Загрузка писем...</h2>
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
            {error.message || 'Не удалось загрузить список писем. Проверьте подключение к интернету и попробуйте снова.'}
          </p>
          <Button onClick={() => refetch()} variant='outline' className='gap-2'>
            <AlertCircle className='h-4 w-4' />
            Повторить попытку
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header className="sticky top-0 z-10">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Email маркетинг</h1>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button onClick={handleGenerateEmail} variant="outline" size="sm" className="gap-2">
              <Bot className="h-4 w-4" />
              Генерировать AI
            </Button>
            <Button onClick={handleCreateEmail} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Создать письмо
            </Button>
          </div>
        </div>
      </Header>

      <main className="flex-1 p-6">
        <div className="space-y-6">
          {/* Статистика */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Всего</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Черновики</CardTitle>
                  <Badge variant="secondary" className="px-1">{stats.draft}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Отправлено</CardTitle>
                  <Send className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Доставлено</CardTitle>
                  <Badge variant="default" className="px-1 bg-green-100 text-green-800">{stats.delivered}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ошибки</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.error}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Архив</CardTitle>
                  <Badge variant="outline" className="px-1">{stats.archived}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-500">{stats.archived}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Информация о письмах */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5" />
                AI Письма
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {data?.results?.length ? (
                  `Найдено ${data.count} писем (показано ${data.results.length} из ${data.count})`
                ) : (
                  'Управляйте вашими AI письмами - создавайте, редактируйте, отправляйте'
                )}
              </p>
            </CardContent>
          </Card>

          {/* Таблица писем */}
          <Card>
            <CardContent className="p-6">
              {data?.results && data.results.length > 0 ? (
                <UniversalDataTable 
                  data={data.results} 
                  columns={columns}
                  enableRowSelection={false}
                  enableSorting={true}
                  enableColumnVisibility={true}
                  enableFiltering={true}
                  pagination={{ 
                    type: 'external',
                    config: {
                      page,
                      pageSize,
                      total: data.count,
                      totalPages: data.total_pages,
                      onPageChange: (newPage: number) => {
                        setPage(newPage)
                      },
                      onPageSizeChange: (newPageSize: number) => {
                        setPageSize(newPageSize)
                        setPage(1)
                      }
                    },
                    showRowsSelected: false
                  }}
                  search={{
                    enabled: true,
                    placeholder: 'Поиск по теме, содержанию, получателю...',
                    value: search,
                    onChange: (value: string) => {
                      setSearch(value)
                      setPage(1)
                    },
                    isSearching: showSearchLoader
                  }}
                  emptyMessage="Письма не найдены."
                />
              ) : (
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                  <Mail className='h-12 w-12 text-muted-foreground mb-4' />
                  <h3 className='text-lg font-semibold mb-2'>
                    {search ? 'Письма не найдены' : 'Нет писем'}
                  </h3>
                  <p className='text-muted-foreground mb-4 max-w-sm'>
                    {search 
                      ? `По запросу "${search}" письма не найдены. Попробуйте изменить поисковый запрос.`
                      : 'Письма не найдены. Создайте первое письмо или сгенерируйте его с помощью AI.'
                    }
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateEmail} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Создать письмо
                    </Button>
                    <Button onClick={handleGenerateEmail} variant="outline" className="gap-2">
                      <Bot className="h-4 w-4" />
                      Генерировать AI
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Диалоги */}
      <EmailDialogs
        isCreateDialogOpen={isCreateDialogOpen}
        setIsCreateDialogOpen={setIsCreateDialogOpen}
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
        editingEmail={editingEmail}
        setEditingEmail={setEditingEmail}
        isGenerateDialogOpen={isGenerateDialogOpen}
        setIsGenerateDialogOpen={setIsGenerateDialogOpen}
        recipients={recipients?.map(person => ({
          id: person.id,
          name: person.full_name,
          email: person.email
        })) || []}
        salesManagers={salesManagers || []}
        products={products?.map(product => ({
          id: product.id,
          name: product.complex_name || product.name
        })) || []}
        isLoadingData={recipientsLoading || salesManagersLoading || productsLoading}
      />
    </div>
  )
}