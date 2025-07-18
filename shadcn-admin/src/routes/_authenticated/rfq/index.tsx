import { createFileRoute } from '@tanstack/react-router'
import RFQManagement from '@/features/rfq'

export const Route = createFileRoute('/_authenticated/rfq/')({
  component: RFQManagement,
}) 