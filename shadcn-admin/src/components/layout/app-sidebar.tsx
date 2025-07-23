import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { NavGroup } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { TeamSwitcher } from '@/components/layout/team-switcher'
import { getSidebarDataForRole } from './data/sidebar-data'
import { useRole } from '@/contexts/RoleContext'
import { useAuth } from '@/stores/authStore'
import { UserRole } from '@/lib/types'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const { currentInterfaceRole } = useRole()
  
  // Получаем динамические данные сайдбара на основе роли пользователя
  const userRole = user?.role || UserRole.USER
  const sidebarData = getSidebarDataForRole(userRole, currentInterfaceRole)
  
  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
