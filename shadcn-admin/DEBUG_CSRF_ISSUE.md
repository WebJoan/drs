# Отладка проблемы CSRF с CopilotKit

## Текущая ситуация

При попытке использовать CopilotKit с Django backend возникает ошибка:
```
Ошибка проверки CSRF. Запрос отклонён.
Reason given for failure: CSRF token missing.
```

## Что было сделано для решения

1. **Проверен middleware** - `CopilotKitCSRFExemptMiddleware` уже настроен и должен отключать CSRF для путей:
   - `/api/agui/copilotkit/`
   - `/api/agui/stream/`
   - `/api/agui/csrf-token/`

2. **Проверены CORS настройки** - все необходимые origins добавлены в `CORS_ALLOWED_ORIGINS`

3. **Создан тестовый endpoint** - `/api/test-copilotkit/` для проверки работы без CSRF

## Как протестировать

### 1. Запустите Django backend:
```bash
cd backend
export OPENROUTER_API_KEY="ваш-ключ"
python manage.py runserver
```

### 2. Запустите frontend:
```bash
cd shadcn-admin
npm run dev  # или pnpm dev
```

### 3. Откройте браузер:
- Перейдите на http://localhost:5173
- Откройте консоль разработчика (F12)
- Перейдите на страницу "AI Чат"
- Попробуйте отправить сообщение

### 4. Проверьте логи:
- В консоли браузера должны быть видны запросы к `/api/test-copilotkit/`
- В логах Django должны отображаться входящие запросы

## Возможные решения

### Вариант 1: Исправить текущий endpoint
1. Убедиться что middleware правильно обрабатывает путь
2. Проверить порядок middleware в settings
3. Добавить больше логирования в middleware

### Вариант 2: Использовать тестовый endpoint
Если тестовый endpoint работает, можно временно использовать его:
1. В файле `src/lib/config.ts` уже настроен тестовый URL
2. Тестовый endpoint возвращает простые ответы

### Вариант 3: Полностью отключить CSRF для API
В файле `backend/django_react_starter/settings/base.py` можно добавить:
```python
CSRF_COOKIE_HTTPONLY = False
CSRF_USE_SESSIONS = False
```

## Как вернуть основной endpoint

1. В файле `src/lib/config.ts` измените:
```typescript
runtimeUrl: '/api/test-copilotkit/',  // тестовый
// на
runtimeUrl: '/api/agui/copilotkit/',  // основной
```

2. Убедитесь что Django агент работает правильно

## Дополнительная отладка

Для отладки можно:
1. Проверить логи в `backend/core/middleware.py` - там есть логирование
2. Использовать Django Debug Toolbar
3. Проверить Network вкладку в браузере

## Контакты для помощи

Если проблема не решается:
1. Проверьте документацию CopilotKit: https://docs.copilotkit.ai
2. Проверьте документацию AG-UI: https://docs.ag-ui.com
3. Создайте issue в репозитории проекта