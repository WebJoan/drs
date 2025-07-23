import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, TrendingUp, FilterX, Search as SearchIcon, RefreshCw, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { CompaniesTable } from './components/companies-table'
import { CompaniesPrimaryButtons } from './components/companies-primary-buttons'
import { CompaniesDialogs } from './components/companies-dialogs'
import { useCompanies } from '@/hooks/useCompanies'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import CompaniesProvider from './context/companies-context'

export default function Companies() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showSearchLoader, setShowSearchLoader] = useState(false)

  // Дебаунс для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { 
    data: companiesResponse, 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = useCompanies({
    page,
    pageSize,
    search: debouncedSearch,
    status: statusFilter === 'all' ? '' : statusFilter,
    company_type: typeFilter === 'all' ? '' : typeFilter
  })

  const companies = companiesResponse?.results || []

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

  const handleClearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setTypeFilter('all')
  }

  const handleRefresh = () => {
    refetch()
  }

  const hasActiveFilters = search || (statusFilter !== 'all') || (typeFilter !== 'all')

  return (
    <CompaniesProvider>
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
              <Building2 className='h-8 w-8 text-primary' />
              <div>
                <h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>Компании</h1>
                <p className='text-muted-foreground mt-1 text-sm sm:text-base'>
                  {companiesResponse?.results?.length ? (
                    `Управление ${companiesResponse.count} компаниями (показано ${companiesResponse.results.length} из ${companiesResponse.count})`
                  ) : (
                    'Управление компаниями и клиентами'
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
              <CompaniesPrimaryButtons />
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Всего компаний</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{companiesResponse?.count || 0}</div>
              <p className="text-xs text-muted-foreground">в базе данных</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Активных</CardTitle>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs">
                Активные
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {companies.filter(c => c.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">компаний работают</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Потенциальных</CardTitle>
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 text-xs">
                Потенциальные
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {companies.filter(c => c.status === 'potential').length}
              </div>
              <p className="text-xs text-muted-foreground">требуют проработки</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Контактов</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {companies.reduce((sum, c) => sum + (c.employees_count_actual || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">контактных лиц</p>
            </CardContent>
          </Card>
        </div>

        <div className='space-y-4'>
          {/* Поисковая строка и фильтры */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-8 px-2 lg:px-3"
                  >
                    <FilterX className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Сбросить фильтры</span>
                    <span className="sm:hidden">Сбросить</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1 sm:max-w-sm">
                {showSearchLoader ? (
                  <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
                ) : (
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                )}
                <Input
                  placeholder="Поиск компаний..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setPage(1)
                  }}
                  className="pl-10"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="active">Активные</SelectItem>
                    <SelectItem value="potential">Потенциальные</SelectItem>
                    <SelectItem value="inactive">Неактивные</SelectItem>
                    <SelectItem value="blacklist">Черный список</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Тип компании" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы</SelectItem>
                    <SelectItem value="manufacturer">Производитель</SelectItem>
                    <SelectItem value="distributor">Дистрибьютор</SelectItem>
                    <SelectItem value="integrator">Интегратор</SelectItem>
                    <SelectItem value="end_user">Конечный пользователь</SelectItem>
                    <SelectItem value="other">Другое</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Таблица компаний */}
          {companiesResponse?.results && companiesResponse.results.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <CompaniesTable 
                  companies={companies} 
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className='flex flex-col items-center justify-center py-16 text-center'>
                <Building2 className='h-16 w-16 text-muted-foreground mb-6' />
                <h3 className='text-xl font-semibold mb-3'>
                  {search ? 'Компании не найдены' : 'Нет компаний'}
                </h3>
                <p className='text-muted-foreground mb-6 max-w-md text-sm'>
                  {search 
                    ? `По запросу "${search}" компании не найдены. Попробуйте изменить поисковый запрос.`
                    : 'Компании не найдены. Создайте первую компанию, чтобы начать работу.'
                  }
                </p>
                <CompaniesPrimaryButtons />
              </CardContent>
            </Card>
          )}
        </div>
      </Main>
      
      <CompaniesDialogs />
    </CompaniesProvider>
  )
} 