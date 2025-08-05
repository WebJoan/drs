export { EmailMarketingPage } from './pages/EmailMarketingPage'
export { EmailDialogs } from './components/email-dialogs'
export { columns as emailColumns } from './components/email-columns'
export { EmailRowActions } from './components/email-row-actions'

export * from './types'
export * from './hooks/useEmailMarketing'
export { 
  useRecipients, 
  useSalesManagers, 
  useProducts,
  type RecipientPerson,
  type SalesManager,
  type Product
} from './hooks/useDataSelects'