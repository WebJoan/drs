import { createFileRoute } from '@tanstack/react-router'
import Products from '@/features/goods'

export const Route = createFileRoute('/_authenticated/goods/')({
  component: Products,
}) 