import { createFileRoute } from '@tanstack/react-router'
import { RFQListPage } from '@/features/rfq/pages/RFQListPage'

export const Route = createFileRoute('/_authenticated/rfq/')({
  component: RFQListPage,
}) 