import { config } from './config'

// Кеш для CSRF токена
interface CSRFCache {
  token: string | null
  timestamp: number
  expiresIn: number // в миллисекундах
}

let csrfCache: CSRFCache = {
  token: null,
  timestamp: 0,
  expiresIn: 30 * 60 * 1000 // 30 минут
}

// Получаем CSRF токен из куки (для fallback)
const getCSRFTokenFromCookie = (): string | null => {
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'django_react_starter-csrftoken') {
      return decodeURIComponent(value)
    }
  }
  return null
}

// Получаем CSRF токен с сервера через новый эндпоинт
const fetchCSRFTokenFromServer = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${config.agui.baseUrl}/api/agui/csrf-token/`, {
      method: 'GET',
      credentials: 'include', // Важно для работы с cookies
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch CSRF token:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    return data.csrfToken || null
  } catch (error) {
    console.error('Error fetching CSRF token:', error)
    return null
  }
}

// Проверяем, валиден ли кешированный токен
const isCacheValid = (): boolean => {
  const now = Date.now()
  return csrfCache.token !== null && 
         (now - csrfCache.timestamp) < csrfCache.expiresIn
}

// Основная функция для получения CSRF токена
export const getCSRFToken = async (): Promise<string | null> => {
  // Проверяем кеш
  if (isCacheValid()) {
    return csrfCache.token
  }

  // Сначала пытаемся получить из куки (быстрее)
  const cookieToken = getCSRFTokenFromCookie()
  if (cookieToken) {
    // Обновляем кеш
    csrfCache = {
      token: cookieToken,
      timestamp: Date.now(),
      expiresIn: csrfCache.expiresIn
    }
    return cookieToken
  }

  // Если в куки нет токена, получаем с сервера
  const serverToken = await fetchCSRFTokenFromServer()
  if (serverToken) {
    // Обновляем кеш
    csrfCache = {
      token: serverToken,
      timestamp: Date.now(),
      expiresIn: csrfCache.expiresIn
    }
    return serverToken
  }

  return null
}

// Синхронная версия для обратной совместимости
export const getCSRFTokenSync = (): string | null => {
  // Возвращаем из кеша если есть
  if (isCacheValid()) {
    return csrfCache.token
  }
  
  // Fallback к куки
  return getCSRFTokenFromCookie()
}

// Получаем заголовки с CSRF токеном для CopilotKit (асинхронная версия)
export const getCopilotHeaders = async (): Promise<Record<string, string>> => {
  const csrfToken = await getCSRFToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken
  }
  
  return headers
}

// Синхронная версия заголовков для обратной совместимости
export const getCopilotHeadersSync = (): Record<string, string> => {
  const csrfToken = getCSRFTokenSync()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken
  }
  
  return headers
}

// Функция для очистки кеша (для отладки)
export const clearCSRFCache = (): void => {
  csrfCache = {
    token: null,
    timestamp: 0,
    expiresIn: csrfCache.expiresIn
  }
}