import * as React from 'react'
import { ChevronsUpDown, Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useRole } from '@/contexts/RoleContext'
import { UserRole } from '@/lib/types'

interface Team {
  name: string
  logo: React.ElementType
  plan: string
  role: UserRole
}

export function TeamSwitcher({
  teams,
}: {
  teams: Team[]
}) {
  const { isMobile } = useSidebar()
  const { currentInterfaceRole, switchToRole, canSwitchToRole } = useRole()
  
  // Находим активную команду на основе текущей роли интерфейса
  const activeTeam = teams.find(team => team.role === currentInterfaceRole) || teams[0]

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                <activeTeam.logo className='size-4' />
              </div>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-semibold'>
                  {activeTeam.name}
                </span>
                <span className='truncate text-xs'>{activeTeam.plan}</span>
              </div>
              <ChevronsUpDown className='ml-auto' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            align='start'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className='text-muted-foreground text-xs'>
              Интерфейсы
            </DropdownMenuLabel>
            {teams.map((team, index) => {
              const isActive = team.role === currentInterfaceRole
              const canSwitch = canSwitchToRole(team.role)
              
              return (
                <DropdownMenuItem
                  key={team.role}
                  onClick={() => canSwitch && switchToRole(team.role)}
                  className={`gap-2 p-2 ${!canSwitch ? 'opacity-50 cursor-not-allowed' : ''} ${isActive ? 'bg-sidebar-accent' : ''}`}
                  disabled={!canSwitch}
                >
                  <div className='flex size-6 items-center justify-center rounded-sm border'>
                    <team.logo className='size-4 shrink-0' />
                  </div>
                  {team.name}
                  {isActive && <span className='ml-auto text-xs'>✓</span>}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
