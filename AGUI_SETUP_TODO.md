# 🚀 AG-UI Chat Setup - Пошаговая инструкция

## ✅ Что уже готово:

### Backend:
- ✅ `agui_agent.py` - AG-UI агент с OpenRouter интеграцией
- ✅ `agui_views.py` - Django views для API endpoints
- ✅ `agui_urls.py` - URL маршруты
- ✅ Интеграция в `django_react_starter/urls.py`
- ✅ `test_agui_integration.py` - скрипт тестирования

### Frontend:
- ✅ `CopilotContext.tsx` - React контекст и адаптер
- ✅ `AiChatSidebar.tsx` - UI компонент чата
- ✅ `chat-styles.css` - стили чата
- ✅ Интеграция в `__root.tsx` и `main.tsx`
- ✅ `lib/config.ts` - конфигурация

## 🎯 Следующие шаги:

### 1. Настройте переменные окружения

#### Backend (.env или export):
```bash
export OPENROUTER_API_KEY="your_openrouter_api_key_here"
```

#### Frontend (shadcn-admin/.env.local):
```bash
VITE_BACKEND_URL=http://localhost:8000
VITE_NODE_ENV=development
```

### 2. Установите Python зависимости

Зависимости уже настроены в `pyproject.toml`, но убедитесь что они установлены:

```bash
cd backend
# Если используете uv (рекомендуется):
uv sync

# Или pip:
pip install -r requirements.txt
# или если есть pyproject.toml:
pip install -e .
```

### 3. Протестируйте локально (опционально)

Перед запуском серверов, проверьте что AG-UI агент инициализируется корректно:

```bash
cd backend
python test_agui_local.py
```

### 4. Запустите сервисы

#### Терминал 1 - Django Backend:
```bash
cd backend
python manage.py runserver
```

#### Терминал 2 - Frontend:
```bash
cd shadcn-admin
pnpm dev
```

### 5. Протестируйте интеграцию

```bash
# Из корневой папки проекта
python test_agui_integration.py
```

### 6. Откройте приложение

1. Перейдите на http://localhost:5173
2. В правом нижнем углу появится кнопка чата 💬
3. Кликните и начните общение с AI агентом!

## 🔧 Troubleshooting

### Агент недоступен:
1. Проверьте `OPENROUTER_API_KEY`
2. Убедитесь что Django сервер запущен
3. Проверьте: `curl http://localhost:8000/api/agui/health/`

### CORS ошибки:
Добавьте в Django settings CORS конфигурацию для localhost:5173

### Модули не найдены:
```bash
cd backend
pip install agno django djangorestframework
```

### Frontend ошибки:
```bash
cd shadcn-admin
pnpm install
```

## 📊 Проверка работы

### Health Check:
```bash
curl http://localhost:8000/api/agui/health/
```

Должен вернуть:
```json
{
  "status": "healthy",
  "agui_available": true,
  "agent_id": "sales_agent"
}
```

### Тест сообщения:
```bash
curl -X POST http://localhost:8000/api/agui/ \
  -H "Content-Type: application/json" \
  -d '{"message": "Привет!"}'
```

## 🎨 Кастомизация

### Изменить модель AI:
В `agui_agent.py` замените:
```python
model=OpenRouter(
    id="google/gemini-2.5-flash",  # <- здесь
    # на другую модель, например:
    # id="anthropic/claude-3-haiku",
    # id="openai/gpt-4o-mini",
)
```

### Изменить инструкции агента:
В `agui_agent.py` отредактируйте поле `instructions`

### Настроить UI:
- Стили: `shadcn-admin/src/components/ai-chat/chat-styles.css`
- Компонент: `shadcn-admin/src/components/ai-chat/AiChatSidebar.tsx`
- Конфигурация: `shadcn-admin/src/lib/config.ts`

## 📚 Документация

- [Полная документация](./AGUI_CHAT_README.md)
- [Agno документация](https://docs.agno.ai/)
- [OpenRouter модели](https://openrouter.ai/models)

## 🎉 Готово!

После выполнения всех шагов у вас будет работающий AI чат-ассистент по продажам, интегрированный в ваше приложение!

---

**Дата создания:** 2024  
**Статус:** Готов к использованию ✅