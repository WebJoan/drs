import ContentSection from '../components/content-section'
import { NotificationsForm } from './notifications-form'

export default function SettingsNotifications() {
  return (
    <ContentSection
      title='Уведомления'
      desc='Настройте способ получения уведомлений.'
    >
      <NotificationsForm />
    </ContentSection>
  )
}
