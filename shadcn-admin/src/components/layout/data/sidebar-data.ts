import {
  IconBarrierBlock,
  IconBrowserCheck,
  IconBug,
  IconError404,
  IconHelp,
  IconLayoutDashboard,
  IconLock,
  IconLockAccess,
  IconMessages,
  IconNotification,
  IconPackages,
  IconPalette,
  IconServerOff,
  IconSettings,
  IconTool,
  IconUserCog,
  IconUserOff,
  IconUsers,
  IconShoppingCart,
  IconFileText,
  IconClipboardList,
} from '@tabler/icons-react'
import { AudioWaveform, Command, GalleryVerticalEnd } from 'lucide-react'
import { type SidebarData } from '../types'
import { UserRole } from '@/lib/types'

// Доступные команды (интерфейсы) для разных ролей
export const roleTeams = {
  [UserRole.ADMIN]: [
    {
      name: 'RUELIQ Admin',
      logo: Command,
      plan: 'Админ панель',
      role: UserRole.ADMIN,
    },
    {
      name: 'Продажи',
      logo: GalleryVerticalEnd,
      plan: 'Менеджер по продажам',
      role: UserRole.SALES_MANAGER,
    },
    {
      name: 'Продукты',
      logo: AudioWaveform,
      plan: 'Продукт менеджер',
      role: UserRole.PRODUCT_MANAGER,
    },
  ],
  [UserRole.SALES_MANAGER]: [
    {
      name: 'Продажи',
      logo: GalleryVerticalEnd,
      plan: 'Менеджер по продажам',
      role: UserRole.SALES_MANAGER,
    },
  ],
  [UserRole.PRODUCT_MANAGER]: [
    {
      name: 'Продукты',
      logo: AudioWaveform,
      plan: 'Продукт менеджер',
      role: UserRole.PRODUCT_MANAGER,
    },
  ],
  [UserRole.USER]: [
    {
      name: 'RUELIQ',
      logo: Command,
      plan: 'Пользователь',
      role: UserRole.USER,
    },
  ],
}

// Функция для получения данных сайдбара на основе роли пользователя
export function getSidebarDataForRole(userRole: UserRole, currentInterfaceRole?: UserRole): SidebarData {
  // Определяем какой интерфейс показывать
  const interfaceRole = currentInterfaceRole || userRole
  
  // Получаем доступные команды для пользователя
  const availableTeams = roleTeams[userRole] || []
  
  // Получаем навигационные группы для выбранного интерфейса
  const navGroups = roleNavGroups[interfaceRole] || roleNavGroups[UserRole.USER]
  
  return {
    user: defaultUser, // Информация о пользователе остается той же
    teams: availableTeams,
    navGroups: navGroups as any, // Временно используем any для обхода типизации
  }
}

