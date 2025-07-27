import { useState } from 'react'
import { Link, useParams, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Edit, Plus, FileText, Building, User, Calendar, Package, MessageCircle, Upload } from 'lucide-react'
import { useRFQ, useQuotationsForRFQ, useCreateFullQuotation, useCurrencies } from '@/hooks/useRFQ'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type RFQItem, type Quotation, type Currency } from '@/lib/types'
import { AddRFQItemModal } from '@/components/modals/AddRFQItemModal'
import { FileUpload } from '@/components/rfq/FileUpload'
import { QuickQuotationRow } from '@/features/rfq/components/QuickQuotationRow'
import { QuickQuotationModal } from '@/features/rfq/components/QuickQuotationModal'
import { UltraRFQTable } from '@/features/rfq/components/UltraRFQTable'
import { RFQKeyboardShortcuts } from '@/features/rfq/components/RFQKeyboardShortcuts'
import { useQuotationProposals } from '@/hooks/useQuotationProposals'
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

export function RFQDetailPage() {
  const { rfqId } = useParams({ from: '/_authenticated/rfq/$rfqId' })
  const navigate = useNavigate()
  const { data: rfq, isLoading, error } = useRFQ(rfqId)
  const { data: quotations } = useQuotationsForRFQ(rfqId)
  const { data: currencies = [] } = useCurrencies()
  const createFullQuotation = useCreateFullQuotation()
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [isQuickQuotationModalOpen, setIsQuickQuotationModalOpen] = useState(false)
  const [fileUploadState, setFileUploadState] = useState<{
    open: boolean
    rfqItemId?: number
    files?: any[]
  }>({ open: false })
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null)
  const { canCreateQuotations, canEditRFQ } = usePermissions()
  
  // Хук для управления предложениями
  const {
    proposals,
    addProposal,
    updateProposal,
    removeProposal,
    getProposalsForItem,
    getTotalProposalsCount,
    clearAllProposals,
    exportProposals
  } = useQuotationProposals()

  // Вычисляем следующий номер строки для новой позиции
  const getNextLineNumber = () => {
    if (!rfq?.items?.length) return 1
    const maxLineNumber = Math.max(...rfq.items.map(item => item.line_number))
    return maxLineNumber + 1
  }

  // Быстрое создание котировки из предложений
  const handleCreateQuotation = () => {
    const proposals = exportProposals()
    if (proposals.length === 0) {
      toast.error('Добавьте хотя бы одно предложение для создания котировки')
      return
    }
    setIsQuickQuotationModalOpen(true)
  }

  // Переход к полному созданию котировки
  const handleFullCreateQuotation = () => {
    navigate({
      to: '/rfq/quotations/create',
      search: { rfqId: rfqId.toString() }
    })
  }

  // Создание полной котировки с предложениями
  const handleQuickQuotationSubmit = async (quotationData: any, items: any[]) => {
    try {
      await createFullQuotation.mutateAsync({
        quotation: quotationData,
        items: items
      })
      
      clearAllProposals()
      navigate({ to: '/rfq/$rfqId', params: { rfqId } })
    } catch (error) {
      console.error('Ошибка создания котировки:', error)
    }
  }

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
        {/* Десктопная версия */}
        <div className="hidden md:flex items-center justify-between w-full">
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
            {canEditRFQ() && (
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Редактировать
              </Button>
            )}
            {canCreateQuotations() && (
              <Button variant="outline" onClick={handleCreateQuotation}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Создать предложение
              </Button>
            )}
            {canEditRFQ() && (
              <Button onClick={() => setIsAddItemModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить позицию
              </Button>
            )}
          </div>
        </div>

        {/* Мобильная версия */}
        <div className="flex md:hidden flex-col gap-3 w-full">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" asChild>
              <Link to="/rfq">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Badge variant={statusColors[rfq.status]} className="text-xs">
              {statusLabels[rfq.status]}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h1 className="text-lg font-semibold truncate">{rfq.number}</h1>
          </div>

          <div className="flex flex-col gap-2">
            {(canEditRFQ() || canCreateQuotations()) && (
              <div className="flex items-center gap-2">
                {canEditRFQ() && (
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-2" />
                    Редактировать
                  </Button>
                )}
                {canEditRFQ() && (
                  <Button onClick={() => setIsAddItemModalOpen(true)} size="sm" className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить
                  </Button>
                )}
                {!canEditRFQ() && canCreateQuotations() && (
                  <Button onClick={handleCreateQuotation} size="sm" className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Создать предложение
                  </Button>
                )}
              </div>
            )}
            {canEditRFQ() && canCreateQuotations() && (
              <Button onClick={handleCreateQuotation} size="sm" className="w-full">
                <MessageCircle className="h-4 w-4 mr-2" />
                Создать предложение
              </Button>
            )}
          </div>
        </div>
      </Header>

      <main className="flex-1 p-4 md:p-6">
        <div className="space-y-4 md:space-y-6">
          {/* Горячие клавиши для быстрой работы */}
          <RFQKeyboardShortcuts
            onCreateQuotation={getTotalProposalsCount() > 0 ? handleCreateQuotation : undefined}
            onAddItem={() => setIsAddItemModalOpen(true)}
            onRefresh={() => window.location.reload()}
            enabled={true}
          />

          {/* Основная информация */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg md:text-xl">{rfq.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {rfq.description && (
                  <div>
                    <h4 className="font-medium mb-2">Описание</h4>
                    <p className="text-muted-foreground">{rfq.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-sm">Приоритет</h4>
                    <Badge variant={priorityColors[rfq.priority]} className="text-xs">
                      {priorityLabels[rfq.priority]}
                    </Badge>
                  </div>
                  
                  {rfq.deadline && (
                    <div>
                      <h4 className="font-medium mb-2 text-sm">Крайний срок</h4>
                      <div className="flex items-center gap-2 text-xs md:text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="break-all">{formatDate(rfq.deadline)}</span>
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
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="h-5 w-5" />
                  <span className="hidden sm:inline">Информация о заказчике</span>
                  <span className="sm:hidden">Заказчик</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                <div>
                  <h4 className="font-medium mb-2 text-sm">Компания</h4>
                  <p className="text-muted-foreground text-sm break-words">{rfq.company_name}</p>
                </div>
                
                {rfq.contact_person_name && (
                  <div>
                    <h4 className="font-medium mb-2 text-sm">Контактное лицо</h4>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm break-words">{rfq.contact_person_name}</span>
                    </div>
                  </div>
                )}

                {rfq.sales_manager_name && (
                  <div>
                    <h4 className="font-medium mb-2 text-sm">Sales менеджер</h4>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm break-words">{rfq.sales_manager_name}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1 text-xs md:text-sm text-muted-foreground">
                  <div className="break-all">Создан: {formatDate(rfq.created_at)}</div>
                  <div className="break-all">Обновлен: {formatDate(rfq.updated_at)}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ультра-эргономичная таблица для работы с ценами */}
          <UltraRFQTable
            rfqItems={rfq.items || []}
            proposals={proposals}
            currencies={currencies}
            selectedCurrency={selectedCurrency}
            onCurrencyChange={setSelectedCurrency}
            onAddProposal={addProposal}
            onUpdateProposal={updateProposal}
            onRemoveProposal={removeProposal}
            onCreateQuotation={handleCreateQuotation}
            isLoading={false}
          />

          {/* Табы с дополнительной информацией */}
          <Tabs defaultValue="quotations" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="quotations" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">История котировок</span>
                <span className="sm:hidden">Котировки</span>
                ({quotations?.length || 0})
              </TabsTrigger>
            </TabsList>



            <TabsContent value="quotations" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Котировки</CardTitle>
                    {canCreateQuotations() && (
                      <Button onClick={handleFullCreateQuotation} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Создать котировку
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!quotations?.length || !Array.isArray(quotations) ? (
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
                                <div>{quotation.currency_details?.code || '—'}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Сумма:</span>
                                <div className="font-medium">
                                  {quotation.total_amount} {quotation.currency_details?.symbol || ''}
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

      {/* Модальное окно для добавления позиции */}
      <AddRFQItemModal
        open={isAddItemModalOpen}
        onOpenChange={setIsAddItemModalOpen}
        rfqId={rfqId}
        nextLineNumber={getNextLineNumber()}
      />

      {/* Модальное окно для загрузки файлов */}
      {fileUploadState.rfqItemId && (
        <FileUpload
          rfqItemId={fileUploadState.rfqItemId}
          files={fileUploadState.files || []}
          open={fileUploadState.open}
          onOpenChange={(open) => setFileUploadState(prev => ({ ...prev, open }))}
        />
      )}

      {/* Модальное окно для быстрого создания котировки */}
      <QuickQuotationModal
        open={isQuickQuotationModalOpen}
        onOpenChange={setIsQuickQuotationModalOpen}
        rfq={rfq}
        proposals={exportProposals()}
        currencies={currencies}
        onSubmit={handleQuickQuotationSubmit}
        isLoading={createFullQuotation.isPending}
      />
    </div>
  )
} 