#!/usr/bin/env python3
"""
Скрипт настройки и проверки PgVector интеграции

Этот скрипт помогает настроить и протестировать PgVector для работы с Agno.
"""

import os
import sys
import subprocess
import time
from typing import Optional, Tuple

# Настройка Django (если запускается отдельно)
if 'DJANGO_SETTINGS_MODULE' not in os.environ:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_react_starter.settings.development')

def check_docker():
    """Проверяет доступность Docker"""
    try:
        result = subprocess.run(['docker', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Docker доступен:", result.stdout.strip())
            return True
        else:
            print("❌ Docker не найден")
            return False
    except FileNotFoundError:
        print("❌ Docker не установлен")
        return False

def check_docker_compose():
    """Проверяет доступность Docker Compose"""
    try:
        result = subprocess.run(['docker-compose', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Docker Compose доступен:", result.stdout.strip())
            return True
        else:
            # Пробуем docker compose (новый синтаксис)
            result = subprocess.run(['docker', 'compose', 'version'], capture_output=True, text=True)
            if result.returncode == 0:
                print("✅ Docker Compose доступен:", result.stdout.strip())
                return True
            else:
                print("❌ Docker Compose не найден")
                return False
    except FileNotFoundError:
        print("❌ Docker Compose не установлен")
        return False

def start_pgvector_container():
    """Запускает PgVector контейнер"""
    print("\n🚀 Запускаем PgVector контейнер...")
    
    try:
        # Пробуем docker-compose
        result = subprocess.run(['docker-compose', 'up', '-d', 'pgvector'], capture_output=True, text=True)
        if result.returncode != 0:
            # Пробуем docker compose
            result = subprocess.run(['docker', 'compose', 'up', '-d', 'pgvector'], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ PgVector контейнер запущен")
            return True
        else:
            print("❌ Ошибка запуска контейнера:")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Ошибка при запуске контейнера: {str(e)}")
        return False

def wait_for_pgvector(max_attempts: int = 30) -> bool:
    """Ждет готовности PgVector"""
    print("\n⏳ Ожидаем готовности PgVector...")
    
    for attempt in range(max_attempts):
        try:
            result = subprocess.run([
                'docker', 'exec', 'django_react_starter_pgvector',
                'pg_isready', '-U', 'ai', '-d', 'ai'
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                print("✅ PgVector готов к работе")
                return True
            
        except Exception:
            pass
        
        print(f"⏳ Попытка {attempt + 1}/{max_attempts}...")
        time.sleep(2)
    
    print("❌ PgVector не готов после ожидания")
    return False

def check_environment():
    """Проверяет переменные окружения"""
    print("\n🔍 Проверяем переменные окружения...")
    
    required_vars = ['OPENROUTER_API_KEY']
    optional_vars = {
        'PGVECTOR_HOST': 'localhost',
        'PGVECTOR_PORT': '5532',
        'PGVECTOR_DB': 'ai',
        'PGVECTOR_USER': 'ai',
        'PGVECTOR_PASSWORD': 'ai'
    }
    
    all_good = True
    
    # Проверяем обязательные переменные
    for var in required_vars:
        value = os.getenv(var)
        if value:
            print(f"✅ {var}: *** (установлена)")
        else:
            print(f"❌ {var}: не установлена")
            all_good = False
    
    # Проверяем опциональные переменные
    print("\n📋 Опциональные переменные:")
    for var, default in optional_vars.items():
        value = os.getenv(var, default)
        print(f"   {var}: {value}")
    
    return all_good

def test_connection():
    """Тестирует подключение к PgVector"""
    print("\n🔌 Тестируем подключение к PgVector...")
    
    try:
        from pgvector_config import get_pgvector_db_url, validate_config
        
        # Проверяем конфигурацию
        if not validate_config():
            print("❌ Конфигурация некорректна")
            return False
        
        # Пробуем создать соединение
        from agno.vectordb.pgvector import PgVector
        
        vector_db = PgVector(
            table_name="setup_test",
            db_url=get_pgvector_db_url()
        )
        
        print("✅ Соединение с PgVector установлено")
        print(f"📊 URL подключения: {get_pgvector_db_url()}")
        return True
        
    except ImportError as e:
        print(f"❌ Ошибка импорта: {str(e)}")
        print("💡 Убедитесь что установлены все зависимости: uv sync")
        return False
    except Exception as e:
        print(f"❌ Ошибка подключения: {str(e)}")
        return False

def test_basic_functionality():
    """Тестирует базовую функциональность"""
    print("\n🧪 Тестируем базовую функциональность...")
    
    try:
        from agno.agent import Agent
        from agno.models.openai import OpenAIChat
        from agno.knowledge.text import TextKnowledgeBase
        from agno.vectordb.pgvector import PgVector
        from pgvector_config import get_pgvector_db_url
        
        # Создаем простую базу знаний
        vector_db = PgVector(
            table_name="test_setup",
            db_url=get_pgvector_db_url()
        )
        
        knowledge_base = TextKnowledgeBase(
            sources=["Это тестовый документ для проверки работы PgVector с Agno."],
            vector_db=vector_db
        )
        
        # Загружаем данные
        print("📚 Загружаем тестовые данные...")
        knowledge_base.load(recreate=True, upsert=True)
        
        # Создаем агента
        agent = Agent(
            model=OpenAIChat(id="gpt-4o"),
            knowledge=knowledge_base,
            show_tool_calls=False,
            markdown=False
        )
        
        # Тестовый запрос
        print("🤖 Выполняем тестовый запрос...")
        response = agent.run("Что в тестовом документе?")
        
        if response:
            print("✅ Базовая функциональность работает")
            print(f"📝 Ответ агента: {str(response)[:100]}...")
            return True
        else:
            print("❌ Агент не ответил")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка при тестировании: {str(e)}")
        return False

def show_usage_examples():
    """Показывает примеры использования"""
    print("\n📖 Примеры использования:")
    print("\n1. Синхронный пример:")
    print("   python pgvector_example.py")
    
    print("\n2. Асинхронный пример:")
    print("   python pgvector_async_example.py")
    
    print("\n3. Интеграция в Django:")
    print("   from pgvector_config import get_pgvector_db_url")
    print("   from agno.vectordb.pgvector import PgVector")
    
    print("\n📚 Документация:")
    print("   Смотрите PGVECTOR_README.md для подробной информации")

def main():
    """Главная функция настройки"""
    print("🚀 Настройка PgVector для Agno")
    print("=" * 40)
    
    # Проверяем Docker
    if not check_docker():
        print("\n💡 Установите Docker для продолжения")
        return False
    
    if not check_docker_compose():
        print("\n💡 Установите Docker Compose для продолжения")
        return False
    
    # Проверяем переменные окружения
    env_ok = check_environment()
    if not env_ok:
        print("\n💡 Настройте переменные окружения:")
        print("export OPENROUTER_API_KEY='your_api_key_here'")
        print("\nИли создайте файл backend/.env с содержимым:")
        print("OPENROUTER_API_KEY=your_api_key_here")
        
        # Спрашиваем, продолжать ли без API ключа
        response = input("\nПродолжить без OPENROUTER_API_KEY? (тестирование будет ограничено) [y/N]: ")
        if response.lower() != 'y':
            return False
    
    # Запускаем контейнер
    if not start_pgvector_container():
        return False
    
    # Ждем готовности
    if not wait_for_pgvector():
        return False
    
    # Тестируем подключение
    if not test_connection():
        return False
    
    # Тестируем функциональность (только если есть API ключ)
    if os.getenv('OPENROUTER_API_KEY'):
        if not test_basic_functionality():
            print("⚠️  Базовое тестирование не прошло, но PgVector настроен")
    else:
        print("⚠️  Пропускаем функциональное тестирование (нет OPENROUTER_API_KEY)")
    
    print("\n✅ Настройка PgVector завершена!")
    show_usage_examples()
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⏹️  Настройка прервана пользователем")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Неожиданная ошибка: {str(e)}")
        sys.exit(1)