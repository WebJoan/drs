import { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Keyboard, 
  Zap, 
  Save, 
  ArrowRight, 
  ArrowDown, 
  ArrowUp,
  Plus,
  X,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'

interface RFQKeyboardShortcutsProps {
  onCreateQuotation?: () => void
  onAddItem?: () => void
  onRefresh?: () => void
  enabled?: boolean
}

export function RFQKeyboardShortcuts({
  onCreateQuotation,
  onAddItem,
  onRefresh,
  enabled = true
}: RFQKeyboardShortcutsProps) {
  
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Игнорируем если фокус на инпуте
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') {
        return
      }
      
      // Ctrl/Cmd + Enter - создать котировку
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        onCreateQuotation?.()
        toast.success('Горячая клавиша: Создание котировки')
        return
      }
      
      // Ctrl/Cmd + N - добавить позицию
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        onAddItem?.()
        toast.success('Горячая клавиша: Добавление позиции')
        return
      }
      
      // F5 или Ctrl/Cmd + R - обновить
      if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key === 'r')) {
        e.preventDefault()
        onRefresh?.()
        toast.success('Горячая клавиша: Обновление')
        return
      }
      
      // ? - показать помощь
      if (e.key === '?' && !e.shiftKey) {
        e.preventDefault()
        showKeyboardHelp()
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled, onCreateQuotation, onAddItem, onRefresh])

  const showKeyboardHelp = () => {
    toast.info(
      <div className="space-y-2">
        <div className="font-semibold">Горячие клавиши:</div>
        <div className="space-y-1 text-xs">
          <div>Ctrl+Enter - Создать котировку</div>
          <div>Ctrl+N - Добавить позицию</div>
          <div>F5 - Обновить</div>
          <div>Tab - Следующая ячейка</div>
          <div>Enter - Сохранить изменения</div>
          <div>Escape - Отменить изменения</div>
        </div>
      </div>,
      { duration: 5000 }
    )
  }

  return (
    <Card className="border-dashed bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Супер-быстрая работа</span>
          </div>
          <button
            onClick={showKeyboardHelp}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Нажмите ? для помощи
          </button>
        </div>
        
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="flex items-center gap-1 text-xs">
            <Badge variant="outline" className="text-xs px-1 py-0">Ctrl</Badge>
            <span>+</span>
            <Badge variant="outline" className="text-xs px-1 py-0">Enter</Badge>
            <ArrowRight className="h-3 w-3 ml-1 text-green-500" />
          </div>
          
          <div className="flex items-center gap-1 text-xs">
            <Badge variant="outline" className="text-xs px-1 py-0">Ctrl</Badge>
            <span>+</span>
            <Badge variant="outline" className="text-xs px-1 py-0">N</Badge>
            <Plus className="h-3 w-3 ml-1 text-blue-500" />
          </div>
          
          <div className="flex items-center gap-1 text-xs">
            <Badge variant="outline" className="text-xs px-1 py-0">Enter</Badge>
            <Save className="h-3 w-3 ml-1 text-green-500" />
          </div>
          
          <div className="flex items-center gap-1 text-xs">
            <Badge variant="outline" className="text-xs px-1 py-0">Esc</Badge>
            <X className="h-3 w-3 ml-1 text-red-500" />
          </div>
        </div>

        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Zap className="h-3 w-3" />
          <span>Клик для редактирования • Tab для навигации • Двойной клик для быстрого заполнения</span>
        </div>
      </CardContent>
    </Card>
  )
} 