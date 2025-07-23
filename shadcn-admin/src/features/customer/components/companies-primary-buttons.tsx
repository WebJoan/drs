import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useCompaniesContext } from '../context/companies-context'

export function CompaniesPrimaryButtons() {
  const { setIsCreateDialogOpen } = useCompaniesContext()

  return (
    <Button
      onClick={() => setIsCreateDialogOpen(true)}
      className="gap-2 w-full sm:w-auto"
    >
      <Plus className="h-4 w-4" />
      <span className="hidden sm:inline">Добавить компанию</span>
      <span className="sm:hidden">Добавить</span>
    </Button>
  )
} 