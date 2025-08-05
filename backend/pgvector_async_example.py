#!/usr/bin/env python3
"""
Асинхронный пример использования PgVector с Agno

Этот скрипт демонстрирует асинхронную работу с PgVector для высокопроизводительных
приложений с множественными запросами к векторной базе данных.
"""

import asyncio
import os
import time
from typing import List, Dict, Any

# Настройка Django (если запускается отдельно)
if 'DJANGO_SETTINGS_MODULE' not in os.environ:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_react_starter.settings.development')
    
    import django
    django.setup()

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.knowledge.pdf_url import PDFUrlKnowledgeBase
from agno.knowledge.text import TextKnowledgeBase
from agno.vectordb.pgvector import PgVector, SearchType

from pgvector_config import (
    get_pgvector_db_url, 
    get_table_name,
    validate_config,
    AGNO_CONFIG,
    SEARCH_CONFIG
)

class AsyncPgVectorManager:
    """
    Асинхронный менеджер для работы с PgVector
    """
    
    def __init__(self, table_name: str = "async_knowledge", search_type: str = "hybrid"):
        """
        Инициализация асинхронного менеджера
        
        Args:
            table_name: Имя таблицы для векторов
            search_type: Тип поиска (vector, text, hybrid)
        """
        self.db_url = get_pgvector_db_url()
        self.table_name = table_name
        self.search_type = getattr(SearchType, search_type, SearchType.hybrid)
        
        # Создаем векторную базу данных
        self.vector_db = PgVector(
            table_name=self.table_name,
            db_url=self.db_url,
            search_type=self.search_type,
            vector_score_weight=SEARCH_CONFIG["vector_score_weight"]
        )
    
    async def create_agent_with_knowledge(self, texts: List[str]) -> Agent:
        """
        Асинхронно создает агента с базой знаний
        
        Args:
            texts: Список текстов для загрузки
            
        Returns:
            Agent: Настроенный агент
        """
        knowledge_base = TextKnowledgeBase(
            sources=texts,
            vector_db=self.vector_db,
        )
        
        # Асинхронно загружаем базу знаний
        await knowledge_base.aload(recreate=False, upsert=True)
        
        return Agent(
            model=OpenAIChat(id=AGNO_CONFIG["model_id"]),
            knowledge=knowledge_base,
            read_chat_history=True,
            show_tool_calls=AGNO_CONFIG["show_tool_calls"],
            markdown=AGNO_CONFIG["markdown"],
            debug_mode=AGNO_CONFIG["debug_mode"],
        )
    
    async def create_pdf_agent(self, pdf_urls: List[str]) -> Agent:
        """
        Асинхронно создает агента с PDF документами
        
        Args:
            pdf_urls: Список URL PDF документов
            
        Returns:
            Agent: Настроенный агент
        """
        knowledge_base = PDFUrlKnowledgeBase(
            urls=pdf_urls,
            vector_db=self.vector_db,
        )
        
        # Асинхронно загружаем PDF
        await knowledge_base.aload(recreate=False, upsert=True)
        
        return Agent(
            model=OpenAIChat(id=AGNO_CONFIG["model_id"]),
            knowledge=knowledge_base,
            read_chat_history=False,  # Отключаем для производительности
            show_tool_calls=False,    # Отключаем для производительности
            markdown=True,
        )

