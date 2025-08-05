#!/usr/bin/env python3
"""
Конфигурация для PgVector векторной базы данных

Этот модуль содержит настройки подключения и утилиты для работы с PgVector
в рамках проекта Django с использованием библиотеки Agno.
"""

import os
from typing import Optional

# Настройки подключения к PgVector
PGVECTOR_CONFIG = {
    "host": os.getenv("PGVECTOR_HOST", "localhost"),
    "port": int(os.getenv("PGVECTOR_PORT", "5532")),
    "database": os.getenv("PGVECTOR_DB", "ai"),
    "user": os.getenv("PGVECTOR_USER", "ai"),
    "password": os.getenv("PGVECTOR_PASSWORD", "ai"),
}

# URL для подключения к базе данных PgVector
def get_pgvector_db_url() -> str:
    """
    Возвращает URL для подключения к PgVector базе данных
    
    Returns:
        str: URL подключения в формате postgresql+psycopg://user:password@host:port/database
    """
    config = PGVECTOR_CONFIG
    return f"postgresql+psycopg://{config['user']}:{config['password']}@{config['host']}:{config['port']}/{config['database']}"

# Настройки для агентов Agno
AGNO_CONFIG = {
    "model_id": os.getenv("AGNO_MODEL_ID", "gpt-4.1"),
    "openrouter_api_key": os.getenv("OPENROUTER_API_KEY"),
    "show_tool_calls": True,
    "markdown": True,
    "debug_mode": os.getenv("AGNO_DEBUG", "false").lower() == "true",
}

# Настройки поиска
SEARCH_CONFIG = {
    "default_search_type": "hybrid",  # vector, text, или hybrid
    "vector_score_weight": 0.5,      # Вес векторного поиска в гибридном режиме
    "top_k": 5,                      # Количество результатов поиска
}

def validate_config() -> bool:
    """
    Проверяет корректность конфигурации
    
    Returns:
        bool: True если конфигурация корректна, иначе False
    """
    if not AGNO_CONFIG["openrouter_api_key"]:
        print("⚠️  ВНИМАНИЕ: OPENROUTER_API_KEY не настроен!")
        print("Установите переменную окружения для работы с OpenRouter API")
        return False
    
    # Можно добавить дополнительные проверки здесь
    return True

def get_table_name(purpose: str = "general") -> str:
    """
    Возвращает имя таблицы для конкретной цели
    
    Args:
        purpose: Назначение таблицы (general, recipes, documents, etc.)
        
    Returns:
        str: Имя таблицы
    """
    table_names = {
        "general": "knowledge_base",
        "recipes": "recipes",
        "documents": "documents",
        "sales": "sales_data",
        "products": "products",
        "customers": "customers",
    }
    
    return table_names.get(purpose, "knowledge_base")