import ContentSection from '../components/content-section'
import { AppearanceForm } from './appearance-form'

export default function SettingsAppearance() {
  return (
    <ContentSection
      title='Внешний вид'
      desc='Настройте внешний вид приложения. Автоматически переключайтесь между дневной и ночной темами.'
    >
      <AppearanceForm />
    </ContentSection>
  )
}