async def example_concurrent_queries():
    """
    Пример одновременной обработки множественных запросов
    """
    print("=== Пример 1: Конкурентные запросы ===")
    
    if not validate_config():
        return
    
    # Создаем менеджер
    manager = AsyncPgVectorManager(
        table_name=get_table_name("concurrent"),
        search_type="hybrid"
    )
    
    # Подготавливаем данные
    knowledge_texts = [
        "Python - это интерпретируемый язык программирования высокого уровня.",
        "Django - это веб-фреймворк для быстрой разработки веб-приложений на Python.",
        "React - это JavaScript библиотека для создания пользовательских интерфейсов.",
        "PostgreSQL - это мощная реляционная система управления базами данных.",
        "PgVector - это расширение PostgreSQL для работы с векторными данными и поиском.",
        "Celery - это распределенная очередь задач для Python приложений.",
        "Redis - это структура данных в памяти, используемая как база данных и кеш.",
        "Docker - это платформа контейнеризации для упаковки приложений.",
        "Nginx - это веб-сервер и обратный прокси-сервер.",
        "Git - это система контроля версий для отслеживания изменений в коде."
    ]
    
    try:
        # Создаем агента
        print("📚 Создаем агента с базой знаний...")
        agent = await manager.create_agent_with_knowledge(knowledge_texts)
        print("✅ Агент создан!")
        
        # Список вопросов для одновременной обработки
        questions = [
            "Что такое Python?",
            "Расскажи о Django",
            "Как работает React?", 
            "Что такое PostgreSQL?",
            "Для чего нужен Docker?",
        ]
        
        print(f"\n🚀 Обрабатываем {len(questions)} запросов одновременно...")
        start_time = time.time()
        
        # Создаем задачи для асинхронного выполнения
        tasks = []
        for i, question in enumerate(questions):
            task = process_question_async(agent, f"Вопрос {i+1}", question)
            tasks.append(task)
        
        # Ожидаем выполнения всех задач
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        print(f"\n⚡ Все запросы обработаны за {processing_time:.2f} секунд")
        
        # Выводим результаты
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"❌ Вопрос {i+1}: Ошибка - {str(result)}")
            else:
                print(f"✅ Вопрос {i+1}: Обработан успешно")
        
    except Exception as e:
        print(f"❌ Ошибка в конкурентных запросах: {str(e)}")

async def process_question_async(agent: Agent, question_id: str, question: str) -> str:
    """
    Асинхронно обрабатывает один вопрос
    
    Args:
        agent: Агент Agno
        question_id: Идентификатор вопроса
        question: Текст вопроса
        
    Returns:
        str: Ответ агента
    """
    try:
        print(f"🔄 {question_id}: {question}")
        
        # Асинхронно получаем ответ
        response = await agent.arun(question)
        
        print(f"✅ {question_id}: Ответ получен")
        return response.content if hasattr(response, 'content') else str(response)
        
    except Exception as e:
        print(f"❌ {question_id}: Ошибка - {str(e)}")
        raise

async def example_multiple_agents():
    """
    Пример работы с множественными агентами одновременно
    """
    print("\n=== Пример 2: Множественные агенты ===")
    
    if not validate_config():
        return
    
    try:
        # Создаем несколько агентов с разными специализациями
        agents_config = [
            {
                "name": "Технический консультант",
                "table": "tech_agent",
                "texts": [
                    "Специализируюсь на технических вопросах разработки ПО, архитектуре систем и DevOps практиках.",
                    "Могу помочь с выбором технологий, оптимизацией производительности и решением технических проблем.",
                ]
            },
            {
                "name": "Бизнес аналитик", 
                "table": "business_agent",
                "texts": [
                    "Специализируюсь на бизнес-анализе, требованиях к продукту и стратегии развития.",
                    "Помогаю в планировании проектов, анализе рынка и оптимизации бизнес-процессов.",
                ]
            },
            {
                "name": "UX консультант",
                "table": "ux_agent", 
                "texts": [
                    "Специализируюсь на пользовательском опыте, дизайне интерфейсов и юзабилити.",
                    "Помогаю создавать удобные и интуитивные пользовательские интерфейсы.",
                ]
            }
        ]
        
        print("🤖 Создаем специализированных агентов...")
        
        # Создаем агентов асинхронно
        agent_tasks = []
        for config in agents_config:
            manager = AsyncPgVectorManager(
                table_name=config["table"],
                search_type="vector"
            )
            task = manager.create_agent_with_knowledge(config["texts"])
            agent_tasks.append((config["name"], task))
        
        # Ожидаем создания всех агентов
        agents = {}
        for name, task in agent_tasks:
            try:
                agents[name] = await task
                print(f"✅ {name} готов")
            except Exception as e:
                print(f"❌ Ошибка создания {name}: {str(e)}")
        
        # Тестируем агентов одновременно
        if agents:
            print(f"\n🚀 Тестируем {len(agents)} агентов одновременно...")
            
            test_tasks = [
                (agents["Технический консультант"], "Какие технологии лучше использовать для веб-разработки?"),
                (agents["Бизнес аналитик"], "Как оценить эффективность нового продукта?"),
                (agents["UX консультант"], "Какие принципы важны для хорошего UX?"),
            ]
            
            # Запускаем все тесты одновременно
            tasks = []
            for agent, question in test_tasks:
                task = agent.arun(question)
                tasks.append(task)
            
            start_time = time.time()
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            end_time = time.time()
            
            print(f"\n⚡ Все агенты ответили за {end_time - start_time:.2f} секунд")
            
            for i, response in enumerate(responses):
                agent_name = list(agents.keys())[i]
                if isinstance(response, Exception):
                    print(f"❌ {agent_name}: Ошибка - {str(response)}")
                else:
                    print(f"✅ {agent_name}: Ответ получен")
        
    except Exception as e:
        print(f"❌ Ошибка в работе с множественными агентами: {str(e)}")

