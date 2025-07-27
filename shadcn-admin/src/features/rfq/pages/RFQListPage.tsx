import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, Search, Filter, FileText, Calendar, Building } from 'lucide-react'
import { useRFQs } from '@/hooks/useRFQ'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type RFQ } from '@/lib/types'
import { usePermissions } from '@/contexts/RoleContext'

const statusColors = {
  draft: 'secondary',
  submitted: 'default',
  in_progress: 'destructive',
  completed: 'default',
  cancelled: 'secondary',
} as const

const statusLabels = {
  draft: 'Черновик',
  submitted: 'Отправлен',
  in_progress: 'В работе',
  completed: 'Завершен',
  cancelled: 'Отменен',
} as const

const priorityColors = {
  low: 'secondary',
  medium: 'default',
  high: 'destructive',
  urgent: 'destructive',
} as const

const priorityLabels = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  urgent: 'Срочный',
} as const

export function RFQListPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const pageSize = 20

  const { data, isLoading, error } = useRFQs(page, pageSize, search)
  const { canCreateRFQ } = usePermissions()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header className="sticky top-0 z-10">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Запросы цен (RFQ)</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canCreateRFQ() && (
            <Button asChild>
              <Link to="/rfq/create">
                <Plus className="h-4 w-4 mr-2" />
                Создать RFQ
              </Link>
            </Button>
          )}
        </div>
      </Header>

      <main className="flex-1 p-6">
        <div className="space-y-6">
          {/* Информация для product manager'ов */}
          {!canCreateRFQ() && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900 mb-1">
                      Управление предложениями
                    </h3>
                    <p className="text-sm text-blue-700">
                      Просматривайте запросы цен (RFQ) и создавайте предложения. 
                      Нажмите на любой RFQ чтобы добавить котировку.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Фильтры и поиск */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Фильтры</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по номеру, названию, компании..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Фильтры
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Таблица RFQ */}
          <Card>
            <CardHeader>
              <CardTitle>
                Список RFQ {data && `(${data.count})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-destructive">
                  Ошибка загрузки: {error.message}
                </div>
              ) : !data?.results?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  RFQ не найдены
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Номер</TableHead>
                        <TableHead>Название</TableHead>
                        <TableHead>Компания</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Приоритет</TableHead>
                        <TableHead>Позиций</TableHead>
                        <TableHead>Предложений</TableHead>
                        <TableHead>Крайний срок</TableHead>
                        <TableHead>Создан</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.results.map((rfq: RFQ) => (
                        <TableRow key={rfq.id}>
                          <TableCell>
                                                       <Link 
                             to="/rfq/$rfqId" 
                             params={{ rfqId: rfq.id }}
                             className="font-medium text-primary hover:underline"
                           >
                              {rfq.number}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{rfq.title}</div>
                            {rfq.description && (
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {rfq.description}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              {rfq.company_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusColors[rfq.status]}>
                              {statusLabels[rfq.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={priorityColors[rfq.priority]}>
                              {priorityLabels[rfq.priority]}
                            </Badge>
                          </TableCell>
                          <TableCell>{rfq.items_count}</TableCell>
                          <TableCell>{rfq.quotations_count}</TableCell>
                          <TableCell>
                            {rfq.deadline ? (
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {formatDate(rfq.deadline)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(rfq.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Пагинация */}
                  {data.total_pages > 1 && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Показано {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, data.count)} из {data.count}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!data.previous}
                          onClick={() => setPage(page - 1)}
                        >
                          Назад
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!data.next}
                          onClick={() => setPage(page + 1)}
                        >
                          Далее
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 