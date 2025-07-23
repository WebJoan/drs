import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCompaniesContext } from '../context/companies-context'
import { 
  useCreateCompany, 
  useUpdateCompany, 
  useDeleteCompany
} from '@/hooks/useCompanies'
import { useEffect } from 'react'
import { CompanyCreateData } from '@/features/customer/types'
import { toast } from 'sonner'

const companySchema = z.object({
  name: z.string().min(1, 'Название компании обязательно'),
  short_name: z.string().optional(),
  company_type: z.enum(['manufacturer', 'distributor', 'integrator', 'end_user', 'other'], {
    required_error: 'Тип компании обязателен'
  }),
  status: z.enum(['active', 'potential', 'inactive', 'blacklist'], {
    required_error: 'Статус обязателен'
  }),
  inn: z.string().optional(),
  ogrn: z.string().optional(),
  legal_address: z.string().optional(),
  actual_address: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Неверный формат email').optional().or(z.literal('')),
  industry: z.string().optional(),
  annual_revenue: z.number().optional(),
  employees_count: z.number().optional(),
  notes: z.string().optional(),
  ext_id: z.string().optional(),
})

type CompanyFormData = z.infer<typeof companySchema>

export function CompaniesDialogs() {
  const {
    editingCompany,
    setEditingCompany,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    companyToDelete,
    setCompanyToDelete,
  } = useCompaniesContext()

  const createCompanyMutation = useCreateCompany()
  const updateCompanyMutation = useUpdateCompany()
  const deleteCompanyMutation = useDeleteCompany()

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      short_name: '',
      company_type: 'end_user',
      status: 'potential',
      inn: '',
      ogrn: '',
      legal_address: '',
      actual_address: '',
      website: '',
      phone: '',
      email: '',
      industry: '',
      notes: '',
      ext_id: '',
    },
  })

  // Сброс формы при открытии диалога создания
  useEffect(() => {
    if (isCreateDialogOpen) {
      form.reset({
        name: '',
        short_name: '',
        company_type: 'end_user',
        status: 'potential',
        inn: '',
        ogrn: '',
        legal_address: '',
        actual_address: '',
        website: '',
        phone: '',
        email: '',
        industry: '',
        notes: '',
        ext_id: '',
      })
    }
  }, [isCreateDialogOpen, form])

  // Заполнение формы при редактировании
  useEffect(() => {
    if (isEditDialogOpen && editingCompany) {
      form.reset({
        name: editingCompany.name,
        short_name: editingCompany.short_name || '',
        company_type: editingCompany.company_type,
        status: editingCompany.status,
        inn: editingCompany.inn || '',
        ogrn: editingCompany.ogrn || '',
        legal_address: editingCompany.legal_address || '',
        actual_address: editingCompany.actual_address || '',
        website: editingCompany.website || '',
        phone: editingCompany.phone || '',
        email: editingCompany.email || '',
        industry: editingCompany.industry || '',
        notes: editingCompany.notes || '',
        ext_id: editingCompany.ext_id || '',
      })
    }
  }, [isEditDialogOpen, editingCompany, form])

  const onSubmitCreate = async (data: CompanyFormData) => {
    try {
      const createData: CompanyCreateData = {
        ...data,
        annual_revenue: data.annual_revenue || undefined,
        employees_count: data.employees_count || undefined,
        email: data.email || undefined,
      }
      
      await createCompanyMutation.mutateAsync(createData)
      setIsCreateDialogOpen(false)
      toast.success('Компания успешно создана!')
    } catch (error) {
      toast.error('Ошибка при создании компании')
      console.error('Error creating company:', error)
    }
  }

  const onSubmitEdit = async (data: CompanyFormData) => {
    if (!editingCompany) return
    
    try {
      const updateData: CompanyCreateData = {
        ...data,
        annual_revenue: data.annual_revenue || undefined,
        employees_count: data.employees_count || undefined,
        email: data.email || undefined,
      }
      
      await updateCompanyMutation.mutateAsync({ 
        id: editingCompany.id, 
        data: updateData 
      })
      setIsEditDialogOpen(false)
      setEditingCompany(null)
      toast.success('Компания успешно обновлена!')
    } catch (error) {
      toast.error('Ошибка при обновлении компании')
      console.error('Error updating company:', error)
    }
  }

  const onDeleteConfirm = async () => {
    if (!companyToDelete) return
    
    try {
      await deleteCompanyMutation.mutateAsync(companyToDelete.id)
      setIsDeleteDialogOpen(false)
      setCompanyToDelete(null)
      toast.success('Компания успешно удалена!')
    } catch (error) {
      toast.error('Ошибка при удалении компании')
      console.error('Error deleting company:', error)
    }
  }

  const companyTypeOptions = [
    { value: 'manufacturer', label: 'Производитель' },
    { value: 'distributor', label: 'Дистрибьютор' },
    { value: 'integrator', label: 'Интегратор' },
    { value: 'end_user', label: 'Конечный пользователь' },
    { value: 'other', label: 'Другое' },
  ]

  const statusOptions = [
    { value: 'active', label: 'Активная' },
    { value: 'potential', label: 'Потенциальная' },
    { value: 'inactive', label: 'Неактивная' },
    { value: 'blacklist', label: 'Черный список' },
  ]

  return (
    <>
      {/* Диалог создания компании */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Добавить компанию</DialogTitle>
            <DialogDescription>
              Создайте новую компанию. Поля отмеченные * обязательны для заполнения.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название компании *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="ООО Рога и Копыта"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="short_name">Короткое название</Label>
                <Input
                  id="short_name"
                  {...form.register('short_name')}
                  placeholder="РиК"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Тип компании *</Label>
                <Select
                  value={form.watch('company_type')}
                  onValueChange={(value) => form.setValue('company_type', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    {companyTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.company_type && (
                  <p className="text-sm text-destructive">{form.formState.errors.company_type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Статус *</Label>
                <Select
                  value={form.watch('status')}
                  onValueChange={(value) => form.setValue('status', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.status && (
                  <p className="text-sm text-destructive">{form.formState.errors.status.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inn">ИНН</Label>
                <Input
                  id="inn"
                  {...form.register('inn')}
                  placeholder="1234567890"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ogrn">ОГРН</Label>
                <Input
                  id="ogrn"
                  {...form.register('ogrn')}
                  placeholder="1234567890123"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="legal_address">Юридический адрес</Label>
              <Input
                id="legal_address"
                {...form.register('legal_address')}
                placeholder="г. Москва, ул. Пушкина, д. 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actual_address">Фактический адрес</Label>
              <Input
                id="actual_address"
                {...form.register('actual_address')}
                placeholder="г. Москва, ул. Колотушкина, д. 2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  {...form.register('phone')}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  placeholder="info@company.ru"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Веб-сайт</Label>
                <Input
                  id="website"
                  {...form.register('website')}
                  placeholder="https://company.ru"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="industry">Отрасль</Label>
                <Input
                  id="industry"
                  {...form.register('industry')}
                  placeholder="Машиностроение"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Примечания</Label>
              <Textarea
                id="notes"
                {...form.register('notes')}
                placeholder="Дополнительная информация о компании"
                rows={3}
              />
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
                type="submit"
                disabled={createCompanyMutation.isPending}
              >
                {createCompanyMutation.isPending ? 'Создание...' : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования компании */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать компанию</DialogTitle>
            <DialogDescription>
              Внесите изменения в информацию о компании.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
            {/* Аналогичная форма как для создания */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">Название компании *</Label>
                <Input
                  id="edit_name"
                  {...form.register('name')}
                  placeholder="ООО Рога и Копыта"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_short_name">Короткое название</Label>
                <Input
                  id="edit_short_name"
                  {...form.register('short_name')}
                  placeholder="РиК"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Тип компании *</Label>
                <Select
                  value={form.watch('company_type')}
                  onValueChange={(value) => form.setValue('company_type', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    {companyTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Статус *</Label>
                <Select
                  value={form.watch('status')}
                  onValueChange={(value) => form.setValue('status', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingCompany(null)
                }}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={updateCompanyMutation.isPending}
              >
                {updateCompanyMutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Диалог удаления компании */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить компанию?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить компанию "{companyToDelete?.name}"?
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setCompanyToDelete(null)
              }}
            >
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteConfirm}
              disabled={deleteCompanyMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCompanyMutation.isPending ? 'Удаление...' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 