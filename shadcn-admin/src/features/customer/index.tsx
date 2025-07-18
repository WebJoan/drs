import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Plus, Users, TrendingUp, FilterX } from 'lucide-react'
import { useState, useEffect } from 'react'
import { CompaniesTable } from './components/companies-table'
import { useCompanies } from '@/hooks/useCompanies'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function Companies() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')

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
    refetch 
  } = useCompanies({
    page,
    pageSize,
    search: debouncedSearch,
    status: statusFilter,
    company_type: typeFilter
  })

  const companies = companiesResponse?.results || []

  const handleClearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setTypeFilter('')
  }

  const hasActiveFilters = search || statusFilter || typeFilter

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header>
        <div className="flex flex-1 items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <form className="ml-auto flex-1 sm:flex-initial">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск компаний..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
              />
            </div>
          </form>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <TrendingUp className="h-4 w-4" />
          </Button>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {/* Статистика */}
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего компаний</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companiesResponse?.count || 0}</div>
              <p className="text-xs text-muted-foreground">в базе данных</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активных</CardTitle>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                Активные
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {companies.filter(c => c.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">компаний работают</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Потенциальных</CardTitle>
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                Потенциальные
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {companies.filter(c => c.status === 'potential').length}
              </div>
              <p className="text-xs text-muted-foreground">требуют проработки</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Контактов</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {companies.reduce((sum, c) => sum + (c.employees_count_actual || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">контактных лиц</p>
            </CardContent>
          </Card>
        </div>

        {/* Фильтры и действия */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Компании</h1>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-8 px-2 lg:px-3"
                >
                  <FilterX className="mr-2 h-4 w-4" />
                  Сбросить фильтры
                </Button>
              )}
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Добавить компанию
            </Button>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Все статусы</SelectItem>
                <SelectItem value="active">Активные</SelectItem>
                <SelectItem value="potential">Потенциальные</SelectItem>
                <SelectItem value="inactive">Неактивные</SelectItem>
                <SelectItem value="blacklist">Черный список</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Тип компании" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Все типы</SelectItem>
                <SelectItem value="manufacturer">Производитель</SelectItem>
                <SelectItem value="distributor">Дистрибьютор</SelectItem>
                <SelectItem value="integrator">Интегратор</SelectItem>
                <SelectItem value="end_user">Конечный пользователь</SelectItem>
                <SelectItem value="other">Другое</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Таблица компаний */}
        <Card>
          <CardContent className="p-0">
            <CompaniesTable companies={companies} isLoading={isLoading} />
          </CardContent>
        </Card>
      </Main>
    </div>
  )
} 