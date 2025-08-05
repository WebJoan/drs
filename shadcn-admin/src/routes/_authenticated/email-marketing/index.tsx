import { createFileRoute } from '@tanstack/react-router'
import { EmailMarketingPage } from '@/features/email-marketing'

export const Route = createFileRoute('/_authenticated/email-marketing/')({
  component: EmailMarketingPage,
})