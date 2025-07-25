import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useProducts } from '@/hooks/useProducts'
import type { Product } from '@/lib/types'

interface ProductSearchSelectProps {
  value?: number
  onSelect: (product: Product | null) => void
  placeholder?: string
  disabled?: boolean
}

export function ProductSearchSelect({
  value,
  onSelect,
  placeholder = "Выберите товар из базы...",
  disabled = false
}: ProductSearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  const { data: productsResponse, isLoading } = useProducts(1, 50, search)
  const products = productsResponse?.results || []

  useEffect(() => {
    if (value && products.length > 0) {
      const product = products.find((p: Product) => p.id === value)
      setSelectedProduct(product || null)
    } else {
      setSelectedProduct(null)
    }
  }, [value, products])

  const handleSelect = (product: Product) => {
    setSelectedProduct(product)
    onSelect(product)
    setOpen(false)
  }

  const handleClear = () => {
    setSelectedProduct(null)
    onSelect(null)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedProduct ? (
            <div className="flex flex-col items-start">
              <span className="font-medium">{selectedProduct.name}</span>
              <span className="text-xs text-muted-foreground">
                {selectedProduct.subgroup.name} 
                {selectedProduct.brand && ` • ${selectedProduct.brand.name}`}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[300px] p-0">
        <Command>
          <CommandInput 
            placeholder="Поиск товара..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Загрузка..." : "Товары не найдены"}
            </CommandEmpty>
            <CommandGroup>
              {selectedProduct && (
                <CommandItem
                  value="clear"
                  onSelect={handleClear}
                  className="text-muted-foreground"
                >
                  Очистить выбор
                </CommandItem>
              )}
              {products.map((product: Product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => handleSelect(product)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedProduct?.id === product.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {product.subgroup.name}
                      {product.brand && ` • ${product.brand.name}`}
                      {product.responsible_manager && ` • ${product.responsible_manager.first_name} ${product.responsible_manager.last_name}`}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 