import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { Product } from '@/lib/types'
import { usePermissions } from '@/contexts/RoleContext'

interface ProductActionsProps {
  product: Product
}

export function ProductActions({ product }: ProductActionsProps) {
  const { canEditProducts, canDeleteProducts } = usePermissions()

  const handleEdit = () => {
    window.dispatchEvent(new CustomEvent('edit-product', { detail: product }))
  }

  const handleDelete = () => {
    window.dispatchEvent(new CustomEvent('delete-product', { detail: product }))
  }

  const hasEditPermission = canEditProducts()
  const hasDeletePermission = canDeleteProducts()

  // Если нет разрешений на редактирование и удаление, показываем только базовые действия
  if (!hasEditPermission && !hasDeletePermission) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Открыть меню</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Действия</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(product.id.toString())}
          >
            Копировать ID
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Открыть меню</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Действия</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(product.id.toString())}
        >
          Копировать ID
        </DropdownMenuItem>
        
        {(hasEditPermission || hasDeletePermission) && <DropdownMenuSeparator />}
        
        {hasEditPermission && (
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Редактировать
          </DropdownMenuItem>
        )}
        
        {hasDeletePermission && (
          <DropdownMenuItem onClick={handleDelete} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Удалить
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 