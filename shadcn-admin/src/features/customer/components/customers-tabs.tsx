import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Users } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import CompaniesContent from './companies-content'
import MyContactsContent from './my-contacts-content'

export default function CustomersTabs() {
  const [activeTab, setActiveTab] = useState<string>('companies')

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-6'>
          <div className='flex items-center space-x-2 mb-4'>
            <Building2 className='h-8 w-8 text-primary' />
            <div>
              <h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>Клиенты и Контакты</h1>
              <p className='text-muted-foreground mt-1 text-sm sm:text-base'>
                Управление компаниями и контактными лицами
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="companies" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Компании
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Мои контакты
              </TabsTrigger>
            </TabsList>

            <TabsContent value="companies" className="mt-6">
              <CompaniesContent />
            </TabsContent>

            <TabsContent value="contacts" className="mt-6">
              <MyContactsContent />
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
} 