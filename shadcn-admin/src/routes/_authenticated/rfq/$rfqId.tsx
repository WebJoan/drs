import { createFileRoute } from '@tanstack/react-router'
import { RFQDetailPage } from '@/features/rfq/pages/RFQDetailPage'

export const Route = createFileRoute('/_authenticated/rfq/$rfqId')({
  component: RFQDetailPage,
  parseParams: ({ rfqId }) => ({ rfqId: Number(rfqId) }),
}) 