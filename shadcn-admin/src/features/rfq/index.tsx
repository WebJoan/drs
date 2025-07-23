import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle,
  AlertCircle,
  FilterX,
  TrendingUp
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { RFQTable } from './components/rfq-table'
import { useRFQs } from '@/hooks/useRFQs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { RFQ } from './types'

export default function RFQManagement() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('all')

  // Дебаунс для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { 
    data: rfqsResponse, 
    isLoading, 
    error, 
    refetch 
  } = useRFQs({
    page,
    pageSize,
    search: debouncedSearch,
    status: statusFilter === 'all' ? '' : statusFilter,
    priority: priorityFilter === 'all' ? '' : priorityFilter
  })

  const rfqs = rfqsResponse?.results || []

  const handleClearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setPriorityFilter('all')
  }

  const hasActiveFilters = search || (statusFilter !== 'all') || (priorityFilter !== 'all')

  // Фильтрация по табам
  const getFilteredRFQs = () => {
    switch (activeTab) {
      case 'drafts':
        return rfqs.filter(rfq => rfq.status === 'draft')
      case 'submitted':
        return rfqs.filter(rfq => rfq.status === 'submitted')
      case 'in-progress':
        return rfqs.filter(rfq => rfq.status === 'in_progress')
      case 'completed':
        return rfqs.filter(rfq => rfq.status === 'completed')
      default:
        return rfqs
    }
  }

  const filteredRFQs = getFilteredRFQs()

  // Статистика
  const stats = {
    total: rfqs.length,
    drafts: rfqs.filter(rfq => rfq.status === 'draft').length,
    submitted: rfqs.filter(rfq => rfq.status === 'submitted').length,
    inProgress: rfqs.filter(rfq => rfq.status === 'in_progress').length,
    completed: rfqs.filter(rfq => rfq.status === 'completed').length,
    overdue: rfqs.filter(rfq => 
      rfq.deadline && new Date(rfq.deadline) < new Date() && 
      !['completed', 'cancelled'].includes(rfq.status)
    ).length
  }

  const handleViewRFQ = (rfq: RFQ) => {
    // TODO: Открыть детальный просмотр RFQ
    console.log('View RFQ:', rfq)
  }

  const handleEditRFQ = (rfq: RFQ) => {
    // TODO: Открыть форму редактирования RFQ
    console.log('Edit RFQ:', rfq)
  }

  const handleSubmitRFQ = (rfq: RFQ) => {
    // TODO: Отправить RFQ
    console.log('Submit RFQ:', rfq)
  }

  const handleCreateQuotation = (rfq: RFQ) => {
    // TODO: Создать предложение для RFQ
    console.log('Create quotation for RFQ:', rfq)
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header>
        <div className="flex flex-1 items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <form className="ml-auto flex-1 sm:flex-initial">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск RFQ..."
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
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего RFQ</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">запросов цен</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Черновики</CardTitle>
              <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                Черновик
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.drafts}</div>
              <p className="text-xs text-muted-foreground">в работе</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Отправлено</CardTitle>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                Отправлен
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.submitted}</div>
              <p className="text-xs text-muted-foreground">ожидают ответа</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">В работе</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">обрабатываются</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Завершено</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">готовы</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Просрочено</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <p className="text-xs text-muted-foreground">требуют внимания</p>
            </CardContent>
          </Card>
        </div>

        {/* Заголовок и фильтры */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Запросы цен (RFQ)</h1>
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
              Создать RFQ
            </Button>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="draft">Черновик</SelectItem>
                <SelectItem value="submitted">Отправлен</SelectItem>
                <SelectItem value="in_progress">В работе</SelectItem>
                <SelectItem value="completed">Завершен</SelectItem>
                <SelectItem value="cancelled">Отменен</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Приоритет" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все приоритеты</SelectItem>
                <SelectItem value="low">Низкий</SelectItem>
                <SelectItem value="medium">Средний</SelectItem>
                <SelectItem value="high">Высокий</SelectItem>
                <SelectItem value="urgent">Срочный</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Табы и таблица */}
        <Card>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-6 pt-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all">
                    Все ({stats.total})
                  </TabsTrigger>
                  <TabsTrigger value="drafts">
                    Черновики ({stats.drafts})
                  </TabsTrigger>
                  <TabsTrigger value="submitted">
                    Отправлено ({stats.submitted})
                  </TabsTrigger>
                  <TabsTrigger value="in-progress">
                    В работе ({stats.inProgress})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Завершено ({stats.completed})
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value={activeTab} className="mt-0">
                <RFQTable 
                  rfqs={filteredRFQs} 
                  isLoading={isLoading}
                  onViewRFQ={handleViewRFQ}
                  onEditRFQ={handleEditRFQ}
                  onSubmitRFQ={handleSubmitRFQ}
                  onCreateQuotation={handleCreateQuotation}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </Main>
    </div>
  )
} 