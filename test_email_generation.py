#!/usr/bin/env python3
"""
Тестовый скрипт для проверки генерации AI писем с исправлениями Agno
"""
import os
import sys
import django

# Добавляем путь к backend в PYTHONPATH
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.insert(0, backend_path)

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'drs.settings')
django.setup()

try:
    from email_marketing.tasks import generate_ai_email_structured_task
    from user.models import User
    from person.models import Person
    from email_marketing.models import AiEmail
except ImportError as e:
    print(f"❌ Ошибка импорта: {e}")
    print("Убедитесь, что Django настроен правильно и все зависимости установлены")
    sys.exit(1)

def test_email_generation():
    """Тестирует генерацию email с реальными данными"""
    
    print("🔧 Тестирование исправлений генерации AI писем с Agno")
    print("=" * 60)
    
    print("🔍 Поиск пользователей и получателей...")
    
    # Найдем первого sales пользователя
    try:
        user = User.objects.filter(role='sales').first()
        if not user:
            user = User.objects.first()
            print(f"⚠️  Sales пользователь не найден, используем первого: {user}")
        else:
            print(f"✅ Найден sales пользователь: {user.first_name} {user.last_name}")
            
        if not user:
            print("❌ Нет пользователей в системе")
            return
            
    except Exception as e:
        print(f"❌ Ошибка поиска пользователя: {e}")
        return
    
    # Найдем первого получателя
    try:
        recipient = Person.objects.first()
        if not recipient:
            print("❌ Получатели не найдены в базе данных")
            print("💡 Создайте хотя бы одного получателя в админке Django")
            return
            
        print(f"✅ Найден получатель: {recipient.get_full_name()} ({recipient.email})")
        if recipient.company:
            print(f"   Компания: {recipient.company.name}")
        else:
            print("   Компания: не указана")
            
    except Exception as e:
        print(f"❌ Ошибка поиска получателя: {e}")
        return
    
    # Проверим настройки окружения
    openrouter_key = os.getenv('OPENROUTER_API_KEY')
    if openrouter_key:
        print(f"✅ OPENROUTER_API_KEY настроен: {openrouter_key[:10]}...{openrouter_key[-5:]}")
    else:
        print("⚠️  OPENROUTER_API_KEY не найден в переменных окружения")
        print("   Письмо будет создано с fallback содержимым")
    
    print("\n📧 Запуск генерации письма...")
    print("-" * 40)
    
    # Запускаем генерацию письма
    try:
        result = generate_ai_email_structured_task(
            user_id=user.id,
            recipient_id=recipient.id,
            context="Тестовое письмо для проверки исправлений Agno. Проверяем корректность персонализации.",
            tone='professional',
            purpose='offer'
        )
        
        print(f"📊 Результат генерации:")
        print(f"   Success: {result.get('success', False)}")
        print(f"   Email ID: {result.get('email_id', 'N/A')}")
        print(f"   Message: {result.get('message', 'N/A')}")
        
        if result.get('error'):
            print(f"❌ Ошибка: {result.get('error')}")
            
        if result.get('success'):
            email_id = result.get('email_id')
            subject = result.get('subject', 'N/A')
            
            print(f"\n✅ Письмо успешно создано!")
            print(f"📋 ID письма: {email_id}")
            print(f"📨 Тема: {subject}")
            
            # Получаем и показываем содержимое письма
            try:
                email = AiEmail.objects.get(id=email_id)
                print(f"\n📄 Содержимое письма:")
                print("=" * 60)
                print(f"Тема: {email.subject}")
                print("-" * 60)
                print(email.body)
                print("=" * 60)
                
                # Проверяем, что имена не захардкожены
                body_lower = email.body.lower()
                if "иван иванов" in body_lower or "иванов влад" in body_lower:
                    print("❌ ПРОБЛЕМА: Найдены захардкоженные имена!")
                    print("   'Иван Иванов' или 'Иванов Влад' все еще используются")
                else:
                    print("✅ ИСПРАВЛЕНО: Захардкоженные имена не найдены")
                
                # Проверяем использование реальных данных
                real_name_used = recipient.get_full_name().lower() in body_lower
                sender_name_used = (user.first_name.lower() in body_lower and 
                                   user.last_name.lower() in body_lower)
                
                print(f"\n🔍 Анализ персонализации:")
                print(f"   ✅ Имя получателя использовано: {real_name_used}")
                print(f"   ✅ Имя отправителя использовано: {sender_name_used}")
                
                if real_name_used and sender_name_used:
                    print("🎉 ОТЛИЧНО: Письмо правильно персонализировано!")
                else:
                    print("⚠️  ВНИМАНИЕ: Возможны проблемы с персонализацией")
                
            except AiEmail.DoesNotExist:
                print(f"❌ Письмо с ID {email_id} не найдено в базе данных")
            except Exception as e:
                print(f"❌ Ошибка при чтении письма: {e}")
                
        else:
            print("❌ Письмо не было создано")
            
    except Exception as e:
        print(f"❌ Критическая ошибка: {e}")
        import traceback
        print("\n🔍 Детали ошибки:")
        traceback.print_exc()

def main():
    """Главная функция"""
    try:
        test_email_generation()
        print("\n🏁 Тестирование завершено")
    except KeyboardInterrupt:
        print("\n\n⏹️  Тестирование прервано пользователем")
    except Exception as e:
        print(f"\n❌ Неожиданная ошибка: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()