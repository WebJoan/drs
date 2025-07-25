import { useState } from 'react'
import { Search, Filter, ShoppingCart, Package, Info } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { type Product } from '@/lib/types'

export function ProductCatalogPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const pageSize = 20

  const { data, isLoading, error } = useProducts(page, pageSize, search)

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
          {/* Фильтры и поиск */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Поиск товаров</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по названию, бренду, артикулу..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Фильтры
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Таблица товаров */}
          <Card>
            <CardHeader>
              <CardTitle>
                Товары {data && `(${data.count})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-destructive">
                  Ошибка загрузки: {error.message}
                </div>
              ) : !data?.results?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  Товары не найдены
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Название</TableHead>
                        <TableHead>Бренд</TableHead>
                        <TableHead>Подгруппа</TableHead>
                        <TableHead>Product менеджер</TableHead>
                        <TableHead>Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.results.map((product: Product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  ID: {product.id}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {product.brand ? (
                              <Badge variant="outline">{product.brand.name}</Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.subgroup.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {product.subgroup.group.name}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {product.product_manager ? (
                              <div className="text-sm">
                                {product.product_manager.first_name} {product.product_manager.last_name}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Info className="h-4 w-4 mr-2" />
                                  Подробнее
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>{product.name}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-medium mb-2">Основная информация</h4>
                                      <div className="space-y-2 text-sm">
                                        <div><span className="font-medium">ID:</span> {product.id}</div>
                                        <div><span className="font-medium">Название:</span> {product.name}</div>
                                        <div><span className="font-medium">Ext ID:</span> {product.ext_id}</div>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-medium mb-2">Категория</h4>
                                      <div className="space-y-2 text-sm">
                                        <div><span className="font-medium">Группа:</span> {product.subgroup.group.name}</div>
                                        <div><span className="font-medium">Подгруппа:</span> {product.subgroup.name}</div>
                                        <div><span className="font-medium">Бренд:</span> {product.brand?.name || '—'}</div>
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Ответственные</h4>
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <span className="font-medium">Product менеджер:</span>{' '}
                                        {product.product_manager ? 
                                          `${product.product_manager.first_name} ${product.product_manager.last_name}` : 
                                          '—'
                                        }
                                      </div>
                                      <div>
                                        <span className="font-medium">Ответственный менеджер:</span>{' '}
                                        {product.responsible_manager ? 
                                          `${product.responsible_manager.first_name} ${product.responsible_manager.last_name}` : 
                                          '—'
                                        }
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Пагинация */}
                  {data.total_pages > 1 && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Показано {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, data.count)} из {data.count}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!data.previous}
                          onClick={() => setPage(page - 1)}
                        >
                          Назад
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!data.next}
                          onClick={() => setPage(page + 1)}
                        >
                          Далее
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 