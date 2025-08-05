// Адаптер для работы с Django backend через CopilotKit
export async function copilotKitAdapter(url: string, options: RequestInit) {
  // Удаляем credentials для обхода CSRF
  const modifiedOptions: RequestInit = {
    ...options,
    credentials: 'omit',
    headers: {
      ...options.headers,
      // Добавляем заголовки которые ожидает Django
      'X-Requested-With': 'XMLHttpRequest',
    }
  }
  
  // Логируем для отладки
  if (import.meta.env.DEV) {
    console.log('CopilotKit request:', {
      url,
      method: options.method,
      headers: modifiedOptions.headers
    })
  }
  
  return fetch(url, modifiedOptions)
}