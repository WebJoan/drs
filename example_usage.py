#!/usr/bin/env python3
"""
Пример использования новой системы персонализации писем с Agno

Этот скрипт демонстрирует как использовать новую функциональность
для генерации персонализированных писем с данными о продажах.
"""

import os
import django
from django.conf import settings

# Настройка Django (если запускается отдельно)
if not settings.configured:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_react_starter.settings.development')
    django.setup()

from email_marketing.tasks import (
    generate_sales_insights_task,
    generate_personalized_ai_email_task
)
from customer.models import Company
from person.models import Person
from user.models import User


def example_generate_sales_insights():
    """
    Пример генерации инсайтов по продажам компании
    """
    print("=== Пример 1: Генерация инсайтов по продажам ===")
    
    # Получаем первую активную компанию и персону
    try:
        company = Company.objects.filter(status='active').first()
        person = Person.objects.filter(company=company, status='active').first()
        
        if not company or not person:
            print("Ошибка: Не найдена активная компания или персона")
            return
        
        print(f"Компания: {company.name}")
        print(f"Персона: {person.get_full_name()} ({person.position})")
        
        # Запускаем генерацию инсайтов
        result = generate_sales_insights_task.delay(
            company_id=company.id,
            person_id=person.id
        )
        
        print(f"Задача запущена с ID: {result.id}")
        print("Для получения результата используйте API endpoint task_status")
        
    except Exception as e:
        print(f"Ошибка при генерации инсайтов: {str(e)}")


def example_generate_personalized_email():
    """
    Пример генерации персонализированного письма
    """
    print("\n=== Пример 2: Генерация персонализированного письма ===")
    
    try:
        # Получаем sales менеджера и персону для письма
        sales_manager = User.objects.filter(role='sales').first()
        person = Person.objects.filter(status='active').first()
        
        if not sales_manager or not person:
            print("Ошибка: Не найден sales менеджер или персона")
            return
        
        print(f"Sales Manager: {sales_manager.get_full_name()}")
        print(f"Получатель: {person.get_full_name()} ({person.company.name})")
        
        # Запускаем генерацию персонализированного письма
        result = generate_personalized_ai_email_task.delay(
            user_id=sales_manager.id,
            recipient_id=person.id,
            context="Предложение новых решений на основе анализа ваших покупок",
            tone="professional",
            purpose="offer",
            products=[],  # Можно добавить ID товаров
            include_sales_data=True  # Включаем данные о продажах
        )
        
        print(f"Задача запущена с ID: {result.id}")
        print("Письмо будет создано с персонализацией на основе данных о продажах")
        
    except Exception as e:
        print(f"Ошибка при генерации письма: {str(e)}")


def example_api_calls():
    """
    Примеры API вызовов через curl
    """
    print("\n=== Пример 3: API вызовы ===")
    
    print("1. Генерация инсайтов по продажам:")
    print("""
curl -X POST http://localhost:8000/api/v1/email_marketing/emails/generate_sales_insights/ \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "company_id": 1,
    "person_id": 1
  }'
""")
    
    print("2. Генерация персонализированного письма:")
    print("""
curl -X POST http://localhost:8000/api/v1/email_marketing/emails/generate_personalized/ \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipient_id": 1,
    "context": "Предложение решений для вашей отрасли",
    "tone": "professional",
    "purpose": "offer",
    "products": [1, 2, 3],
    "include_sales_data": true
  }'
""")
    
    print("3. Проверка статуса задачи:")
    print("""
curl -X GET "http://localhost:8000/api/v1/email_marketing/emails/task_status/?task_id=TASK_ID_HERE" \\
  -H "Authorization: Bearer YOUR_TOKEN"
""")


def example_best_practices():
    """
    Лучшие практики использования системы
    """
    print("\n=== Лучшие практики ===")
    
    practices = [
        "1. Всегда проверяйте наличие OPENROUTER_API_KEY в переменных окружения",
        "2. Используйте include_sales_data=True для максимальной персонализации",
        "3. Адаптируйте тон письма в зависимости от должности получателя:",
        "   • 'formal' для руководителей высшего звена",
        "   • 'professional' для менеджеров среднего звена", 
        "   • 'friendly' для специалистов и младших менеджеров",
        "4. Указывайте релевантные товары в поле 'products' для лучшего контекста",
        "5. Мониторьте статус задач через API endpoint task_status",
        "6. Логируйте результаты для анализа эффективности писем",
        "7. Используйте A/B тестирование между обычной и персонализированной генерацией"
    ]
    
    for practice in practices:
        print(practice)


def main():
    """
    Главная функция с демонстрацией всех примеров
    """
    print("🚀 Демонстрация системы персонализации писем с Agno")
    print("=" * 60)
    
    # Проверяем настройки
    if not os.getenv('OPENROUTER_API_KEY'):
        print("⚠️  ВНИМАНИЕ: OPENROUTER_API_KEY не настроен!")
        print("Установите переменную окружения для работы с OpenRouter API")
        print("export OPENROUTER_API_KEY='your_api_key_here'")
        return
    
    # Запускаем примеры
    example_generate_sales_insights()
    example_generate_personalized_email()
    example_api_calls()
    example_best_practices()
    
    print("\n✅ Демонстрация завершена!")
    print("Изучите созданные задачи в Celery и результаты в базе данных.")


if __name__ == "__main__":
    main()