import os
import logging
from agno.app.agui.app import AGUIApp
from agno.agent.agent import Agent
from agno.models.openrouter import OpenRouter

logger = logging.getLogger(__name__)

# OpenRouter API конфигурация
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

def create_agno_agent():
    """
    Создает Agno агента для AG-UI интеграции
    """
    if not OPENROUTER_API_KEY:
        logger.error("OPENROUTER_API_KEY не настроен в переменных окружения")
        raise ValueError("OPENROUTER_API_KEY не настроен")
    
    # Создаем агента с OpenRouter
    agent = Agent(
        name="Sales Assistant",
        model=OpenRouter(
            id="google/gemini-2.5-flash",
            api_key=OPENROUTER_API_KEY,
            temperature=0.7,
            max_tokens=1500
        ),
        instructions="""
Ты профессиональный помощник по продажам и маркетингу.

Твои основные функции:
1. Помогать с созданием персонализированных email кампаний
2. Анализировать данные о продажах и клиентах
3. Предлагать стратегии улучшения продаж
4. Консультировать по вопросам CRM и управления клиентами
5. Помогать с анализом эффективности маркетинговых кампаний

Стиль общения:
- Профессиональный, но дружелюбный
- Конкретные и практичные советы
- Используй данные и аналитику для обоснования рекомендаций
- Общайся на русском языке
- Предлагай конкретные действия и решения

Всегда старайся быть полезным и предлагать практические решения для улучшения продаж и маркетинга.
        """,
        markdown=True,
        structured_outputs=False,
        debug_mode=True
    )
    
    return agent

def create_agui_app():
    """
    Создает AG-UI приложение
    """
    try:
        agent = create_agno_agent()
        
        # Создаем AG-UI приложение
        agui_app = AGUIApp(
            agent=agent,
            name="Sales Assistant AG-UI",
            app_id="sales_agent",
            description="AI помощник по продажам и маркетингу"
        )
        
        logger.info("AG-UI приложение создано успешно")
        return agui_app
        
    except Exception as e:
        logger.error(f"Ошибка создания AG-UI приложения: {str(e)}")
        raise

# Создаем глобальный экземпляр приложения
try:
    agui_app = create_agui_app()
    app = agui_app.get_app()
    logger.info("AG-UI агент инициализирован")
except Exception as e:
    logger.error(f"Не удалось инициализировать AG-UI агент: {str(e)}")
    agui_app = None
    app = None

if __name__ == "__main__":
    if agui_app:
        # Запускаем AG-UI сервер (для разработки)
        agui_app.serve(
            app="agui_agent:app", 
            host="127.0.0.1",
            port=8001, 
            reload=True
        )
    else:
        print("Не удалось запустить AG-UI сервер")