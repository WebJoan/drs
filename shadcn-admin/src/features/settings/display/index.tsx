import ContentSection from '../components/content-section'
import { DisplayForm } from './display-form'

export default function SettingsDisplay() {
  return (
    <ContentSection
      title='Отображение'
      desc='Включите или отключите элементы для управления отображением в приложении.'
    >
      <DisplayForm />
    </ContentSection>
  )
}
