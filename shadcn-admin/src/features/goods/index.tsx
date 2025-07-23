import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, RefreshCw, AlertCircle, Package, Search as SearchIcon } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { columns } from './components/products-columns'
import { ProductsDialogs } from './components/products-dialogs'
import { ProductsPrimaryButtons } from './components/products-primary-buttons'
import { ProductsTable } from './components/products-table'

import ProductsProvider from './context/products-context'
import { useState, useEffect } from 'react'

export default function Products() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showSearchLoader, setShowSearchLoader] = useState(false)

  // Дебаунс для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])
  
  const { data: productsResponse, isLoading, error, refetch, isRefetching } = useProducts(page, pageSize, debouncedSearch)

  // Управление индикатором загрузки поиска
  useEffect(() => {
    if (isRefetching && debouncedSearch) {
      const timer = setTimeout(() => {
        setShowSearchLoader(true)
      }, 100) // Показываем лоадер только если запрос длится больше 100мс

      return () => clearTimeout(timer)
    } else {
      setShowSearchLoader(false)
    }
  }, [isRefetching, debouncedSearch])

  const handleRefresh = () => {
    refetch()
  }



  // Показываем полноэкранный спиннер только при первоначальной загрузке без данных
  if (isLoading && !productsResponse) {
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
                  {productsResponse?.results?.length ? (
                    `Управление ${productsResponse.count} товарами (показано ${productsResponse.results.length} из ${productsResponse.count})`
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
          {/* Поисковая строка всегда видна */}
          <div className="flex items-center py-4">
            <div className="relative flex-1 max-w-sm">
              {showSearchLoader ? (
                <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
              ) : (
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              )}
              <Input
                placeholder="Поиск товаров..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1) // Сброс на первую страницу при поиске
                }}
                className="pl-10"
              />
            </div>
          </div>

          {productsResponse?.results && productsResponse.results.length > 0 ? (
            <ProductsTable 
              data={productsResponse.results} 
              columns={columns}
              pagination={{
                page,
                pageSize,
                total: productsResponse.count,
                totalPages: productsResponse.total_pages,
                onPageChange: (newPage) => {
                  setPage(newPage)
                },
                onPageSizeChange: (newPageSize) => {
                  setPageSize(newPageSize)
                  setPage(1) // Сброс на первую страницу при изменении размера
                }
              }}
              hideSearch={true} // Скрываем поисковую строку в таблице
            />
          ) : (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <Package className='h-12 w-12 text-muted-foreground mb-4' />
              <h3 className='text-lg font-semibold mb-2'>
                {search ? 'Товары не найдены' : 'Нет товаров'}
              </h3>
              <p className='text-muted-foreground mb-4 max-w-sm'>
                {search 
                  ? `По запросу "${search}" товары не найдены. Попробуйте изменить поисковый запрос.`
                  : 'Товары не найдены. Создайте первый товар, чтобы начать работу.'
                }
              </p>
              <ProductsPrimaryButtons />
            </div>
          )}
        </div>
      </Main>

      <ProductsDialogs />
    </ProductsProvider>
  )
} 