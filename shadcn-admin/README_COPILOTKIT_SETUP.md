# CopilotKit + AG-UI Интеграция

## Описание

Фронтенд для чата с AI агентом теперь настроен для работы с CopilotKit и AG-UI протоколом. Интеграция позволяет взаимодействовать с Django backend, который использует AG-UI агента для обработки запросов.

## Что было сделано

1. **Обновлен CopilotProvider** - теперь использует стандартную интеграцию CopilotKit вместо кастомного адаптера
2. **Настроено проксирование** - все API запросы автоматически проксируются через Vite к Django backend
3. **Обновлены компоненты чата** - использует официальные компоненты CopilotKit (CopilotChat, CopilotSidebar)
4. **Удален лишний код** - убраны кастомные хуки и адаптеры в пользу стандартной реализации

## Требования

- Node.js 18+
- Django backend запущен на порту 8000
- Установлен OPENROUTER_API_KEY в переменных окружения backend

## Установка и запуск

### Backend (Django)

1. Убедитесь что установлен OPENROUTER_API_KEY:
```bash
export OPENROUTER_API_KEY="your-api-key"
```

2. Запустите Django сервер:
```bash
cd backend
python manage.py runserver
```

### Frontend (React + Vite)

1. Установите зависимости:
```bash
cd shadcn-admin
npm install
# или
pnpm install
```

2. Запустите dev сервер:
```bash
npm run dev
# или
pnpm dev
```

3. Откройте в браузере: http://localhost:5173

## Использование

1. Перейдите на страницу "AI Чат" в меню
2. Начните диалог с AI агентом
3. Агент может помочь с:
   - Созданием email кампаний
   - Анализом данных о продажах
   - Маркетинговыми стратегиями
   - Консультированием по CRM

## Архитектура

```
Frontend (React + Vite)
    ↓
CopilotKit Provider
    ↓
Vite Proxy (/api/* → localhost:8000)
    ↓
Django Backend + AG-UI Agent
    ↓
OpenRouter API (Gemini 2.5)
```

## Особенности конфигурации

- **Проксирование**: Все запросы на `/api/*` автоматически перенаправляются на Django backend
- **CORS**: Настроены правильные заголовки для работы с CopilotKit
- **Streaming**: Поддерживается потоковая передача ответов от AI агента
- **Новый адаптер**: Используется `/api/copilotkit-adapter/` для обхода CSRF

## Проблемы и решения

Если чат не работает:

1. Проверьте что Django backend запущен
2. Проверьте наличие OPENROUTER_API_KEY
3. Проверьте консоль браузера на наличие ошибок
4. Убедитесь что используете правильные порты (5173 для frontend, 8000 для backend)

### Доступные endpoints

1. **`/api/copilotkit-adapter/`** - Основной endpoint с полноценным AI агентом (без CSRF)
2. **`/api/test-copilotkit/`** - Тестовый endpoint для отладки
3. **`/api/agui/copilotkit/`** - Оригинальный endpoint (требует настройки CSRF)

## Известные ограничения

- **AiChatSidebar**: Боковая панель чата работает в демо-режиме. Для полноценной работы с AI агентом используйте основную страницу "AI Чат"
- **useCopilotChat**: Кастомный хук предоставляется только для обратной совместимости. Рекомендуется использовать официальные компоненты CopilotKit

## Дополнительная документация

- [CopilotKit Docs](https://docs.copilotkit.ai)
- [AG-UI Protocol](https://docs.ag-ui.com)
- [Django AG-UI Integration](https://github.com/ag-ui-protocol/ag-ui)