import ContentSection from '../components/content-section'
import ProfileForm from './profile-form'

export default function SettingsProfile() {
  return (
    <ContentSection
      title='Профиль'
      desc='Управление основной информацией профиля.'
    >
      <ProfileForm />
    </ContentSection>
  )
}
