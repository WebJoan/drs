import {
  IconBarrierBlock,
  IconBrowserCheck,
  IconBug,
  IconChecklist,
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
} from '@tabler/icons-react'
import { AudioWaveform, Command, GalleryVerticalEnd } from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'RUELIQ',
      logo: Command,
      plan: 'Админ панель',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Sales ',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'Основные',
      items: [
        {
          title: 'Товары',
          url: '/goods',
          icon: IconShoppingCart,
        },
        {
          title: 'Панель управления',
          url: '/',
          icon: IconLayoutDashboard,
        },
        {
          title: 'Задачи',
          url: '/tasks',
          icon: IconChecklist,
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
        {
          title: 'Пользователи',
          url: '/users',
          icon: IconUsers,
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
}
