import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, AlertCircle, Package } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { columns } from './components/products-columns'
import { ProductsDialogs } from './components/products-dialogs'
import { ProductsPrimaryButtons } from './components/products-primary-buttons'
import { ProductsTable } from './components/products-table'
import { ProductsSearch } from './components/products-search'
import ProductsProvider from './context/products-context'
import { useState } from 'react'

export default function Products() {
  const { data: products, isLoading, error, refetch, isRefetching } = useProducts()
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  const handleRefresh = () => {
    refetch()
  }

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product)
    // Можно добавить дополнительную логику, например, открыть модальное окно с деталями
  }

  const handleClearSearch = () => {
    setIsSearchMode(false)
    setSelectedProduct(null)
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <Loader2 className='h-12 w-12 animate-spin mx-auto mb-4 text-primary' />
          <h2 className='text-lg font-semibold mb-2'>Загрузка товаров...</h2>
          <p className='text-sm text-muted-foreground'>
            Пожалуйста, подождите, данные загружаются
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center max-w-md'>
          <AlertCircle className='h-12 w-12 mx-auto mb-4 text-destructive' />
          <h2 className='text-xl font-bold text-destructive mb-2'>Ошибка загрузки</h2>
          <p className='text-muted-foreground mb-4'>
            {error.message || 'Не удалось загрузить список товаров. Проверьте подключение к интернету и попробуйте снова.'}
          </p>
          <Button onClick={handleRefresh} variant='outline' className='gap-2'>
            <RefreshCw className='h-4 w-4' />
            Повторить попытку
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ProductsProvider>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-6'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div className='flex items-center space-x-2'>
              <Package className='h-8 w-8 text-primary' />
              <div>
                <h1 className='text-3xl font-bold tracking-tight'>Товары</h1>
                <p className='text-muted-foreground mt-1'>
                  {products?.length ? (
                    `Управление ${products.length} товарами и их характеристиками`
                  ) : (
                    'Управление товарами и их характеристиками'
                  )}
                </p>
              </div>
            </div>
            <div className='flex flex-wrap items-center gap-2 sm:space-x-2'>
              <Button
                onClick={handleRefresh}
                variant='outline'
                size='sm'
                disabled={isRefetching}
                className='gap-2'
              >
                <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                {isRefetching ? 'Обновление...' : 'Обновить'}
              </Button>
              <ProductsPrimaryButtons />
            </div>
          </div>
        </div>

        <div className='space-y-4'>
          {/* Переключатель режимов */}
          <div className='flex items-center space-x-4 mb-6'>
            <Button
              variant={!isSearchMode ? 'default' : 'outline'}
              size='sm'
              onClick={() => setIsSearchMode(false)}
            >
              Все товары
            </Button>
            <Button
              variant={isSearchMode ? 'default' : 'outline'}
              size='sm'
              onClick={() => setIsSearchMode(true)}
            >
              Поиск MeiliSearch
            </Button>
          </div>

          {isSearchMode ? (
            <ProductsSearch 
              onProductSelect={handleProductSelect}
              onClearSearch={handleClearSearch}
            />
          ) : (
            <>
              {products && products.length > 0 ? (
                <ProductsTable data={products} columns={columns} />
              ) : (
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                  <Package className='h-12 w-12 text-muted-foreground mb-4' />
                  <h3 className='text-lg font-semibold mb-2'>Нет товаров</h3>
                  <p className='text-muted-foreground mb-4 max-w-sm'>
                    Товары не найдены. Создайте первый товар, чтобы начать работу.
                  </p>
                  <ProductsPrimaryButtons />
                </div>
              )}
            </>
          )}
        </div>
      </Main>

      <ProductsDialogs />
    </ProductsProvider>
  )
} 