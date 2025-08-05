import { useEffect, useRef } from 'react'

export function useStreamingEffect() {
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isStreamingRef = useRef(false)

  const applyStreamingEffect = (element: HTMLElement, text: string) => {
    if (isStreamingRef.current) return // Уже стримим

    isStreamingRef.current = true
    element.innerHTML = ''
    
    let currentIndex = 0
    const words = text.split(' ')
    
    const streamWord = () => {
      if (currentIndex < words.length) {
        const word = words[currentIndex]
        const span = document.createElement('span')
        span.className = 'copilot-streaming-text'
        span.textContent = word + (currentIndex < words.length - 1 ? ' ' : '')
        element.appendChild(span)
        
        currentIndex++
        streamingIntervalRef.current = setTimeout(streamWord, 100) // 100ms между словами
      } else {
        isStreamingRef.current = false
        if (streamingIntervalRef.current) {
          clearTimeout(streamingIntervalRef.current)
          streamingIntervalRef.current = null
        }
      }
    }
    
    streamWord()
  }

  const observeMessages = () => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement
            
            // Ищем сообщения агента
            const assistantMessage = element.querySelector('[data-role="assistant"]') ||
                                   (element.getAttribute('data-role') === 'assistant' ? element : null)
            
            if (assistantMessage) {
              const messageContent = assistantMessage.querySelector('.message-content') || 
                                   assistantMessage.querySelector('p') ||
                                   assistantMessage
              
              if (messageContent && messageContent.textContent) {
                const text = messageContent.textContent
                if (text.length > 10) { // Только для длинных сообщений
                  applyStreamingEffect(messageContent as HTMLElement, text)
                }
              }
            }
          }
        })
      })
    })

    // Наблюдаем за всем документом для поиска новых сообщений
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-role']
    })

    return observer
  }

  useEffect(() => {
    const observer = observeMessages()
    
    return () => {
      observer.disconnect()
      if (streamingIntervalRef.current) {
        clearTimeout(streamingIntervalRef.current)
      }
    }
  }, [])

  return {
    isStreaming: isStreamingRef.current,
    applyStreamingEffect
  }
}