// Навигационные группы для разных ролей
export const roleNavGroups = {
  [UserRole.ADMIN]: [
    {
      title: 'Основные',
      items: [
        {
          title: 'Панель управления',
          url: '/',
          icon: IconLayoutDashboard,
        },
        {
          title: 'Товары',
          url: '/goods',
          icon: IconShoppingCart,
        },
        {
          title: 'Пользователи',
          url: '/users',
          icon: IconUsers,
        },
        {
          title: 'Приложения',
          url: '/apps',
          icon: IconPackages,
        },
        {
          title: 'Чаты',
          url: '/chats',
          badge: '3',
          icon: IconMessages,
        },
      ],
    },
    {
      title: 'Страницы',
      items: [
        {
          title: 'Авторизация',
          icon: IconLockAccess,
          items: [
            {
              title: 'Вход',
              url: '/sign-in',
            },
            {
              title: 'Вход (2 столбца)',
              url: '/sign-in-2',
            },
            {
              title: 'Регистрация',
              url: '/sign-up',
            },
            {
              title: 'Забыли пароль',
              url: '/forgot-password',
            },
            {
              title: 'OTP',
              url: '/otp',
            },
          ],
        },
        {
          title: 'Ошибки',
          icon: IconBug,
          items: [
            {
              title: 'Неавторизован',
              url: '/401',
              icon: IconLock,
            },
            {
              title: 'Запрещено',
              url: '/403',
              icon: IconUserOff,
            },
            {
              title: 'Не найдено',
              url: '/404',
              icon: IconError404,
            },
            {
              title: 'Внутренняя ошибка сервера',
              url: '/500',
              icon: IconServerOff,
            },
            {
              title: 'Техническое обслуживание',
              url: '/503',
              icon: IconBarrierBlock,
            },
          ],
        },
      ],
    },
    {
      title: 'Другое',
      items: [
        {
          title: 'Настройки',
          icon: IconSettings,
          items: [
            {
              title: 'Профиль',
              url: '/settings',
              icon: IconUserCog,
            },
            {
              title: 'Аккаунт',
              url: '/settings/account',
              icon: IconTool,
            },
            {
              title: 'Внешний вид',
              url: '/settings/appearance',
              icon: IconPalette,
            },
            {
              title: 'Уведомления',
              url: '/settings/notifications',
              icon: IconNotification,
            },
            {
              title: 'Отображение',
              url: '/settings/display',
              icon: IconBrowserCheck,
            },
          ],
        },
        {
          title: 'Справочный центр',
          url: '/help-center',
          icon: IconHelp,
        },
      ],
    },
  ],
  [UserRole.SALES_MANAGER]: [
    {
      title: 'Продажи',
      items: [
        {
          title: 'Панель продаж',
          url: '/',
          icon: IconLayoutDashboard,
        },
        {
          title: 'Запросы цен (RFQ)',
          url: '/rfq',
          icon: IconFileText,
        },
        {
          title: 'Предложения',
          url: '/rfq/quotations',
          icon: IconClipboardList,
        },
        {
          title: 'Каталог товаров',
          url: '/goods',
          icon: IconShoppingCart,
        },
        {
          title: 'Клиенты',
          url: '/customers',
          icon: IconUsers,
        },
        {
          title: 'Чаты',
          url: '/chats',
          badge: '3',
          icon: IconMessages,
        },
      ],
    },
    {
      title: 'Другое',
      items: [
        {
          title: 'Настройки',
          icon: IconSettings,
          items: [
            {
              title: 'Профиль',
              url: '/settings',
              icon: IconUserCog,
            },
            {
              title: 'Аккаунт',
              url: '/settings/account',
              icon: IconTool,
            },
            {
              title: 'Внешний вид',
              url: '/settings/appearance',
              icon: IconPalette,
            },
          ],
        },
        {
          title: 'Справочный центр',
          url: '/help-center',
          icon: IconHelp,
        },
      ],
    },
  ],
  [UserRole.PRODUCT_MANAGER]: [
    {
      title: 'Продукты',
      items: [
        {
          title: 'Панель продуктов',
          url: '/',
          icon: IconLayoutDashboard,
        },
        {
          title: 'Управление товарами',
          url: '/goods',
          icon: IconShoppingCart,
        },
        {
          title: 'Запросы цен (RFQ)',
          url: '/rfq',
          icon: IconFileText,
        },
        {
          title: 'Мои предложения',
          url: '/rfq/quotations',
          icon: IconClipboardList,
        },
        {
          title: 'Чаты',
          url: '/chats',
          badge: '3',
          icon: IconMessages,
        },
      ],
    },
    {
      title: 'Другое',
      items: [
        {
          title: 'Настройки',
          icon: IconSettings,
          items: [
            {
              title: 'Профиль',
              url: '/settings',
              icon: IconUserCog,
            },
            {
              title: 'Аккаунт',
              url: '/settings/account',
              icon: IconTool,
            },
            {
              title: 'Внешний вид',
              url: '/settings/appearance',
              icon: IconPalette,
            },
          ],
        },
        {
          title: 'Справочный центр',
          url: '/help-center',
          icon: IconHelp,
        },
      ],
    },
  ],
  [UserRole.USER]: [
    {
      title: 'Основные',
      items: [
        {
          title: 'Панель пользователя',
          url: '/',
          icon: IconLayoutDashboard,
        },
        {
          title: 'Каталог товаров',
          url: '/goods',
          icon: IconShoppingCart,
        },
      ],
    },
    {
      title: 'Другое',
      items: [
        {
          title: 'Настройки',
          icon: IconSettings,
          items: [
            {
              title: 'Профиль',
              url: '/settings',
              icon: IconUserCog,
            },
            {
              title: 'Аккаунт',
              url: '/settings/account',
              icon: IconTool,
            },
            {
              title: 'Внешний вид',
              url: '/settings/appearance',
              icon: IconPalette,
            },
          ],
        },
        {
          title: 'Справочный центр',
          url: '/help-center',
          icon: IconHelp,
        },
      ],
    },
  ],
}

// Базовые данные пользователя
const defaultUser = {
  name: 'satnaing',
  email: 'satnaingdev@gmail.com',
  avatar: '/avatars/shadcn.jpg',
}

// Основной объект данных сайдбара (для обратной совместимости)
export const sidebarData: SidebarData = {
  user: defaultUser,
  teams: roleTeams[UserRole.ADMIN], // По умолчанию админский интерфейс
  navGroups: roleNavGroups[UserRole.ADMIN], // По умолчанию админские группы
}