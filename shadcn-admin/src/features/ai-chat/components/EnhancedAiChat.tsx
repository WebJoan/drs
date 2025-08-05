import { CopilotChat } from '@copilotkit/react-ui'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bot, Sparkles } from 'lucide-react'
import { useStreamingEffect } from '@/hooks/useStreamingEffect'
import '@copilotkit/react-ui/styles.css'
import '@/styles/copilot-streaming.css'

interface EnhancedAiChatProps {
  className?: string
  useCopilotKit?: boolean
}

export function EnhancedAiChat({ className, useCopilotKit = true }: EnhancedAiChatProps) {
  // Включаем стриминг эффект
  useStreamingEffect()
  
  if (!useCopilotKit) {
    return (
      <Card className="flex flex-col items-center justify-center h-[600px] text-center p-8">
        <Bot className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Кастомный чат временно недоступен</h3>
        <p className="text-sm text-muted-foreground">
          Пожалуйста, используйте режим CopilotKit для общения с AI агентом
        </p>
      </Card>
    )
  }

  return (
    <div className={`flex flex-col h-full ${className || ''}`}>
      {/* Заголовок чата */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI Помощник по продажам</h2>
            <p className="text-sm text-muted-foreground">
              Powered by AG-UI Protocol
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          Онлайн
          </Badge>
      </div>

      {/* CopilotKit Chat компонент */}
      <div className="flex-1 overflow-hidden">
        <CopilotChat 
          className="h-full"
          labels={{
            title: "Чат с AI агентом",
            initial: "Привет! Я ваш персональный AI помощник по продажам и маркетингу. Я могу помочь вам с:\n\n• Созданием персонализированных email кампаний\n• Анализом данных о продажах\n• Разработкой маркетинговых стратегий\n• Консультированием по CRM системам\n\nЧто вас интересует?",
            placeholder: "Напишите ваш вопрос..."
          }}
          instructions={`
            Ты - профессиональный AI помощник по продажам и маркетингу, интегрированный через AG-UI протокол.
            
            Твои основные функции:
            1. Помощь в создании персонализированных email кампаний
            2. Анализ данных о продажах и клиентах
            3. Предложение стратегий улучшения продаж
            4. Консультирование по вопросам CRM и управления клиентами
            5. Помощь в анализе эффективности маркетинговых кампаний
            
            Всегда:
            - Давай конкретные и практичные советы
            - Используй данные и аналитику для обоснования рекомендаций
            - Предлагай конкретные действия и решения
            - Общайся на русском языке
            - Будь дружелюбным, но профессиональным
          `}
        />
          </div>
    </div>
  )
}