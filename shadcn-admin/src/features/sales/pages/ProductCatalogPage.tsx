import { useState, useEffect } from 'react'
import { ShoppingCart, Package, Loader2, AlertCircle } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { UniversalDataTable } from '@/components/ui/universal-data-table'
import { columns } from '../components/product-catalog-columns'

export function ProductCatalogPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
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

  const { data, isLoading, error, refetch, isRefetching } = useProducts(page, pageSize, debouncedSearch)

  // Управление индикатором загрузки поиска
  useEffect(() => {
    if (isRefetching && debouncedSearch) {
      const timer = setTimeout(() => {
        setShowSearchLoader(true)
      }, 100)

      return () => clearTimeout(timer)
    } else {
      setShowSearchLoader(false)
    }
  }, [isRefetching, debouncedSearch])

  // Показываем полноэкранный спиннер только при первоначальной загрузке без данных
  if (isLoading && !data) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <Loader2 className='h-12 w-12 animate-spin mx-auto mb-4 text-primary' />
          <h2 className='text-lg font-semibold mb-2'>Загрузка каталога товаров...</h2>
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
            {error.message || 'Не удалось загрузить каталог товаров. Проверьте подключение к интернету и попробуйте снова.'}
          </p>
          <Button onClick={() => refetch()} variant='outline' className='gap-2'>
            <AlertCircle className='h-4 w-4' />
            Повторить попытку
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header className="sticky top-0 z-10">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Каталог товаров</h1>
          </div>
        </div>
      </Header>

      <main className="flex-1 p-6">
        <div className="space-y-6">
          {/* Информация о каталоге */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Каталог товаров
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {data?.results?.length ? (
                  `Найдено ${data.count} товаров (показано ${data.results.length} из ${data.count})`
                ) : (
                  'Просматривайте и ищите товары в каталоге'
                )}
              </p>
            </CardContent>
          </Card>

          {/* Таблица товаров */}
          <Card>
            <CardContent className="p-6">
              {data?.results && data.results.length > 0 ? (
                <UniversalDataTable 
                  data={data.results} 
                  columns={columns}
                  enableRowSelection={false}
                  enableSorting={true}
                  enableColumnVisibility={true}
                  enableFiltering={true}
                  pagination={{ 
                    type: 'external',
                    config: {
                      page,
                      pageSize,
                      total: data.count,
                      totalPages: data.total_pages,
                      onPageChange: (newPage: number) => {
                        setPage(newPage)
                      },
                      onPageSizeChange: (newPageSize: number) => {
                        setPageSize(newPageSize)
                        setPage(1)
                      }
                    },
                    showRowsSelected: false
                  }}
                  search={{
                    enabled: true,
                    placeholder: 'Поиск по названию, бренду, артикулу...',
                    value: search,
                    onChange: (value: string) => {
                      setSearch(value)
                      setPage(1)
                    },
                    isSearching: showSearchLoader
                  }}
                  emptyMessage="Товары не найдены."
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
                      : 'Товары не найдены в каталоге.'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 