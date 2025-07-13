import React, { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export interface SearchableSelectItem {
  id: number
  name: string
  [key: string]: any
}

interface SearchableSelectProps {
  items: SearchableSelectItem[]
  value?: number
  onValueChange: (value: number | undefined) => void
  placeholder?: string
  label?: string
  searchPlaceholder?: string
  emptyText?: string
  onCreateNew?: (name: string) => Promise<void>
  createNewLabel?: string
  required?: boolean
  error?: string
  renderItem?: (item: SearchableSelectItem) => React.ReactNode
  loading?: boolean
}

export function SearchableSelect({
  items,
  value,
  onValueChange,
  placeholder = 'Выберите элемент...',
  label,
  searchPlaceholder = 'Поиск...',
  emptyText = 'Элементы не найдены',
  onCreateNew,
  createNewLabel = 'Создать новый',
  required = false,
  error,
  renderItem,
  loading = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newItemName, setNewItemName] = useState('')

  const selectedItem = items.find((item) => item.id === value)

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchValue.toLowerCase())
  )

  const handleCreateNew = async () => {
    if (newItemName.trim() && onCreateNew) {
      await onCreateNew(newItemName.trim())
      setNewItemName('')
      setIsCreateDialogOpen(false)
    }
  }

  const handleSelect = (itemId: number) => {
    onValueChange(itemId === value ? undefined : itemId)
    setOpen(false)
  }

  const handleClear = () => {
    onValueChange(undefined)
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label className={cn(required && 'after:content-["*"] after:ml-0.5 after:text-red-500')}>
          {label}
        </Label>
      )}
      <div className="relative">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                'w-full justify-between',
                !selectedItem && 'text-muted-foreground',
                error && 'border-red-500'
              )}
            >
              {selectedItem ? (
                renderItem ? renderItem(selectedItem) : selectedItem.name
              ) : (
                placeholder
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput
                placeholder={searchPlaceholder}
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                <CommandEmpty>
                  <div className="text-center p-4">
                    <p className="text-sm text-muted-foreground mb-4">{emptyText}</p>
                    {onCreateNew && searchValue && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setNewItemName(searchValue)
                          setIsCreateDialogOpen(true)
                          setOpen(false)
                        }}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        {createNewLabel}: "{searchValue}"
                      </Button>
                    )}
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {filteredItems.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.name}
                      onSelect={() => handleSelect(item.id)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === item.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {renderItem ? renderItem(item) : item.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
                {onCreateNew && (
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setIsCreateDialogOpen(true)
                        setOpen(false)
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {createNewLabel}
                    </CommandItem>
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {selectedItem && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-8 top-0 h-full px-2 hover:bg-transparent"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Диалог создания нового элемента */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{createNewLabel}</DialogTitle>
            <DialogDescription>
              Введите название нового элемента
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Название
              </Label>
              <Input
                id="name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="col-span-3"
                placeholder="Введите название..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateNew()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              type="button"
              onClick={handleCreateNew}
              disabled={!newItemName.trim()}
            >
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 