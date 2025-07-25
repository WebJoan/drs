import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, Search, Filter, MessageCircle, Calendar, Building, User } from 'lucide-react'
import { useQuotations } from '@/hooks/useRFQ'
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
import { type Quotation } from '@/lib/types'

const statusColors = {
  draft: 'secondary',
  submitted: 'default',
  accepted: 'default',
  rejected: 'destructive',
  expired: 'secondary',
} as const

const statusLabels = {
  draft: 'Черновик',
  submitted: 'Отправлено',
  accepted: 'Принято',
  rejected: 'Отклонено',
  expired: 'Просрочено',
} as const

export function QuotationListPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const pageSize = 20

  const { data, isLoading, error } = useQuotations(page, pageSize, search)

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
            <MessageCircle className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Предложения</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link to="/rfq">
              <Plus className="h-4 w-4 mr-2" />
              Создать предложение
            </Link>
          </Button>
        </div>
      </Header>

      <main className="flex-1 p-6">
        <div className="space-y-6">
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
                    placeholder="Поиск по номеру предложения, RFQ, компании..."
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

          {/* Таблица предложений */}
          <Card>
            <CardHeader>
              <CardTitle>
                Список предложений {data && `(${data.count})`}
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
                  Предложения не найдены
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Номер</TableHead>
                        <TableHead>Название</TableHead>
                        <TableHead>RFQ</TableHead>
                        <TableHead>Компания</TableHead>
                        <TableHead>Product менеджер</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Валюта</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead>Действительно до</TableHead>
                        <TableHead>Создано</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.results.map((quotation: Quotation) => (
                        <TableRow key={quotation.id}>
                          <TableCell>
                            <Link 
                              to="/rfq/$rfqId" 
                              params={{ rfqId: quotation.rfq }}
                              className="font-medium text-primary hover:underline"
                            >
                              {quotation.number}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{quotation.title}</div>
                            {quotation.description && (
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {quotation.description}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Link 
                              to="/rfq/$rfqId" 
                              params={{ rfqId: quotation.rfq }}
                              className="text-primary hover:underline"
                            >
                              {quotation.rfq_details.number}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              {quotation.rfq_details.company_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            {quotation.product_manager_name ? (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                {quotation.product_manager_name}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusColors[quotation.status]}>
                              {statusLabels[quotation.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>{quotation.currency_details.code}</TableCell>
                          <TableCell className="font-medium">
                            {quotation.total_amount.toLocaleString()} {quotation.currency_details.symbol}
                          </TableCell>
                          <TableCell>
                            {quotation.valid_until ? (
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {formatDate(quotation.valid_until)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(quotation.created_at)}
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