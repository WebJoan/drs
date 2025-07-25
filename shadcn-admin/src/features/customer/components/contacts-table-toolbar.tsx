import { Cross2Icon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Contact } from '@/hooks/useContacts'
import { Download, Plus, Trash2 } from 'lucide-react'
import { useContactsContext } from '../context/contacts-context'

interface ContactsTableToolbarProps {
  table: Table<Contact>
  searchValue: string
  onSearchChange: (value: string) => void
  selectedContacts: Contact[]
}

export function ContactsTableToolbar({
  table,
  searchValue,
  onSearchChange,
  selectedContacts,
}: ContactsTableToolbarProps) {
  const isFiltered = table.getState().columnFilters.length > 0
  const { setIsCreateDialogOpen, setIsDeleteMultipleDialogOpen, setContactsToDelete } = useContactsContext()

  const handleExport = () => {
    // Создаем CSV данные из текущих строк таблицы
    const csvData = table.getFilteredRowModel().rows.map(row => {
      const contact = row.original
      return {
        'ФИО': contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
        'Email': contact.email,
        'Телефон': contact.phone || '',
        'Должность': contact.position || '',
        'Компания': contact.company_name || contact.company?.name || '',
        'Статус': contact.status,
        'Тип': contact.is_primary_contact ? 'Основной' : 'Обычный',
        'Дата добавления': new Date(contact.created_at).toLocaleDateString('ru-RU')
      }
    })

    // Конвертируем в CSV
    const headers = Object.keys(csvData[0] || {})
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(','))
    ].join('\n')

    // Скачиваем файл
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `contacts_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleDeleteSelected = () => {
    setContactsToDelete(selectedContacts)
    setIsDeleteMultipleDialogOpen(true)
  }

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        <Input
          placeholder='Поиск контактов...'
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          className='h-8 w-[150px] lg:w-[250px]'
        />
        {/* Фильтры временно отключены 
        <div className='flex gap-x-2'>
          Здесь будут фильтры когда исправим ошибки
        </div>
        */}
        {isFiltered && (
          <Button
            variant='ghost'
            onClick={() => table.resetColumnFilters()}
            className='h-8 px-2 lg:px-3'
          >
            Сбросить
            <Cross2Icon className='ml-2 h-4 w-4' />
          </Button>
        )}
      </div>
      
      <div className='flex items-center space-x-2'>
        {selectedContacts.length > 0 && (
          <Button
            variant='outline'
            size='sm'
            onClick={handleDeleteSelected}
            className='gap-2 text-destructive hover:text-destructive'
          >
            <Trash2 className='h-4 w-4' />
            Удалить ({selectedContacts.length})
          </Button>
        )}
        
        <Button
          variant='outline'
          size='sm'
          onClick={handleExport}
          className='gap-2'
          disabled={table.getFilteredRowModel().rows.length === 0}
        >
          <Download className='h-4 w-4' />
          Экспорт
        </Button>
        
        <Button
          size='sm'
          onClick={() => setIsCreateDialogOpen(true)}
          className='gap-2'
        >
          <Plus className='h-4 w-4' />
          Добавить
        </Button>
      </div>
    </div>
  )
} 