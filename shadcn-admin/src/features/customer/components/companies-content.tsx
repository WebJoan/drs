import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Building2, Users, TrendingUp, FilterX, RefreshCw, Loader2, Search as SearchIcon, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { CompaniesTable } from './companies-table'
import { CompaniesPrimaryButtons } from './companies-primary-buttons'
import { CompaniesDialogs } from './companies-dialogs'
import { useCompanies } from '@/hooks/useCompanies'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import CompaniesProvider from '../context/companies-context'

export default function CompaniesContent() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showSearchLoader, setShowSearchLoader] = useState(false)
  const [columnVisibility, setColumnVisibility] = useState({})
  const [tableInstance, setTableInstance] = useState<any>(null)

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

  // Функция для получения читаемых названий колонок
  const getColumnDisplayName = (columnId: string): string => {
    const columnNames: Record<string, string> = {
      select: 'Выбор',
      name: 'Название',
      company_type: 'Тип компании',
      status: 'Статус',
      industry: 'Отрасль',
      sales_manager_name: 'Менеджер',
      employees_count_actual: 'Сотрудники',
      contacts: 'Контакты',
    }
    
    return columnNames[columnId] || columnId
  }

  return (
    <CompaniesProvider>
      <div className='space-y-6'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div className='flex items-center space-x-2'>
            <div>
              <p className='text-muted-foreground text-sm sm:text-base'>
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

        {/* Статистика */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
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

        <div>
          {/* Фильтры */}
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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      Колонки <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {tableInstance?.getAllColumns()
                      ?.filter((column: any) => column.getCanHide())
                      .map((column: any) => {
                        return (
                          <DropdownMenuCheckboxItem
                            key={column.id}
                            className="capitalize"
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                          >
                            {getColumnDisplayName(column.id)}
                          </DropdownMenuCheckboxItem>
                        )
                      })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Таблица компаний */}
          {companiesResponse?.results && companiesResponse.results.length > 0 ? (
                <CompaniesTable 
                  companies={companies} 
                  isLoading={isLoading}
                  pagination={{
                    page,
                    pageSize,
                    total: companiesResponse.count,
                    totalPages: companiesResponse.total_pages,
                    onPageChange: (newPage) => {
                      setPage(newPage)
                    },
                    onPageSizeChange: (newPageSize) => {
                      setPageSize(newPageSize)
                      setPage(1) // Сброс на первую страницу при изменении размера
                    }
                  }}
                  isSearching={showSearchLoader}
                  hideSearch={true}
                  hideColumnsButton={true}
                  onTableInstanceChange={setTableInstance}
                  columnVisibility={columnVisibility}
                  onColumnVisibilityChange={setColumnVisibility}
                />
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
      </div>
      
      <CompaniesDialogs />
    </CompaniesProvider>
  )
} 