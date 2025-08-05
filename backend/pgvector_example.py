#!/usr/bin/env python3
"""
Пример использования PgVector с Agno для векторного поиска и знаний

Этот скрипт демонстрирует как настроить и использовать PgVector как векторную 
базу данных для агентов Agno с возможностью загрузки документов и поиска.
"""

import os
import sys
from typing import List, Optional

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

class PgVectorManager:
    """
    Менеджер для работы с PgVector векторной базой данных
    """
    
    def __init__(self, table_name: str = "knowledge_base", search_type: str = "hybrid"):
        """
        Инициализация менеджера
        
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
    
    def create_agent_with_pdf_knowledge(self, pdf_urls: List[str]) -> Agent:
        """
        Создает агента с базой знаний из PDF документов
        
        Args:
            pdf_urls: Список URL PDF документов для загрузки
            
        Returns:
            Agent: Настроенный агент с базой знаний
        """
        knowledge_base = PDFUrlKnowledgeBase(
            urls=pdf_urls,
            vector_db=self.vector_db,
        )
        
        return Agent(
            model=OpenAIChat(id=AGNO_CONFIG["model_id"]),
            knowledge=knowledge_base,
            read_chat_history=True,
            show_tool_calls=AGNO_CONFIG["show_tool_calls"],
            markdown=AGNO_CONFIG["markdown"],
            debug_mode=AGNO_CONFIG["debug_mode"],
        )
    
    def create_agent_with_text_knowledge(self, texts: List[str]) -> Agent:
        """
        Создает агента с базой знаний из текстовых данных
        
        Args:
            texts: Список текстов для загрузки в базу знаний
            
        Returns:
            Agent: Настроенный агент с базой знаний
        """
        knowledge_base = TextKnowledgeBase(
            sources=texts,
            vector_db=self.vector_db,
        )
        
        return Agent(
            model=OpenAIChat(id=AGNO_CONFIG["model_id"]),
            knowledge=knowledge_base,
            read_chat_history=True,
            show_tool_calls=AGNO_CONFIG["show_tool_calls"],
            markdown=AGNO_CONFIG["markdown"],
            debug_mode=AGNO_CONFIG["debug_mode"],
        )

def example_recipes_agent():
    """
    Пример создания агента с базой знаний рецептов
    """
    print("=== Пример 1: Агент с базой знаний рецептов ===")
    
    if not validate_config():
        return
    
    # Создаем менеджер для рецептов
    manager = PgVectorManager(
        table_name=get_table_name("recipes"),
        search_type="hybrid"
    )
    
    # URL с рецептами (можно заменить на свои документы)
    pdf_urls = [
        "https://agno-public.s3.amazonaws.com/recipes/ThaiRecipes.pdf"
    ]
    
    try:
        # Создаем агента
        agent = manager.create_agent_with_pdf_knowledge(pdf_urls)
        
        # Загружаем базу знаний (только при первом запуске)
        print("📚 Загружаем базу знаний рецептов...")
        agent.knowledge.load(recreate=False, upsert=True)
        print("✅ База знаний загружена!")
        
        # Тестируем агента
        print("\n🤖 Тестируем агента:")
        agent.print_response(
            "Как приготовить том кха гай (тайский суп с курицей и кокосовым молоком)?", 
            stream=True
        )
        
        print("\n" + "="*50)
        agent.print_response(
            "Какие ингредиенты нужны для приготовления пад тай?", 
            stream=True
        )
        
    except Exception as e:
        print(f"❌ Ошибка при создании агента: {str(e)}")

def example_business_documents_agent():
    """
    Пример создания агента с бизнес-документами
    """
    print("\n=== Пример 2: Агент с бизнес-документами ===")
    
    if not validate_config():
        return
    
    # Создаем менеджер для документов
    manager = PgVectorManager(
        table_name=get_table_name("documents"),
        search_type="vector"
    )
    
    # Примеры бизнес-текстов
    business_texts = [
        """
        Наша компания специализируется на разработке веб-приложений с использованием Django и React. 
        Мы предлагаем полный цикл разработки: от проектирования архитектуры до развертывания и поддержки.
        Основные услуги: разработка API, создание пользовательских интерфейсов, интеграция с внешними сервисами,
        оптимизация производительности, настройка CI/CD процессов.
        """,
        """
        Ценовая политика компании:
        - Базовый пакет разработки: от 100,000 руб/месяц
        - Премиум пакет с дополнительными услугами: от 200,000 руб/месяц
        - Консультации по архитектуре: 15,000 руб/час
        - Срочные доработки: +50% к базовой стоимости
        - Поддержка после запуска: 30,000 руб/месяц
        """,
        """
        Технологический стек:
        Backend: Django, Django REST Framework, Celery, PostgreSQL, Redis
        Frontend: React, TypeScript, Next.js, Tailwind CSS
        DevOps: Docker, Docker Compose, Nginx, GitHub Actions
        Мониторинг: Prometheus, Grafana, Sentry
        Поиск: Meilisearch, Elasticsearch
        Векторные базы: PgVector для AI функций
        """
    ]
    
    try:
        # Создаем агента
        agent = manager.create_agent_with_text_knowledge(business_texts)
        
        # Загружаем базу знаний
        print("📚 Загружаем базу знаний бизнес-документов...")
        agent.knowledge.load(recreate=False, upsert=True)
        print("✅ База знаний загружена!")
        
        # Тестируем агента
        print("\n🤖 Тестируем агента:")
        agent.print_response(
            "Сколько стоят ваши услуги разработки?", 
            stream=True
        )
        
        print("\n" + "="*50)
        agent.print_response(
            "Какие технологии вы используете для backend разработки?", 
            stream=True
        )
        
    except Exception as e:
        print(f"❌ Ошибка при создании агента: {str(e)}")

def example_search_types():
    """
    Демонстрация различных типов поиска
    """
    print("\n=== Пример 3: Различные типы поиска ===")
    
    if not validate_config():
        return
    
    search_types = ["vector", "hybrid"]  # text поиск требует специальной настройки
    
    for search_type in search_types:
        print(f"\n--- Тестируем {search_type} поиск ---")
        
        try:
            manager = PgVectorManager(
                table_name=get_table_name("general"),
                search_type=search_type
            )
            
            # Простые тексты для демонстрации
            texts = [
                "Python - это высокоуровневый язык программирования.",
                "Django - это веб-фреймворк для Python.",
                "React - это JavaScript библиотека для создания пользовательских интерфейсов.",
                "PostgreSQL - это реляционная база данных.",
                "PgVector - это расширение PostgreSQL для работы с векторами."
            ]
            
            agent = manager.create_agent_with_text_knowledge(texts)
            agent.knowledge.load(recreate=True, upsert=True)
            
            # Тестовый запрос
            agent.print_response("Расскажи о Django", stream=True)
            
        except Exception as e:
            print(f"❌ Ошибка при тестировании {search_type}: {str(e)}")

def main():
    """
    Главная функция с демонстрацией всех примеров
    """
    print("🚀 Демонстрация PgVector с Agno")
    print("=" * 50)
    
    # Проверяем настройки
    if not validate_config():
        print("\n💡 Для настройки установите переменные окружения:")
        print("export OPENROUTER_API_KEY='your_api_key_here'")
        print("export PGVECTOR_HOST='localhost'  # опционально")
        print("export PGVECTOR_PORT='5532'       # опционально")
        return
    
    print("✅ Конфигурация корректна!")
    print(f"📊 Подключение к PgVector: {get_pgvector_db_url()}")
    
    # Запускаем примеры
    try:
        example_recipes_agent()
        example_business_documents_agent()
        example_search_types()
        
        print("\n✅ Демонстрация завершена!")
        print("\n💡 Советы по использованию:")
        print("- Используйте разные таблицы для разных типов документов")
        print("- Hybrid поиск обычно дает лучшие результаты")
        print("- При первом запуске используйте recreate=True")
        print("- Для обновлений используйте upsert=True")
        
    except KeyboardInterrupt:
        print("\n⏹️  Демонстрация прервана пользователем")
    except Exception as e:
        print(f"\n❌ Общая ошибка: {str(e)}")

if __name__ == "__main__":
    main()