#!/usr/bin/env python3
"""
Тестовый скрипт для проверки API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_endpoint(endpoint, description):
    """Тестирование одного endpoint'а"""
    print(f"\n🧪 Тестирование {description}")
    print(f"URL: {BASE_URL}{endpoint}")
    
    try:
        response = requests.get(f"{BASE_URL}{endpoint}")
        print(f"Статус: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Успешно!")
            if isinstance(data, dict) and 'results' in data:
                print(f"Количество записей: {len(data['results'])}")
                if data['results']:
                    print(f"Первая запись: {json.dumps(data['results'][0], indent=2, ensure_ascii=False)}")
            else:
                print(f"Данные: {json.dumps(data[:2] if isinstance(data, list) else data, indent=2, ensure_ascii=False)}")
        else:
            print(f"❌ Ошибка!")
            print(f"Ответ: {response.text}")
            
    except Exception as e:
        print(f"❌ Исключение: {e}")

def main():
    print("🚀 Тестирование API endpoints для email-marketing")
    
    # Тестируем все три endpoint'а
    test_endpoint("/person/persons/?status=active", "Получатели (Person)")
    test_endpoint("/users/?role=sales", "Менеджеры продаж (Users)")
    test_endpoint("/goods/products/", "Товары (Products)")
    
    print("\n" + "="*50)
    print("Тестирование завершено!")

if __name__ == "__main__":
    main()