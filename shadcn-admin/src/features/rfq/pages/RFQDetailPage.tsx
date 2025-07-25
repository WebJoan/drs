import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, Edit, Plus, FileText, Building, User, Calendar, Package, MessageCircle } from 'lucide-react'
import { useRFQ, useQuotationsForRFQ } from '@/hooks/useRFQ'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type RFQItem, type Quotation } from '@/lib/types'

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

export function RFQDetailPage() {
  const { rfqId } = useParams({ from: '/_authenticated/rfq/$rfqId' })
  const { data: rfq, isLoading, error } = useRFQ(rfqId)
  const { data: quotations } = useQuotationsForRFQ(rfqId)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !rfq) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Ошибка</h2>
          <p className="text-muted-foreground">
            {error?.message || 'RFQ не найден'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header className="sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/rfq">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к списку
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <h1 className="text-xl font-semibold">{rfq.number}</h1>
            <Badge variant={statusColors[rfq.status]}>
              {statusLabels[rfq.status]}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Редактировать
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Добавить позицию
          </Button>
        </div>
      </Header>

      <main className="flex-1 p-6">
        <div className="space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{rfq.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {rfq.description && (
                  <div>
                    <h4 className="font-medium mb-2">Описание</h4>
                    <p className="text-muted-foreground">{rfq.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Приоритет</h4>
                    <Badge variant={priorityColors[rfq.priority]}>
                      {priorityLabels[rfq.priority]}
                    </Badge>
                  </div>
                  
                  {rfq.deadline && (
                    <div>
                      <h4 className="font-medium mb-2">Крайний срок</h4>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(rfq.deadline)}
                      </div>
                    </div>
                  )}
                </div>

                {rfq.delivery_address && (
                  <div>
                    <h4 className="font-medium mb-2">Адрес доставки</h4>
                    <p className="text-muted-foreground">{rfq.delivery_address}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rfq.payment_terms && (
                    <div>
                      <h4 className="font-medium mb-2">Условия оплаты</h4>
                      <p className="text-muted-foreground">{rfq.payment_terms}</p>
                    </div>
                  )}
                  
                  {rfq.delivery_terms && (
                    <div>
                      <h4 className="font-medium mb-2">Условия поставки</h4>
                      <p className="text-muted-foreground">{rfq.delivery_terms}</p>
                    </div>
                  )}
                </div>

                {rfq.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Заметки</h4>
                    <p className="text-muted-foreground">{rfq.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Информация о заказчике
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Компания</h4>
                  <p className="text-muted-foreground">{rfq.company_name}</p>
                </div>
                
                {rfq.contact_person_name && (
                  <div>
                    <h4 className="font-medium mb-2">Контактное лицо</h4>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {rfq.contact_person_name}
                    </div>
                  </div>
                )}

                {rfq.sales_manager_name && (
                  <div>
                    <h4 className="font-medium mb-2">Sales менеджер</h4>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {rfq.sales_manager_name}
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>Создан: {formatDate(rfq.created_at)}</div>
                  <div>Обновлен: {formatDate(rfq.updated_at)}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Табы с позициями и предложениями */}
          <Tabs defaultValue="items" className="w-full">
            <TabsList>
              <TabsTrigger value="items" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Позиции ({rfq.items?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="quotations" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Предложения ({quotations?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="items" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Позиции RFQ</CardTitle>
                </CardHeader>
                <CardContent>
                  {!rfq.items?.length ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Позиции не добавлены
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>№</TableHead>
                          <TableHead>Товар</TableHead>
                          <TableHead>Производитель</TableHead>
                          <TableHead>Артикул</TableHead>
                          <TableHead>Количество</TableHead>
                          <TableHead>Ед. изм.</TableHead>
                          <TableHead>Файлы</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rfq.items.map((item: RFQItem) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.line_number}</TableCell>
                            <TableCell>
                              <div className="font-medium">{item.product_name_display}</div>
                              {item.specifications && (
                                <div className="text-sm text-muted-foreground truncate max-w-xs">
                                  {item.specifications}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{item.manufacturer || '—'}</TableCell>
                            <TableCell>{item.part_number || '—'}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell>
                              {item.files?.length ? (
                                <Badge variant="outline">{item.files.length}</Badge>
                              ) : (
                                '—'
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quotations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Предложения</CardTitle>
                </CardHeader>
                <CardContent>
                  {!quotations?.length ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Предложения не найдены
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {quotations.map((quotation: Quotation) => (
                        <Card key={quotation.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="font-medium">{quotation.number}</h4>
                                <p className="text-sm text-muted-foreground">{quotation.title}</p>
                              </div>
                              <Badge variant="outline">{quotation.status}</Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Product менеджер:</span>
                                <div>{quotation.product_manager_name || '—'}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Валюта:</span>
                                <div>{quotation.currency_details.code}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Сумма:</span>
                                <div className="font-medium">
                                  {quotation.total_amount} {quotation.currency_details.symbol}
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4 text-sm text-muted-foreground">
                              Создано: {formatDateOnly(quotation.created_at)}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
} 