import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useProductsContext } from '../context/products-context'
import { usePermissions } from '@/contexts/RoleContext'

export function ProductsPrimaryButtons() {
  const { setIsCreateDialogOpen } = useProductsContext()
  const { canCreateProducts } = usePermissions()

  // Если пользователь не может создавать товары, не показываем кнопку
  if (!canCreateProducts()) {
    return null
  }

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