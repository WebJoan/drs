import { createFileRoute } from '@tanstack/react-router'
import { useRole } from '@/contexts/RoleContext'
import { UserRole } from '@/lib/types'
import Products from '@/features/goods'
import { ProductCatalogPage } from '@/features/sales/pages/ProductCatalogPage'

function GoodsPage() {
  const { currentInterfaceRole } = useRole()
  
  // Для sales менеджеров показываем каталог, для остальных - полный интерфейс управления
  if (currentInterfaceRole === UserRole.SALES_MANAGER) {
    return <ProductCatalogPage />
  }
  
  return <Products />
}

export const Route = createFileRoute('/_authenticated/goods/')({
  component: GoodsPage,
}) 