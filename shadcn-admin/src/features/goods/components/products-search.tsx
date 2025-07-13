import { useState, useEffect } from 'react'
import { Search, X, Filter, Loader2, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useProductsSearch } from '@/hooks/useProducts'
import { useBrands, useProductSubgroups, useProductGroups } from '@/hooks/useProducts'

interface ProductSearchProps {
  onProductSelect?: (product: any) => void
  onClearSearch?: () => void
  className?: string
}

export const ProductsSearch = ({ onProductSelect, onClearSearch, className }: ProductSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [selectedSubgroup, setSelectedSubgroup] = useState<string>('')
  const [selectedGroup, setSelectedGroup] = useState<string>('')

  // Дебаунс для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Хуки для получения данных
  const { data: brands } = useBrands()
  const { data: subgroups } = useProductSubgroups()
  const { data: groups } = useProductGroups()

  // Поиск товаров
  const { 
    data: searchResults, 
    isLoading, 
    error, 
    isFetching 
  } = useProductsSearch({
    query: debouncedQuery,
    brandId: selectedBrand ? parseInt(selectedBrand) : undefined,
    subgroupId: selectedSubgroup ? parseInt(selectedSubgroup) : undefined,
    groupId: selectedGroup ? parseInt(selectedGroup) : undefined,
    limit: 20
  })

  const handleClearSearch = () => {
    setSearchQuery('')
    setDebouncedQuery('')
    setSelectedBrand('')
    setSelectedSubgroup('')
    setSelectedGroup('')
    onClearSearch?.()
  }

  const handleProductClick = (product: any) => {
    onProductSelect?.(product)
  }

  const hasActiveFilters = selectedBrand || selectedSubgroup || selectedGroup

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Строка поиска */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск товаров..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="flex items-center space-x-2"
        >
          <Filter className="h-4 w-4" />
          <span>Фильтры</span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1">
              {[selectedBrand, selectedSubgroup, selectedGroup].filter(Boolean).length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Фильтры */}
      {isFiltersOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Фильтры поиска</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Бренд</label>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите бренд" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Все бренды</SelectItem>
                    {brands?.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id.toString()}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Подгруппа</label>
                <Select value={selectedSubgroup} onValueChange={setSelectedSubgroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите подгруппу" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Все подгруппы</SelectItem>
                    {subgroups?.map((subgroup) => (
                      <SelectItem key={subgroup.id} value={subgroup.id.toString()}>
                        {subgroup.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Группа</label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите группу" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Все группы</SelectItem>
                    {groups?.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedBrand('')
                    setSelectedSubgroup('')
                    setSelectedGroup('')
                  }}
                >
                  Сбросить фильтры
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Результаты поиска */}
      {debouncedQuery && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Результаты поиска</CardTitle>
              {isFetching && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Поиск...</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="flex items-center space-x-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error.message}</span>
              </div>
            )}

            {!isLoading && !error && searchResults && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">
                    Найдено {searchResults.total} товаров
                  </span>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{searchResults.processing_time}мс</span>
                  </div>
                </div>

                {searchResults.results.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.results.map((product) => (
                      <div
                        key={product.id}
                        className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleProductClick(product)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 
                              className="font-medium"
                              dangerouslySetInnerHTML={{ 
                                __html: product._formatted?.name || product.name 
                              }}
                            />
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                              {product.brand_name && (
                                <span 
                                  dangerouslySetInnerHTML={{ 
                                    __html: product._formatted?.brand_name || product.brand_name 
                                  }}
                                />
                              )}
                              {product.brand_name && product.subgroup_name && (
                                <span>•</span>
                              )}
                              {product.subgroup_name && (
                                <span 
                                  dangerouslySetInnerHTML={{ 
                                    __html: product._formatted?.subgroup_name || product.subgroup_name 
                                  }}
                                />
                              )}
                              {product.subgroup_name && product.group_name && (
                                <span>•</span>
                              )}
                              {product.group_name && (
                                <span>{product.group_name}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID: {product.id}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Товары не найдены</p>
                    <p className="text-sm">Попробуйте изменить параметры поиска</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 