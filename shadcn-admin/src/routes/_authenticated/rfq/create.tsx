import { createFileRoute } from '@tanstack/react-router'
import { CreateRFQPage } from '@/features/rfq/pages/CreateRFQPage'

export const Route = createFileRoute('/_authenticated/rfq/create')({
  component: CreateRFQPage,
}) 