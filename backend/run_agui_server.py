#!/usr/bin/env python3
"""
Скрипт для запуска AG-UI сервера для интеграции с CopilotKit
"""

import os
import sys
import django
from django.conf import settings

# Добавляем путь к Django проекту
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Настраиваем Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_react_starter.settings')
django.setup()

if __name__ == "__main__":
    try:
        import agui_agent
        
        if agui_agent.agui_app is None:
            print("❌ AG-UI агент не инициализирован. Проверьте OPENROUTER_API_KEY.")
            sys.exit(1)
        
        print("🚀 Запускаем AG-UI сервер...")
        print("📡 Сервер будет доступен на: http://localhost:8001")
        print("🔧 Для остановки нажмите Ctrl+C")
        print()
        
        # Создаем переменную app для uvicorn
        app = agui_agent.app
        
        # Запускаем AG-UI сервер
        agui_agent.agui_app.serve(
            app="run_agui_server:app",
            host="127.0.0.1",
            port=8001,
            reload=True
        )
        
    except KeyboardInterrupt:
        print("\n🛑 Сервер остановлен.")
    except Exception as e:
        print(f"❌ Ошибка запуска AG-UI сервера: {e}")
        sys.exit(1)