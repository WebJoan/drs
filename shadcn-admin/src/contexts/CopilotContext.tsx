import React, { ReactNode } from 'react'
import { CopilotKit, useCopilotReadable, useCopilotAction } from '@copilotkit/react-core'
import { config } from '@/lib/config'

interface CopilotProviderProps {
  children: ReactNode
}

export function CopilotProvider({ children }: CopilotProviderProps) {
  return (
    <CopilotKit 
      runtimeUrl={config.copilotKit.runtimeUrl}
      showDevConsole={config.copilotKit.showDevConsole}
    >
      {children}
    </CopilotKit>
  )
}

// Кастомный хук для работы с чатом (эмуляция для совместимости)
export function useCopilotChat() {
  const [messages, setMessages] = React.useState<Array<{
    id: string
    content: string
    role: 'user' | 'assistant'
    timestamp: Date
    isComplete: boolean
  }>>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isStreaming, setIsStreaming] = React.useState(false)

  // Делаем сообщения доступными для CopilotKit
  useCopilotReadable({
    description: "История сообщений чата",
    value: messages
  })

  // Создаем action для отправки сообщений
  useCopilotAction({
    name: "sendChatMessage",
    description: "Отправить сообщение в чат",
    parameters: [
      {
        name: "message",
        type: "string",
        description: "Текст сообщения"
      }
    ],
    handler: async ({ message }) => {
      if (!message) return

      // Добавляем сообщение пользователя
      const userMessage = {
        id: `user-${Date.now()}`,
        content: message,
        role: 'user' as const,
        timestamp: new Date(),
        isComplete: true
      }
      setMessages(prev => [...prev, userMessage])

      // Эмулируем ответ агента
      setIsLoading(true)
      setIsStreaming(true)

      // Создаем сообщение агента
      const assistantMessageId = `assistant-${Date.now()}`
      const assistantMessage = {
        id: assistantMessageId,
        content: '',
        role: 'assistant' as const,
        timestamp: new Date(),
        isComplete: false
      }
      setMessages(prev => [...prev, assistantMessage])

      // Эмулируем потоковый ответ
      const mockResponse = "Извините, но для полноценной работы чата необходимо использовать компоненты CopilotKit (CopilotChat или CopilotSidebar) вместо кастомного интерфейса. Пожалуйста, используйте встроенные компоненты для взаимодействия с AI агентом."
      
      for (let i = 0; i < mockResponse.length; i += 5) {
        await new Promise(resolve => setTimeout(resolve, 50))
        const chunk = mockResponse.slice(i, i + 5)
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: msg.content + chunk }
            : msg
        ))
      }

      // Завершаем сообщение
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, isComplete: true }
          : msg
      ))
      setIsLoading(false)
      setIsStreaming(false)
    }
  })

  const sendMessage = React.useCallback(async (content: string) => {
    if (!content.trim()) return
    
    // Для совместимости с AiChatSidebar, эмулируем локальную обработку
    const userMessage = {
      id: `user-${Date.now()}`,
      content,
      role: 'user' as const,
      timestamp: new Date(),
      isComplete: true
    }
    setMessages(prev => [...prev, userMessage])
    
    setIsLoading(true)
    setIsStreaming(true)
    
    // Эмулируем ответ
    setTimeout(() => {
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        content: 'Для полноценной работы с AI агентом, пожалуйста, используйте основной чат на странице "AI Чат". Этот виджет работает в демо-режиме.',
        role: 'assistant' as const,
        timestamp: new Date(),
        isComplete: true
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
      setIsStreaming(false)
    }, 1000)
  }, [])

  const clearMessages = React.useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading,
    isStreaming,
    isAgentReady: true
  }
}