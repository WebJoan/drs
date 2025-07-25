import { createFileRoute } from '@tanstack/react-router'
import { QuotationListPage } from '@/features/rfq/pages/QuotationListPage'

export const Route = createFileRoute('/_authenticated/rfq/quotations')({
  component: QuotationListPage,
}) 