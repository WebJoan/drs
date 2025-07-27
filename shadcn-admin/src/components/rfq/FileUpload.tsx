import { useState, useRef } from 'react'
import { Upload, X, FileText, Image, File, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useUploadRFQItemFile } from '@/hooks/useRFQ'
import type { RFQItemFile } from '@/lib/types'

interface FileUploadProps {
  rfqItemId: number
  files: RFQItemFile[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const fileTypeLabels = {
  photo: 'Фотография',
  datasheet: 'Даташит',
  specification: 'Спецификация',
  drawing: 'Чертеж',
  other: 'Другое'
} as const

const fileTypeIcons = {
  photo: Image,
  datasheet: FileText,
  specification: File,
  drawing: FileText,
  other: File
} as const

export function FileUpload({ rfqItemId, files, open, onOpenChange }: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [fileType, setFileType] = useState<string>('other')
  const [description, setDescription] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { mutate: uploadFile, isPending } = useUploadRFQItemFile()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(prevFiles => [...prevFiles, ...files])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index))
  }

  const handleUpload = () => {
    if (selectedFiles.length === 0) return

    // Загружаем каждый файл отдельно
    selectedFiles.forEach(file => {
      uploadFile({
        rfqItemId,
        file,
        fileType,
        description
      })
    })

    // Очищаем форму после загрузки
    setSelectedFiles([])
    setDescription('')
    setFileType('other')
    onOpenChange(false)
  }

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} Б`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} КБ`
    return `${(size / (1024 * 1024)).toFixed(1)} МБ`
  }

  const getFileIcon = (type: string) => {
    const IconComponent = fileTypeIcons[type as keyof typeof fileTypeIcons] || File
    return <IconComponent className="h-4 w-4" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg">Загрузка файлов</DialogTitle>
          <DialogDescription className="text-sm">
            Добавьте файлы к позиции RFQ (фотографии, даташиты, спецификации и т.д.)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 md:space-y-6">
          {/* Существующие файлы */}
          {files.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Загруженные файлы</Label>
              <div className="mt-2 space-y-2">
                {files.map((file) => (
                  <Card key={file.id}>
                    <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {getFileIcon(file.file_type)}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">
                            {file.file.split('/').pop()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <Badge variant="outline" className="mr-2 text-xs">
                              {fileTypeLabels[file.file_type]}
                            </Badge>
                            {file.file_size && formatFileSize(file.file_size)}
                            {file.description && (
                              <div className="mt-1 truncate">{file.description}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-xs"
                      >
                        <a href={file.file_url || file.file} target="_blank" rel="noopener noreferrer">
                          Открыть
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Выбор типа файла */}
          <div className="space-y-2">
            <Label htmlFor="file-type">Тип файла</Label>
            <Select value={fileType} onValueChange={setFileType}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите тип файла" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="photo">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Фотография
                  </div>
                </SelectItem>
                <SelectItem value="datasheet">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Даташит
                  </div>
                </SelectItem>
                <SelectItem value="specification">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4" />
                    Спецификация
                  </div>
                </SelectItem>
                <SelectItem value="drawing">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Чертеж
                  </div>
                </SelectItem>
                <SelectItem value="other">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4" />
                    Другое
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Описание */}
          <div className="space-y-2">
            <Label htmlFor="description">Описание (необязательно)</Label>
            <Textarea
              id="description"
              placeholder="Краткое описание файла..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Выбор файлов */}
          <div className="space-y-2">
            <Label className="text-sm">Файлы для загрузки</Label>
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 md:p-6 cursor-pointer hover:border-muted-foreground/50 transition-colors touch-manipulation"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <Upload className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
                <div className="text-xs md:text-sm text-muted-foreground text-center">
                  <span className="font-medium">Нажмите для выбора файлов</span>
                  <br className="hidden sm:block" />
                  <span className="hidden sm:inline">или перетащите их сюда</span>
                </div>
              </div>
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.bmp,.tiff"
            />
          </div>

          {/* Выбранные файлы */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Выбранные файлы ({selectedFiles.length})</Label>
              <div className="space-y-2 max-h-32 md:max-h-40 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <Card key={index}>
                    <CardContent className="flex items-center justify-between p-3 gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <File className="h-4 w-4 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">{file.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-8 w-8 p-0 flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Предупреждение о размере файлов */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800 dark:text-blue-200">
              Максимальный размер файла: 10 МБ. Поддерживаемые форматы: PDF, Word, Excel, изображения.
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Отмена
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={selectedFiles.length === 0 || isPending}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            {isPending ? 'Загрузка...' : `Загрузить${selectedFiles.length > 0 ? ` (${selectedFiles.length})` : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 