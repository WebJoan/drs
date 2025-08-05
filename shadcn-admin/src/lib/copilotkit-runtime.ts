import { CopilotRuntime } from '@copilotkit/runtime'
import { config } from './config'

// Создаем runtime для работы с Django AG-UI backend
export async function handleCopilotRequest(request: Request): Promise<Response> {
  const runtime = new CopilotRuntime({
    remoteEndpoints: [
      {
        // Используем Django endpoint с AG-UI
        url: config.copilotKit.runtimeUrl,
      }
    ],
  })

  // Обрабатываем запрос через runtime
  return runtime.process(request)
}

// Функция для создания fetch-совместимого endpoint
export function createCopilotEndpoint() {
  return async (request: Request) => {
    try {
      // Добавляем CORS заголовки если нужно
      const response = await handleCopilotRequest(request)
      
      // Клонируем ответ и добавляем CORS заголовки
      const headers = new Headers(response.headers)
      headers.set('Access-Control-Allow-Origin', '*')
      headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    } catch (error) {
      console.error('CopilotKit runtime error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
}