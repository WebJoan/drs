import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useProductsContext } from '../context/products-context'

export function ProductsPrimaryButtons() {
  const { setIsCreateDialogOpen } = useProductsContext()

  return (
    <Button
      onClick={() => setIsCreateDialogOpen(true)}
      className="gap-2"
    >
      <Plus className="h-4 w-4" />
      Добавить товар
    </Button>
  )
} 