async def example_batch_processing():
    """
    Пример пакетной обработки документов
    """
    print("\n=== Пример 3: Пакетная обработка ===")
    
    if not validate_config():
        return
    
    try:
        # Множественные документы для обработки
        documents = [
            f"Документ {i}: Это тестовый документ номер {i} с информацией о продукте {i}. "
            f"Продукт имеет характеристики A{i}, B{i}, C{i} и цену {i*100} рублей."
            for i in range(1, 11)
        ]
        
        print(f"📄 Обрабатываем {len(documents)} документов...")
        
        # Создаем менеджер для пакетной обработки
        manager = AsyncPgVectorManager(
            table_name=get_table_name("batch"),
            search_type="hybrid"
        )
        
        # Разбиваем документы на батчи для эффективной обработки
        batch_size = 3
        batches = [documents[i:i + batch_size] for i in range(0, len(documents), batch_size)]
        
        print(f"📦 Создано {len(batches)} батчей по {batch_size} документов")
        
        # Обрабатываем батчи асинхронно
        batch_tasks = []
        for i, batch in enumerate(batches):
            task = process_batch_async(manager, f"Батч {i+1}", batch)
            batch_tasks.append(task)
        
        start_time = time.time()
        batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
        end_time = time.time()
        
        print(f"\n⚡ Пакетная обработка завершена за {end_time - start_time:.2f} секунд")
        
        # Подсчитываем результаты
        successful_batches = sum(1 for result in batch_results if not isinstance(result, Exception))
        print(f"✅ Успешно обработано батчей: {successful_batches}/{len(batches)}")
        
    except Exception as e:
        print(f"❌ Ошибка в пакетной обработке: {str(e)}")

async def process_batch_async(manager: AsyncPgVectorManager, batch_id: str, documents: List[str]) -> bool:
    """
    Асинхронно обрабатывает батч документов
    
    Args:
        manager: Менеджер PgVector
        batch_id: Идентификатор батча
        documents: Список документов для обработки
        
    Returns:
        bool: True если батч обработан успешно
    """
    try:
        print(f"🔄 {batch_id}: Загружаем {len(documents)} документов...")
        
        # Создаем уникальную таблицу для каждого батча
        batch_manager = AsyncPgVectorManager(
            table_name=f"{manager.table_name}_{batch_id.lower().replace(' ', '_')}",
            search_type=manager.search_type.name
        )
        
        # Создаем агента и загружаем документы
        agent = await batch_manager.create_agent_with_knowledge(documents)
        
        # Тестируем поиск
        test_response = await agent.arun(f"Сколько документов в {batch_id}?")
        
        print(f"✅ {batch_id}: Обработан успешно")
        return True
        
    except Exception as e:
        print(f"❌ {batch_id}: Ошибка - {str(e)}")
        raise

async def main():
    """
    Главная асинхронная функция
    """
    print("🚀 Демонстрация асинхронного PgVector с Agno")
    print("=" * 55)
    
    # Проверяем конфигурацию
    if not validate_config():
        print("\n💡 Для настройки установите переменные окружения:")
        print("export OPENROUTER_API_KEY='your_api_key_here'")
        return
    
    print("✅ Конфигурация корректна!")
    print(f"📊 Подключение к PgVector: {get_pgvector_db_url()}")
    
    try:
        # Запускаем примеры асинхронно
        await example_concurrent_queries()
        await example_multiple_agents()
        await example_batch_processing()
        
        print("\n✅ Асинхронная демонстрация завершена!")
        print("\n💡 Преимущества асинхронного подхода:")
        print("- Высокая производительность при множественных запросах")
        print("- Эффективное использование ресурсов")
        print("- Масштабируемость для high-load приложений")
        print("- Неблокирующие операции ввода-вывода")
        
    except KeyboardInterrupt:
        print("\n⏹️  Демонстрация прервана пользователем")
    except Exception as e:
        print(f"\n❌ Общая ошибка: {str(e)}")

if __name__ == "__main__":
    # Запускаем асинхронную главную функцию
    asyncio.run(main())