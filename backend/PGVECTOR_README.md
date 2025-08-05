# PgVector Integration для Agno

Этот проект интегрирован с PgVector для обеспечения векторного поиска и работы с базами знаний через библиотеку Agno.

## 🚀 Быстрый старт

### 1. Запуск PgVector контейнера

```bash
# Запуск всех сервисов включая PgVector
docker-compose up -d

# Или только PgVector
docker-compose up -d pgvector
```

### 2. Установка зависимостей

```bash
cd backend
uv sync
```

### 3. Настройка переменных окружения

Создайте файл `.env` в папке `backend/` или установите переменные окружения:

```bash
# Обязательные переменные
export OPENROUTER_API_KEY="your_openrouter_api_key_here"

# Опциональные переменные PgVector (используются значения по умолчанию)
export PGVECTOR_HOST="localhost"
export PGVECTOR_PORT="5532" 
export PGVECTOR_DB="ai"
export PGVECTOR_USER="ai"
export PGVECTOR_PASSWORD="ai"

# Опциональные настройки Agno
export AGNO_MODEL_ID="gpt-4o"
export AGNO_DEBUG="false"
```

### 4. Запуск примеров

```bash
# Синхронный пример
cd backend
python pgvector_example.py

# Асинхронный пример
python pgvector_async_example.py
```

## 📁 Структура файлов

```
backend/
├── pgvector_config.py         # Конфигурация PgVector и Agno
├── pgvector_example.py        # Синхронные примеры использования
├── pgvector_async_example.py  # Асинхронные примеры
└── PGVECTOR_README.md         # Этот файл
```

## 🔧 Конфигурация

### PgVector настройки

- **Host**: localhost (по умолчанию)
- **Port**: 5532 (отдельно от основной PostgreSQL на 5432)
- **Database**: ai
- **User/Password**: ai/ai

### Типы поиска

1. **vector** - Только векторный поиск (семантический)
2. **hybrid** - Комбинация векторного и текстового поиска (рекомендуется)
3. **text** - Только полнотекстовый поиск

### Таблицы по назначению

- `knowledge_base` - Общая база знаний
- `recipes` - Рецепты и кулинарные данные
- `documents` - Бизнес документы
- `sales_data` - Данные по продажам
- `products` - Информация о продуктах
- `customers` - Клиентские данные

## 💡 Примеры использования

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

# Создание агента
agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    knowledge=knowledge_base,
    show_tool_calls=True,
    markdown=True
)

# Использование
agent.print_response("Ваш вопрос", stream=True)
```

### Асинхронный пример

```python
import asyncio
from pgvector_config import get_pgvector_db_url

async def async_example():
    # Создание агента (аналогично синхронному)
    
    # Асинхронная загрузка
    await knowledge_base.aload(recreate=False, upsert=True)
    
    # Асинхронный запрос
    response = await agent.arun("Ваш вопрос")
    print(response)

# Запуск
asyncio.run(async_example())
```

## 🔍 Поиск и оптимизация

### Настройка весов поиска

```python
# Для гибридного поиска
vector_db = PgVector(
    table_name="my_table",
    db_url=get_pgvector_db_url(),
    search_type=SearchType.hybrid,
    vector_score_weight=0.7  # 70% вес векторного поиска, 30% текстового
)
```

### Индексирование

PgVector поддерживает различные типы индексов:

- **IVFFlat** - Для больших датасетов
- **HNSW** - Для быстрого поиска (по умолчанию)

```python
from agno.vectordb.pgvector import PgVector, HNSW

vector_db = PgVector(
    table_name="optimized_table",
    db_url=get_pgvector_db_url(),
    vector_index=HNSW(m=16, ef_construction=64)  # Настройка HNSW
)
```

## 🚨 Troubleshooting

### Проблема: Контейнер PgVector не запускается

```bash
# Проверьте логи
docker-compose logs pgvector

# Убедитесь что порт 5532 свободен
netstat -tulpn | grep 5532

# Пересоздайте контейнер
docker-compose down
docker-compose up -d pgvector
```

### Проблема: Ошибка подключения к базе данных

```bash
# Проверьте статус контейнера
docker-compose ps pgvector

# Проверьте настройки подключения
python -c "from pgvector_config import get_pgvector_db_url; print(get_pgvector_db_url())"
```

### Проблема: Отсутствует OPENROUTER_API_KEY

```bash
# Установите API ключ
export OPENROUTER_API_KEY="your_key_here"

# Или добавьте в .env файл
echo "OPENROUTER_API_KEY=your_key_here" >> backend/.env
```

### Проблема: Медленный поиск

1. Используйте подходящий тип индекса для вашего случая
2. Настройте `vector_score_weight` для оптимального баланса
3. Рассмотрите создание отдельных таблиц для разных типов данных
4. Используйте асинхронные операции для множественных запросов

## 📊 Мониторинг и отладка

### Включение отладки

```python
# В коде
AGNO_CONFIG["debug_mode"] = True

# Или через переменную окружения
export AGNO_DEBUG="true"
```

### Мониторинг запросов

```python
# Включение отображения вызовов инструментов
agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    knowledge=knowledge_base,
    show_tool_calls=True,  # Показывать вызовы инструментов
    debug_mode=True        # Режим отладки
)
```

### Проверка производительности

```python
import time

start_time = time.time()
response = agent.run("Ваш запрос")
end_time = time.time()

print(f"Время выполнения: {end_time - start_time:.2f} секунд")
```

## 🔗 Интеграция с Django

### Использование в Django views

```python
from django.http import JsonResponse
from pgvector_example import PgVectorManager

def search_knowledge(request):
    query = request.GET.get('q', '')
    
    manager = PgVectorManager(
        table_name=get_table_name("documents"),
        search_type="hybrid"
    )
    
    # Создание агента и поиск
    # ... ваш код здесь
    
    return JsonResponse({'result': response})
```

### Celery интеграция

```python
from celery import shared_task
from pgvector_async_example import AsyncPgVectorManager

@shared_task
async def process_documents_async(documents):
    manager = AsyncPgVectorManager()
    agent = await manager.create_agent_with_knowledge(documents)
    # ... обработка
    return result
```

## 📚 Дополнительные ресурсы

- [Agno Documentation](https://docs.agno.ai/)
- [PgVector GitHub](https://github.com/pgvector/pgvector)
- [OpenRouter API](https://openrouter.ai/)

## 🤝 Поддержка

Для вопросов и проблем:

1. Проверьте этот README
2. Изучите примеры в `pgvector_example.py` и `pgvector_async_example.py`
3. Проверьте логи Docker контейнеров
4. Убедитесь в корректности переменных окружения