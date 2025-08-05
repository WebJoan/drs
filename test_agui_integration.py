#!/usr/bin/env python3
"""
Скрипт для тестирования AG-UI интеграции
"""

import os
import sys
import requests
import json
from datetime import datetime

# Конфигурация
BACKEND_URL = "http://localhost:8000"
AGUI_HEALTH_URL = f"{BACKEND_URL}/api/agui/health/"
AGUI_API_URL = f"{BACKEND_URL}/api/agui/"

def test_health_endpoint():
    """Тестирует health endpoint"""
    print("🏥 Тестируем health endpoint...")
    
    try:
        response = requests.get(AGUI_HEALTH_URL, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health endpoint работает")
            print(f"   Status: {data.get('status', 'unknown')}")
            print(f"   AG-UI available: {data.get('agui_available', False)}")
            return data.get('agui_available', False)
        else:
            print(f"❌ Health endpoint вернул статус: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Не удается подключиться к health endpoint: {e}")
        return False

def test_agent_info():
    """Тестирует получение информации об агенте"""
    print("\n🤖 Тестируем информацию об агенте...")
    
    try:
        response = requests.get(AGUI_API_URL, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Информация об агенте получена")
            print(f"   Agent ID: {data.get('agent_id', 'unknown')}")
            print(f"   Name: {data.get('name', 'unknown')}")
            print(f"   Status: {data.get('status', 'unknown')}")
            return True
        else:
            print(f"❌ API endpoint вернул статус: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Не удается подключиться к API endpoint: {e}")
        return False

def test_chat_message():
    """Тестирует отправку сообщения агенту"""
    print("\n💬 Тестируем отправку сообщения...")
    
    test_message = "Привет! Это тестовое сообщение для проверки AG-UI интеграции."
    
    payload = {
        "message": test_message,
        "conversation_id": f"test_conv_{datetime.now().isoformat()}"
    }
    
    try:
        response = requests.post(
            AGUI_API_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✅ Сообщение отправлено успешно")
                print(f"   Ответ агента: {data.get('response', 'Нет ответа')[:100]}...")
                return True
            else:
                print(f"❌ Агент вернул ошибку: {data.get('error', 'Неизвестная ошибка')}")
                return False
        else:
            print(f"❌ Chat endpoint вернул статус: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Ошибка: {error_data.get('error', 'Неизвестная ошибка')}")
            except:
                print(f"   Текст ответа: {response.text[:200]}...")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Не удается отправить сообщение: {e}")
        return False

def check_environment():
    """Проверяет переменные окружения"""
    print("🔧 Проверяем переменные окружения...")
    
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if openrouter_key:
        print(f"✅ OPENROUTER_API_KEY настроен (длина: {len(openrouter_key)} символов)")
        return True
    else:
        print("❌ OPENROUTER_API_KEY не найден в переменных окружения")
        print("   Установите ключ: export OPENROUTER_API_KEY='your_key_here'")
        return False

def main():
    """Основная функция тестирования"""
    print("🧪 AG-UI Integration Test Suite")
    print("=" * 50)
    
    # Проверяем переменные окружения
    env_ok = check_environment()
    
    # Тестируем endpoints
    health_ok = test_health_endpoint()
    info_ok = test_agent_info()
    
    if health_ok and env_ok:
        chat_ok = test_chat_message()
    else:
        print("\n⚠️ Пропускаем тест чата из-за ошибок в предыдущих тестах")
        chat_ok = False
    
    # Результат
    print("\n" + "=" * 50)
    print("📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:")
    print(f"   Переменные окружения: {'✅' if env_ok else '❌'}")
    print(f"   Health endpoint: {'✅' if health_ok else '❌'}")
    print(f"   Agent info endpoint: {'✅' if info_ok else '❌'}")
    print(f"   Chat functionality: {'✅' if chat_ok else '❌'}")
    
    if all([env_ok, health_ok, info_ok, chat_ok]):
        print("\n🎉 Все тесты прошли успешно! AG-UI интеграция работает корректно.")
        return 0
    else:
        print("\n❌ Некоторые тесты не прошли. Проверьте конфигурацию и запущенные сервисы.")
        return 1

if __name__ == "__main__":
    sys.exit(main())