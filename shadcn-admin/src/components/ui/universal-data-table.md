# UniversalDataTable

Универсальный компонент таблицы, объединяющий все лучшие практики из существующих таблиц проекта.

## Возможности

- ✅ Сортировка столбцов
- ✅ Фильтрация данных  
- ✅ Выбор строк (single/multi)
- ✅ Скрытие/показ столбцов
- ✅ Пагинация (внутренняя и внешняя)
- ✅ Поиск с индикатором загрузки
- ✅ Массовые действия
- ✅ Кастомные тулбары
- ✅ Адаптивный дизайн
- ✅ TypeScript поддержка

## Базовое использование

```tsx
import { UniversalDataTable } from '@/components/ui/universal-data-table'

<UniversalDataTable 
  data={users} 
  columns={columns}
  enableRowSelection={true}
  enableSorting={true}
  enableColumnVisibility={true}
  pagination={{ type: 'internal' }}
/>
```

## Примеры использования

### 1. Простая таблица (как в Tasks)

```tsx
<UniversalDataTable 
  data={tasks} 
  columns={columns}
  enableRowSelection={true}
  enableSorting={true}
  enableColumnVisibility={true}
  enableFiltering={true}
  pagination={{ type: 'internal' }}
  emptyMessage="No results."
/>
```

### 2. Таблица с внешней пагинацией и поиском (как в Products)

```tsx
<UniversalDataTable 
  data={products} 
  columns={columns}
  enableRowSelection={true}
  pagination={{ 
    type: 'external',
    config: {
      page,
      pageSize,
      total: productsResponse.count,
      totalPages: productsResponse.total_pages,
      onPageChange: (newPage: number) => setPage(newPage),
      onPageSizeChange: (newPageSize: number) => {
        setPageSize(newPageSize)
        setPage(1)
      }
    },
    showRowsSelected: true
  }}
  search={{
    enabled: true,
    placeholder: 'Поиск товаров...',
    value: search,
    onChange: (value: string) => {
      setSearch(value)
      setPage(1)
    },
    isSearching: isSearching
  }}
  bulkActions={{
    enabled: true,
    getSelectedItems: (selectedRows) => {
      // Обработка выбранных строк
    },
    actions: [
      {
        label: 'Удалить выбранные',
        variant: 'destructive',
        onClick: (selectedRows) => {
          // Логика удаления
        }
      }
    ]
  }}
/>
```

### 3. Таблица с синхронизацией контекста (как в Users)

```tsx
<UniversalDataTable 
  data={users} 
  columns={columns}
  enableRowSelection={true}
  pagination={{ type: 'internal' }}
  onRowSelectionChange={(selectedRows) => {
    // Синхронизация с контекстом
    setSelectedUsers(selectedRows)
  }}
/>
```

### 4. Таблица с кастомным тулбаром

```tsx
<UniversalDataTable 
  data={data} 
  columns={columns}
  toolbar={{
    enabled: true,
    renderToolbar: (table) => (
      <div className="flex items-center justify-between">
        <CustomSearch />
        <CustomActions table={table} />
      </div>
    )
  }}
/>
```

## API Reference

### Основные пропсы

| Prop | Type | Default | Описание |
|------|------|---------|----------|
| `columns` | `ColumnDef<TData, TValue>[]` | - | Конфигурация столбцов |
| `data` | `TData[]` | - | Данные для отображения |
| `enableRowSelection` | `boolean` | `true` | Включить выбор строк |
| `enableSorting` | `boolean` | `true` | Включить сортировку |
| `enableColumnVisibility` | `boolean` | `true` | Включить скрытие столбцов |
| `enableFiltering` | `boolean` | `true` | Включить фильтрацию |

### Пагинация

```tsx
pagination?: {
  type: 'internal' | 'external'
  config?: ExternalPagination  // Только для external
  pageSizeOptions?: number[]   // Опции размера страницы
  showRowsSelected?: boolean   // Показывать количество выбранных
}
```

### Поиск

```tsx
search?: {
  enabled: boolean
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  isSearching?: boolean  // Индикатор загрузки
}
```

### Массовые действия

```tsx
bulkActions?: {
  enabled: boolean
  getSelectedItems: (selectedRows: TData[]) => void
  actions?: {
    label: string
    variant?: ButtonVariant
    onClick: (selectedRows: TData[]) => void
  }[]
}
```

### Кастомный тулбар

```tsx
toolbar?: {
  enabled: boolean
  renderToolbar?: (table: Table<TData>) => ReactNode
}
```

## Интеграция с контекстом

Компонент поддерживает синхронизацию с React Context через колбэки:

```tsx
onRowSelectionChange={(selectedRows) => {
  // Синхронизация выбранных строк с контекстом
}}

onSortingChange={(sorting) => {
  // Синхронизация сортировки
}}

onColumnFiltersChange={(filters) => {
  // Синхронизация фильтров
}}
```

## Стилизация

```tsx
// Кастомные CSS классы
className="custom-table-class"
containerClassName="custom-container-class"

// Кастомное сообщение об отсутствии данных
emptyMessage="Данные не найдены"
```

## Миграция с существующих таблиц

### Из DataTable (Tasks)
```tsx
// Старый код
<DataTable data={tasks} columns={columns} />

// Новый код  
<UniversalDataTable 
  data={tasks} 
  columns={columns}
  pagination={{ type: 'internal' }}
/>
```

### Из ProductsTable (Goods)
```tsx
// Старый код
<ProductsTable 
  data={products}
  columns={columns}
  pagination={...}
  onSearchChange={...}
  searchValue={...}
  isSearching={...}
/>

// Новый код
<UniversalDataTable 
  data={products}
  columns={columns}
  pagination={{ type: 'external', config: ... }}
  search={{ enabled: true, ... }}
  bulkActions={{ enabled: true, ... }}
/>
```

## TypeScript поддержка

Компонент полностью типизирован и экспортирует все необходимые типы:

```tsx
import { 
  UniversalDataTable,
  type UniversalDataTableProps,
  type ExternalPagination,
  type SearchConfig,
  type BulkActions,
  type ToolbarConfig
} from '@/components/ui/universal-data-table'
``` 