import axios from 'axios'

const API_ROOT_URL = '/api/v1'

// Функция для получения CSRF токена из мета тега или куки
const getCSRFToken = (): string | null => {
  // Пытаемся получить из мета тега
  const metaTag = document.querySelector('meta[name="csrf-token"]')
  if (metaTag) {
    return metaTag.getAttribute('content')
  }
  
  // Пытаемся получить из куки
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'django_react_starter-csrftoken') {
      return decodeURIComponent(value)
    }
  }
  
  return null
}

// Настройка axios для работы с Django backend
export const apiClient = axios.create({
  baseURL: API_ROOT_URL,
  withCredentials: true, // Включаем cookies для session авторизации
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Функция для получения CSRF токена с бекенда
const fetchCSRFToken = async (): Promise<string | null> => {
  try {
    // Делаем запрос к Django для получения CSRF токена
    const response = await fetch('/api/v1/app/config/', {
      method: 'GET',
      credentials: 'include',
    })
    
    if (response.ok) {
      const csrfToken = getCSRFToken()
      return csrfToken
    }
  } catch (error) {
    console.warn('Не удалось получить CSRF токен:', error)
  }
  
  return null
}

// Интерцептор для добавления CSRF токена
apiClient.interceptors.request.use(
  async (config) => {
    let csrfToken = getCSRFToken()
    
    // Если токен не найден, попытаемся его получить
    if (!csrfToken && config.method !== 'get') {
      csrfToken = await fetchCSRFToken()
    }
    
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken
    }
    
    if (import.meta.env.DEV) {
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        fullURL: `${config.baseURL}${config.url}`,
        pathname: window.location.pathname,
        hasCSRF: !!csrfToken
      })
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Интерцептор для обработки ответов
apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log('API Response Success:', {
        status: response.status,
        url: response.config.url,
        pathname: window.location.pathname
      })
    }
    return response
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.log('API Response Error:', {
        status: error.response?.status,
        url: error.config?.url,
        pathname: window.location.pathname,
        message: error.message,
        data: error.response?.data
      })
    }
    
    // Не обрабатываем 401 ошибки на страницах авторизации
    const isAuthPage = window.location.pathname === '/sign-in' || 
                       window.location.pathname === '/sign-up' ||
                       window.location.pathname === '/forgot-password' ||
                       window.location.pathname === '/otp'
    
    if (import.meta.env.DEV) {
      if (error.response?.status === 401 && !isAuthPage) {
        console.log('Unauthorized error on non-auth page - this should trigger redirect')
      } else if (error.response?.status === 401 && isAuthPage) {
        console.log('Unauthorized error on auth page - this should be ignored')
      }
    }
    
    return Promise.reject(error)
  }
)

export default apiClient 