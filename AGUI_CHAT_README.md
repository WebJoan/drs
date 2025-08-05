# AG-UI Chat с CopilotKit

Интеграция AI чата на фронтенде с использованием AG-UI и CopilotKit.

## 🏗️ Архитектура

```
Frontend (Vite React)          Backend (Django)
┌─────────────────────┐       ┌──────────────────────┐
│  AiChatSidebar      │────── │  AG-UI Agent         │
│  ↓                  │       │  (agui_agent.py)     │
│  CopilotContext     │────── │  ↓                   │
│  ↓                  │       │  Django Views        │
│  DjangoAgnoAdapter  │────── │  (agui_views.py)     │
└─────────────────════┴═══════│  ↓                   │
                              │  OpenRouter API      │
                              │  (Gemini 2.5 Flash)  │
                              └──────────────────────┘
```

## 🚀 Быстрый старт

### 1. Настройка бекенда

1. **Установите переменную окружения:**
   ```bash
   export OPENROUTER_API_KEY="your_openrouter_api_key_here"
   ```

2. **Запустите Django сервер:**
   ```bash
   cd backend
   python manage.py runserver
   ```

3. **Проверьте AG-UI endpoints:**
   ```bash
   # Проверка здоровья агента
   curl http://localhost:8000/api/agui/health/
   
   # Информация об агенте
   curl http://localhost:8000/api/agui/
   ```

### 2. Настройка фронтенда

1. **Создайте файл `.env.local` в папке `shadcn-admin/`:**
   ```bash
   VITE_BACKEND_URL=http://localhost:8000
   VITE_NODE_ENV=development
   ```

2. **Запустите фронтенд:**
   ```bash
   cd shadcn-admin
   pnpm dev
   ```

3. **Откройте приложение в браузере:**
   - Перейдите на http://localhost:5173
   - В правом нижнем углу появится кнопка чата 💬

## 🛠️ Компоненты

### Бекенд

#### `agui_agent.py`
- Создает Agno агента с OpenRouter
- Настраивает AG-UI приложение
- Конфигурирует модель Gemini 2.5 Flash

#### `agui_views.py`
- Django views для обработки запросов чата
- CORS поддержка для фронтенда
- Error handling и логирование

#### `agui_urls.py`
- URL маршруты для AG-UI endpoints:
  - `/agui/` - основной endpoint
  - `/api/agui/` - DRF API endpoint
  - `/api/agui/health/` - health check

### Фронтенд

#### `CopilotContext.tsx`
- React контекст для управления состоянием чата
- `DjangoAgnoAdapter` - адаптер для связи с Django
- Хуки: `useCopilotContext`, `useCopilotChat`

#### `AiChatSidebar.tsx`
- UI компонент сайдбара чата
- Минимизация/разворачивание
- Отображение истории сообщений
- Индикаторы загрузки и статуса

## 📡 API Endpoints

### Backend Endpoints

| Endpoint | Method | Описание |
|----------|--------|----------|
| `/api/agui/health/` | GET | Проверка состояния агента |
| `/api/agui/` | GET | Информация об агенте |
| `/api/agui/` | POST | Отправка сообщения агенту |

### Пример запроса к чату:

```bash
curl -X POST http://localhost:8000/api/agui/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Привет! Помоги мне создать email кампанию",
    "conversation_id": "unique_conversation_id"
  }'
```

### Пример ответа:

```json
{
  "success": true,
  "response": "Привет! Я помогу вам создать эффективную email кампанию...",
  "conversation_id": "unique_conversation_id",
  "agent_id": "sales_agent"
}
```

## 🎯 Функции AI агента

Агент специализируется на:

1. **📧 Email маркетинг:**
   - Создание персонализированных писем
   - Анализ эффективности кампаний
   - A/B тестирование рекомендации

2. **📊 Анализ продаж:**
   - Инсайты по клиентам
   - Тренды и прогнозы
   - ROI анализ

3. **🎯 CRM консультации:**
   - Стратегии управления клиентами
   - Автоматизация процессов
   - Интеграции с системами

4. **💡 Маркетинговые стратегии:**
   - Планирование кампаний
   - Сегментация аудитории
   - Контент стратегии

## 🔧 Конфигурация

### Настройки агента

В `agui_agent.py` можно настроить:

```python
agent = Agent(
    name="Sales Assistant",
    model=OpenRouter(
        id="google/gemini-2.5-flash",  # Модель
        temperature=0.7,               # Креативность
        max_tokens=1500               # Максимум токенов
    ),
    instructions="...",               # Системный промпт
    structured_outputs=False,         # Структурированный вывод
    debug_mode=True                  # Режим отладки
)
```

### Настройки фронтенда

В `lib/config.ts`:

```typescript
export const config = {
  agui: {
    baseUrl: 'http://localhost:8000',
    apiPath: '/api/agui',
    healthPath: '/api/agui/health',
  },
  chat: {
    maxMessages: 100,
    typingDelay: 1000,
    reconnectDelay: 5000,
  },
  debug: import.meta.env.DEV,
}
```

## 🚨 Troubleshooting

### Агент недоступен
1. Проверьте `OPENROUTER_API_KEY`
2. Убедитесь что Django сервер запущен
3. Проверьте логи: `curl http://localhost:8000/api/agui/health/`

### CORS ошибки
Убедитесь что в Django настройках разрешены CORS запросы с фронтенда.

### Медленные ответы
1. Проверьте интернет соединение
2. Попробуйте другую модель в `agui_agent.py`
3. Уменьшите `max_tokens`

## 🔄 Развитие

### Планируемые улучшения:

1. **🔐 Аутентификация:**
   - Интеграция с Django auth
   - JWT токены для API

2. **💾 История чатов:**
   - Сохранение в базе данных
   - Экспорт/импорт разговоров

3. **🎨 Кастомизация UI:**
   - Темы чата
   - Настройки пользователя

4. **📈 Аналитика:**
   - Метрики использования
   - Популярные запросы

## 📝 Логи и отладка

### Backend логи:
```bash
# Django логи
tail -f backend/logs/django.log

# AG-UI логи в консоли
python backend/run_agui_server.py
```

### Frontend логи:
Откройте DevTools → Console для отладочной информации.

## 🤝 Поддержка

При возникновении проблем проверьте:
1. Статус AG-UI агента: `/api/agui/health/`
2. Логи Django сервера
3. Network tab в DevTools браузера
4. Консоль браузера на ошибки JavaScript

---

**Автор:** AI Assistant  
**Версия:** 1.0.0  
**Дата:** 2024