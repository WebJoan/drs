import { createFileRoute } from '@tanstack/react-router'
import { CreateQuotationPage } from '@/features/rfq/pages/CreateQuotationPage'
import { z } from 'zod'

const quotationCreateSearchSchema = z.object({
  rfqId: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/rfq/quotations/create')({
  component: CreateQuotationPage,
  validateSearch: quotationCreateSearchSchema,
}) 