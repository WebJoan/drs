import { createFileRoute } from '@tanstack/react-router'
import Companies from '@/features/customer'

export const Route = createFileRoute('/_authenticated/customers/')({
  component: Companies,
}) 