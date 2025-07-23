import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { showSubmittedData } from '@/utils/show-submitted-data'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { SelectDropdown } from '@/components/select-dropdown'
import { Task } from '../data/schema'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Task
}

const formSchema = z.object({
  title: z.string().min(1, 'Название обязательно.'),
  status: z.string().min(1, 'Пожалуйста, выберите статус.'),
  label: z.string().min(1, 'Пожалуйста, выберите метку.'),
  priority: z.string().min(1, 'Пожалуйста, выберите приоритет.'),
})
type TasksForm = z.infer<typeof formSchema>

export function TasksMutateDrawer({ open, onOpenChange, currentRow }: Props) {
  const isUpdate = !!currentRow

  const form = useForm<TasksForm>({
    resolver: zodResolver(formSchema),
    defaultValues: currentRow ?? {
      title: '',
      status: '',
      label: '',
      priority: '',
    },
  })

  const onSubmit = (data: TasksForm) => {
    // do something with the form data
    onOpenChange(false)
    form.reset()
    showSubmittedData(data)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        form.reset()
      }}
    >
      <SheetContent className='flex flex-col'>
        <SheetHeader className='text-left'>
          <SheetTitle>{isUpdate ? 'Обновить' : 'Создать'} задачу</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Обновите задачу, предоставив необходимую информацию.'
              : 'Добавьте новую задачу, предоставив необходимую информацию.'}
            Нажмите "Сохранить", когда закончите.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='tasks-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-5 px-4'
          >
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Введите название' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Статус</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder='Выберите статус'
                    items={[
                      { label: 'В работе', value: 'in progress' },
                      { label: 'Бэклог', value: 'backlog' },
                      { label: 'К выполнению', value: 'todo' },
                      { label: 'Отменено', value: 'canceled' },
                      { label: 'Выполнено', value: 'done' },
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='label'
              render={({ field }) => (
                <FormItem className='relative space-y-3'>
                  <FormLabel>Метка</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className='flex flex-col space-y-1'
                    >
                      <FormItem className='flex items-center space-y-0 space-x-3'>
                        <FormControl>
                          <RadioGroupItem value='documentation' />
                        </FormControl>
                        <FormLabel className='font-normal'>
                          Документация
                        </FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center space-y-0 space-x-3'>
                        <FormControl>
                          <RadioGroupItem value='feature' />
                        </FormControl>
                        <FormLabel className='font-normal'>Функция</FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center space-y-0 space-x-3'>
                        <FormControl>
                          <RadioGroupItem value='bug' />
                        </FormControl>
                        <FormLabel className='font-normal'>Ошибка</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='priority'
              render={({ field }) => (
                <FormItem className='relative space-y-3'>
                  <FormLabel>Приоритет</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className='flex flex-col space-y-1'
                    >
                      <FormItem className='flex items-center space-y-0 space-x-3'>
                        <FormControl>
                          <RadioGroupItem value='high' />
                        </FormControl>
                        <FormLabel className='font-normal'>Высокий</FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center space-y-0 space-x-3'>
                        <FormControl>
                          <RadioGroupItem value='medium' />
                        </FormControl>
                        <FormLabel className='font-normal'>Средний</FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center space-y-0 space-x-3'>
                        <FormControl>
                          <RadioGroupItem value='low' />
                        </FormControl>
                        <FormLabel className='font-normal'>Низкий</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <SheetFooter className='gap-2'>
          <SheetClose asChild>
            <Button variant='outline'>Закрыть</Button>
          </SheetClose>
          <Button form='tasks-form' type='submit'>
            Сохранить изменения
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
