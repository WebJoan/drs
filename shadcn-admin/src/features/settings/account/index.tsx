import ContentSection from '../components/content-section'
import { Separator } from '@/components/ui/separator'
import { PasswordForm } from './password-form'
import { DeleteAccountForm } from './delete-account-form'

export default function SettingsAccount() {
  return (
    <div className='space-y-6'>
      <ContentSection
        title='Безопасность'
        desc='Управление паролем и настройками безопасности аккаунта.'
      >
        <PasswordForm />
      </ContentSection>
      
      <Separator />
      
      <ContentSection
        title='Удаление аккаунта'
        desc='Безвозвратно удалить ваш аккаунт и все связанные данные.'
      >
        <DeleteAccountForm />
      </ContentSection>
    </div>
  )
}
