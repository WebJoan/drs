import React from 'react'
import { CopilotSidebar } from '@copilotkit/react-ui'
import { Bot } from 'lucide-react'

interface CopilotKitChatProps {
  defaultOpen?: boolean
  className?: string
}

export function CopilotKitChat({ defaultOpen = false, className }: CopilotKitChatProps) {
  return (
    <CopilotSidebar
      defaultOpen={defaultOpen}
      className={className}
      labels={{
        title: "AI Помощник по продажам",
        initial: "Добро пожаловать! Я ваш AI помощник по продажам и маркетингу. Чем могу помочь?",
        placeholder: "Задайте вопрос...",
        submitButtonLabel: "Отправить",
      }}
      instructions="Ты профессиональный помощник по продажам и маркетингу. Помогай с анализом данных, созданием контента и стратегиями продаж."
      showResponseButton={true}
      clickOutsideToClose={true}
      shortcut="/"
      icons={{
        openIcon: <Bot className="h-6 w-6" />,
        closeIcon: undefined, // использовать стандартную иконку закрытия
      }}
    />
  )
}