import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  X, 
  Loader2, 
  AlertCircle,
  Trash2,
  Minimize2,
  Maximize2
} from 'lucide-react'
import { useCopilotChat } from '@/contexts/CopilotContext'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import './chat-styles.css'

interface AiChatSidebarProps {
  className?: string
}

export function AiChatSidebar({ className }: AiChatSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const { messages, sendMessage, clearMessages, isLoading, isStreaming, isAgentReady } = useCopilotChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Прокручиваем к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Фокус на инпут при открытии чата
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading || isStreaming || !isAgentReady) return

    await sendMessage(inputValue.trim())
    setInputValue('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className={cn(
          "fixed bottom-4 right-4 z-50 rounded-full w-14 h-14 shadow-lg",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "transition-all duration-200 hover:scale-105 active:scale-95",
          className
        )}
      >
        <MessageCircle className="h-6 w-6" />
        <span className="sr-only">Открыть AI чат</span>
      </Button>
    )
  }

  return (
    <Card 
      className={cn(
        "fixed bottom-4 right-4 z-50 w-96 shadow-2xl border-border",
        "transition-all duration-300 ease-in-out",
        isMinimized ? "h-16" : "h-[600px]",
        className
      )}
    >
      {/* Заголовок чата */}
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Помощник</CardTitle>
            <Badge 
              variant={isAgentReady ? "default" : "destructive"}
              className="text-xs"
            >
              {isAgentReady ? "Готов" : "Недоступен"}
            </Badge>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0"
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-[calc(600px-80px)]">
          {/* Область сообщений */}
          <div className="flex-1 relative">
            <ScrollArea className="h-full px-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Добро пожаловать!
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Я ваш AI помощник по продажам и маркетингу.
                    <br />
                    Задайте мне любой вопрос!
                  </p>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex items-start space-x-3",
                        message.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      )}
                      
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                          message.role === 'user'
                            ? "bg-primary text-primary-foreground ml-8"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <div className="whitespace-pre-wrap break-words">
                          {message.content}
                          {/* Показываем курсор для незавершенных сообщений агента */}
                          {message.role === 'assistant' && !message.isComplete && (
                            <span className="inline-block w-1 h-3 bg-primary/60 ml-1 animate-pulse" />
                          )}
                        </div>
                        <div 
                          className={cn(
                            "text-xs mt-1 opacity-70",
                            message.role === 'user' 
                              ? "text-primary-foreground/70" 
                              : "text-muted-foreground/70"
                          )}
                        >
                          {formatDistanceToNow(message.timestamp, { 
                            addSuffix: true, 
                            locale: ru 
                          })}
                        </div>
                      </div>

                      {message.role === 'user' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Индикатор загрузки/стриминга */}
                  {(isLoading || isStreaming) && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{isStreaming ? "Печатаю..." : "Думаю..."}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Кнопка очистки чата */}
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMessages}
                className="absolute top-2 right-2 h-8 w-8 p-0 opacity-70 hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Separator />

          {/* Форма ввода сообщения */}
          <div className="p-4">
            {!isAgentReady ? (
              <div className="flex items-center justify-center space-x-2 p-2 text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">AI агент недоступен</span>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Введите ваше сообщение..."
                  disabled={isLoading || isStreaming}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={!inputValue.trim() || isLoading || isStreaming}
                  className="px-3"
                >
                  {(isLoading || isStreaming) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}