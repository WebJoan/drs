# 🚀 PgVector + Agno - Быстрый старт

Векторная база данных PgVector интегрирована с библиотекой Agno для создания AI-агентов с базами знаний.

## ⚡ Быстрая настройка

### 1. Получите API ключ OpenRouter
```bash
# Зарегистрируйтесь на https://openrouter.ai/
# Создайте API ключ в разделе "API Keys"
```

### 2. Настройте переменные окружения
```bash
# Скопируйте пример конфигурации
cp backend/env.pgvector.example backend/.env

# Отредактируйте .env файл и добавьте ваш API ключ
nano backend/.env
```

### 3. Запустите автоматическую настройку
```bash
# Полная настройка: запуск контейнера + проверка + демо
make init.pgvector
```

### 4. Или настройте вручную
```bash
# Запустите только PgVector контейнер
make start.pgvector

# Проверьте настройку
make setup.pgvector

# Запустите демонстрацию
make demo.pgvector
```

## 📖 Примеры использования

### Базовый пример
```python
from pgvector_config import get_pgvector_db_url, get_table_name
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.knowledge.text import TextKnowledgeBase
from agno.vectordb.pgvector import PgVector, SearchType

# Создание векторной базы данных
vector_db = PgVector(
    table_name=get_table_name("general"),
    db_url=get_pgvector_db_url(),
    search_type=SearchType.hybrid
)

# Создание базы знаний
knowledge_base = TextKnowledgeBase(
    sources=["Ваш текст здесь"],
    vector_db=vector_db
)

# Загрузка данных
knowledge_base.load(recreate=True, upsert=True)

# Создание и использование агента
agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    knowledge=knowledge_base,
    show_tool_calls=True,
    markdown=True
)

agent.print_response("Ваш вопрос", stream=True)
```

### Асинхронный пример
```python
import asyncio

async def async_example():
    # Асинхронная загрузка
    await knowledge_base.aload(recreate=False, upsert=True)
    
    # Асинхронный запрос
    response = await agent.arun("Ваш вопрос")
    print(response)

asyncio.run(async_example())
```

## 🛠️ Полезные команды

```bash
# Запуск и остановка
make start.pgvector          # Запустить PgVector
make stop.pgvector           # Остановить PgVector
make status.pgvector         # Проверить статус

# Демонстрация
make demo.pgvector           # Синхронные примеры
make demo.pgvector.async     # Асинхронные примеры

# Управление данными
make backup.pgvector         # Создать бэкап
make restore.pgvector        # Восстановить из бэкапа
make reset.pgvector          # Сбросить все данные

# Отладка
make logs.pgvector           # Просмотр логов
make psql.pgvector          # Подключение к БД

# Справка
make help.pgvector          # Все доступные команды
```

## 📂 Файлы проекта

```
backend/
├── pgvector_config.py         # Конфигурация PgVector и Agno
├── pgvector_example.py        # Синхронные примеры
├── pgvector_async_example.py  # Асинхронные примеры
├── setup_pgvector.py          # Скрипт настройки
├── env.pgvector.example       # Пример конфигурации
└── PGVECTOR_README.md         # Подробная документация
```

## 🎯 Готовые сценарии

### 1. База знаний с PDF документами
```python
# Загрузка PDF с рецептами
pdf_urls = ["https://example.com/recipes.pdf"]
agent = manager.create_agent_with_pdf_knowledge(pdf_urls)
agent.knowledge.load(recreate=True, upsert=True)
agent.print_response("Как приготовить борщ?")
```

### 2. Бизнес-документы компании
```python
# Загрузка корпоративных знаний
business_texts = [
    "Наша компания специализируется на...",
    "Ценовая политика: от 100,000 руб/месяц",
    "Технологический стек: Django, React, PostgreSQL"
]
agent = manager.create_agent_with_text_knowledge(business_texts)
agent.print_response("Сколько стоят ваши услуги?")
```

### 3. Множественные специализированные агенты
```python
# Технический консультант, бизнес-аналитик, UX консультант
# Каждый с собственной базой знаний и специализацией
```

## 🚨 Troubleshooting

### Проблема: Контейнер не запускается
```bash
docker-compose logs pgvector
make reset.pgvector
```

### Проблема: Нет API ключа
```bash
export OPENROUTER_API_KEY="your_key_here"
# или добавьте в backend/.env
```

### Проблема: Медленная работа
- Используйте `SearchType.hybrid` для лучших результатов
- Создавайте отдельные таблицы для разных типов данных
- Используйте асинхронные операции для множественных запросов

## 📚 Дополнительно

- **Подробная документация**: `backend/PGVECTOR_README.md`
- **Примеры кода**: `backend/pgvector_example.py`
- **Асинхронные примеры**: `backend/pgvector_async_example.py`
- **Agno документация**: https://docs.agno.ai/
- **PgVector GitHub**: https://github.com/pgvector/pgvector

---

✅ **PgVector готов к использованию в вашем проекте!**