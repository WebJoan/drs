// Конфигурация для AG-UI интеграции
export const config = {
  // URL бекенда для AG-UI - используем проксирование через Vite
  agui: {
    baseUrl: '', // Пустая строка означает относительные URL (проксирование)
    apiPath: '/api/agui',
    streamPath: '/api/agui/stream',
    healthPath: '/api/agui/health',
    copilotKitPath: '/api/agui/copilotkit',
  },
  
  // Настройки чата
  chat: {
    maxMessages: 100,
    typingDelay: 1000,
    reconnectDelay: 5000,
  },
  
  // CopilotKit настройки
  copilotKit: {
    // Возвращаемся к GraphQL адаптеру, но исправим его
    // runtimeUrl: '/api/agui/copilotkit/', // Исправленный GraphQL адаптер
    runtimeUrl: '/api/agui/copilotkit/', // Исправленный GraphQL адаптер
    showDevConsole: import.meta.env.DEV,
    
    // Отладочные параметры
    debug: import.meta.env.DEV,
  },
  
  // Дебаг настройки
  debug: import.meta.env.DEV,
} as const

export type Config = typeof config