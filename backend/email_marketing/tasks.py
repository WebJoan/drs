import os
import json
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal
from pydantic import BaseModel, Field
from celery import shared_task
from django.db import transaction
from django.conf import settings
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.utils import timezone
from agno.agent import Agent
from agno.models.openrouter import OpenRouter
from .models import AiEmail, AiEmailAttachment
from person.models import Person
from goods.models import Product
from user.models import User
from customer.models import Company
from sales.models import Invoice, InvoiceLine

logger = logging.getLogger(__name__)

# OpenRouter API конфигурация через Agno
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Получаем очереди из настроек, если доступны
RABBITMQ_EMAIL_QUEUE = getattr(settings, 'RABBITMQ_EMAIL_QUEUE', 'default')
RABBITMQ_GOODS_QUEUE = getattr(settings, 'RABBITMQ_GOODS_QUEUE', 'default')


def _create_fallback_email_body(user, recipient, context='', tone='professional', purpose='offer'):
    """
    Создает fallback содержимое письма, когда AI не может сгенерировать контент
    """
    # Определяем тон обращения
    greeting = "Уважаемый(ая)" if tone == 'formal' else "Здравствуйте,"
    
    # Определяем цель письма
    purpose_text = {
        'offer': 'хотел бы предложить вам наши услуги',
        'follow_up': 'хотел бы продолжить наше обсуждение',
        'introduction': 'хотел бы познакомить вас с нашей компанией',
        'meeting': 'хотел бы назначить встречу для обсуждения сотрудничества'
    }.get(purpose, 'хотел бы обсудить возможности сотрудничества')
    
    # Анализируем контекст на предмет данных о продажах
    has_sales_data = 'Данные о клиенте:' in context
    
    # Формируем основной текст
    body = f"""{greeting} {recipient.get_full_name()}!

Меня зовут {user.first_name} {user.last_name}, я работаю менеджером по продажам.

{purpose_text.capitalize()}."""
    
    # Добавляем контекст, если есть
    if context.strip():
        if has_sales_data:
            # Если есть данные о продажах, делаем более персонализированное письмо
            body += f"""

На основе анализа вашей истории сотрудничества с нами, я подготовил персонализированное предложение:

{context.strip()}

Учитывая ваши потребности и предыдущий опыт работы с нами, я готов предложить специальные условия и индивидуальный подход."""
        else:
            body += f"\n\n{context.strip()}"
    
    # Добавляем призыв к действию
    if has_sales_data:
        body += f"""

Буду рад обсудить детали нашего предложения и возможности дальнейшего сотрудничества. 
Готов ответить на любые вопросы и предоставить дополнительную информацию по интересующим вас товарам.

С уважением,
{user.first_name} {user.last_name}
Менеджер по продажам
Персональный подход к каждому клиенту"""
    else:
        body += f"""

Буду рад обсудить детали и ответить на ваши вопросы.

С уважением,
{user.first_name} {user.last_name}
Менеджер по продажам"""
    
    return body


# Pydantic модели для структурированного ответа AI
class SalesInsight(BaseModel):
    """Инсайт по продажам компании"""
    metric_name: str = Field(description="Название метрики")
    value: str = Field(description="Значение метрики")
    trend: str = Field(description="Тренд (рост/снижение/стабильно)")
    description: str = Field(description="Описание инсайта")


class PersonalizationData(BaseModel):
    """Персонализированные данные для письма"""
    company_name: str = Field(description="Название компании")
    person_name: str = Field(description="Имя получателя")
    person_position: str = Field(description="Должность получателя")
    total_purchases: str = Field(description="Общая сумма покупок")
    last_purchase_date: Optional[str] = Field(description="Дата последней покупки")
    top_products: List[str] = Field(description="Топ покупаемых товаров")
    sales_insights: List[SalesInsight] = Field(description="Ключевые инсайты по продажам")
    recommendations: List[str] = Field(description="Рекомендации для персонализации письма")


class EmailContent(BaseModel):
    """Структура сгенерированного письма"""
    subject: str = Field(description="Тема письма")
    body: str = Field(description="Текст письма")
    
    class Config:
        json_encoders = {
            str: lambda v: v.strip()
        }


class PersonalizedEmailContent(BaseModel):
    """Структура персонализированного письма с данными о продажах"""
    subject: str = Field(description="Персонализированная тема письма")
    body: str = Field(description="Персонализированный текст письма с данными о продажах")
    key_points: List[str] = Field(description="Ключевые моменты, использованные в письме")
    
    class Config:
        json_encoders = {
            str: lambda v: v.strip()
        }


@shared_task(queue=RABBITMQ_GOODS_QUEUE)
def generate_ai_email_task(user_id, recipient_id, context='', tone='professional', 
                          purpose='offer', products=None, email_id=None):
    """
    Celery-задача для генерации AI письма с помощью Agno + OpenRouter
    """
    if not OPENROUTER_API_KEY:
        logger.error("OPENROUTER_API_KEY не настроен в переменных окружения")
        return {"error": "OpenRouter API key не настроен"}
    
    try:
        with transaction.atomic():
            # Получаем пользователя и получателя
            user = User.objects.get(id=user_id)
            recipient = Person.objects.get(id=recipient_id)
            
            # Получаем информацию о товарах, если указаны
            products_info = ""
            if products:
                product_objects = Product.objects.filter(id__in=products)
                products_info = "\n".join([
                    f"- {product.name}" for product in product_objects
                ])
            
            # Инициализируем Agno Agent с OpenRouter
            agent = Agent(
                model=OpenRouter(
                    id="google/gemini-2.5-flash",
                    api_key=OPENROUTER_API_KEY,
                    temperature=0.7,
                    max_tokens=1000
                ),
                structured_outputs=True
            )
            
            # Формируем промпт для AI
            prompt = f"""
Ты профессиональный менеджер по продажам. Создай персонализированное email письмо на русском языке.

Информация о получателе:
- Имя: {recipient.get_full_name()}
- Email: {recipient.email}
- Компания: {getattr(recipient.company, 'name', 'Не указана') if recipient.company else 'Не указана'}

Информация об отправителе:
- Имя: {user.first_name} {user.last_name}
- Должность: Sales Manager

Параметры письма:
- Тон: {tone}
- Цель: {purpose}
- Контекст: {context}

{f"Товары для упоминания в письме:\n{products_info}" if products_info else ""}

Создай профессиональное письмо с подходящей темой. Письмо должно быть персонализированным, 
учитывать российский деловой этикет и побуждать к действию.

Верни результат в JSON формате:
{{
    "subject": "Тема письма",
    "body": "Текст письма"
}}
"""
            
            # Получаем ответ от AI через Agno
            response = agent.run(prompt)
            
            # Отладочная информация
            logger.info(f"AI response type: {type(response)}")
            logger.info(f"AI response content: {response}")
            
            # Парсим JSON ответ
            if hasattr(response, 'content'):
                content = response.content
            elif hasattr(response, 'final_output'):
                content = str(response.final_output)
            else:
                content = str(response)
            
            logger.info(f"Extracted content: {content}")
            
            # Пытаемся извлечь JSON из ответа
            try:
                # Ищем JSON блок в ответе
                if '```json' in content:
                    json_start = content.find('```json') + 7
                    json_end = content.find('```', json_start)
                    json_content = content[json_start:json_end].strip()
                elif '{' in content and '}' in content:
                    json_start = content.find('{')
                    json_end = content.rfind('}') + 1
                    json_content = content[json_start:json_end]
                else:
                    json_content = content
                
                email_data = json.loads(json_content)
            except json.JSONDecodeError:
                # Если не удалось распарсить JSON, создаем структуру вручную
                lines = content.split('\n')
                subject = "Персональное предложение"
                body = content
                
                # Пытаемся найти тему в ответе
                for line in lines:
                    if 'тема' in line.lower() or 'subject' in line.lower():
                        subject = line.split(':', 1)[-1].strip().strip('"')
                        break
                
                email_data = {
                    "subject": subject,
                    "body": body
                }
            
            # Создаем или обновляем письмо
            if email_id:
                # Обновляем существующее письмо
                email = AiEmail.objects.get(id=email_id)
                email.subject = email_data.get('subject', 'Персональное предложение')
                email.body = email_data.get('body', content)
                email.status = 'draft'
                email.save()
            else:
                # Создаем новое письмо
                email = AiEmail.objects.create(
                    sales_manager=user,
                    recipient=recipient,
                    subject=email_data.get('subject', 'Персональное предложение'),
                    body=email_data.get('body', content),
                    status='draft'
                )
            
            logger.info(f"AI письмо успешно {'обновлено' if email_id else 'создано'}: {email.id}")
            return {
                "success": True,
                "email_id": email.id,
                "subject": email.subject,
                "message": f"Письмо успешно {'обновлено' if email_id else 'создано'}"
            }
            
    except User.DoesNotExist:
        logger.error(f"Пользователь с ID {user_id} не найден")
        return {"error": "Пользователь не найден"}
    except Person.DoesNotExist:
        logger.error(f"Получатель с ID {recipient_id} не найден")
        return {"error": "Получатель не найден"}
    except Exception as e:
        logger.error(f"Ошибка при генерации письма через Agno: {str(e)}")
        return {"error": f"Ошибка генерации AI письма: {str(e)}"}


@shared_task(queue=RABBITMQ_GOODS_QUEUE)
def generate_ai_email_structured_task(user_id, recipient_id, context='', tone='professional', 
                                     purpose='offer', products=None, email_id=None):
    """
    Celery-задача для генерации AI письма с помощью Agno + OpenRouter + Pydantic структуры
    """
    if not OPENROUTER_API_KEY:
        logger.error("OPENROUTER_API_KEY не настроен в переменных окружения")
        return {"error": "OpenRouter API key не настроен"}
    
    try:
        with transaction.atomic():
            # Получаем пользователя и получателя
            user = User.objects.get(id=user_id)
            recipient = Person.objects.get(id=recipient_id)
            
            # Получаем информацию о товарах, если указаны
            products_info = ""
            if products:
                product_objects = Product.objects.filter(id__in=products)
                products_info = "\n".join([
                    f"- {product.name}: {getattr(product, 'description', '')}" for product in product_objects
                ])
            
            # Инициализируем Agno Agent с OpenRouter и структурированным выводом
            try:
                agent = Agent(
                    model=OpenRouter(
                        id="google/gemini-2.5-flash",
                        api_key=OPENROUTER_API_KEY,
                        temperature=0.7,
                        max_tokens=1200
                    ),
                    structured_outputs=True,
                    response_model=EmailContent
                )
                logger.info("Агент инициализирован успешно")
            except Exception as e:
                logger.error(f"Ошибка инициализации агента: {e}")
                # Fallback - пытаемся без structured_outputs
                agent = Agent(
                    model=OpenRouter(
                        id="google/gemini-2.5-flash",
                        api_key=OPENROUTER_API_KEY,
                        temperature=0.7,
                        max_tokens=1200
                    ),
                    structured_outputs=False
                )
                logger.info("Агент инициализирован без структурированного вывода")
            
            # Формируем промпт для AI
            prompt = f"""
Создай персонализированное email письмо на русском языке для B2B продаж.

Информация о получателе:
- Имя: {recipient.get_full_name()}
- Email: {recipient.email}
- Компания: {getattr(recipient.company, 'name', 'Не указана') if recipient.company else 'Не указана'}

Информация об отправителе:
- Имя: {user.first_name} {user.last_name}
- Должность: Sales Manager

Параметры письма:
- Тон: {tone} (professional/friendly/formal)
- Цель: {purpose} (offer/follow_up/introduction/meeting)
- Дополнительный контекст: {context}

{f"Товары/услуги для презентации:\n{products_info}" if products_info else ""}

Требования к письму:
1. Персонализированная тема (не более 50 символов)
2. Вежливое обращение по имени
3. Краткое введение и цель письма
4. Выгоды для получателя
5. Четкий призыв к действию
6. Профессиональная подпись
7. Учет российского делового этикета

Создай привлекательное письмо, которое будет интересно прочитать и на которое захочется ответить.
"""
            
            # Получаем структурированный ответ от AI
            response = agent.run(prompt)
            
            # Отладочная информация для понимания структуры ответа
            logger.info(f"Email response type: {type(response)}")
            logger.info(f"Email response content: {response}")
            
            # Извлекаем данные из RunResponse объекта
            email_content = None
            
            # Используем различные способы получения результата
            if hasattr(response, 'final_output') and response.final_output is not None:
                email_content = response.final_output
                logger.info(f"Found email data in final_output: {type(email_content)}")
            elif hasattr(response, 'content'):
                email_content = response.content
                logger.info(f"Found email data in content: {type(email_content)}")
            elif hasattr(response, 'result'):
                email_content = response.result
                logger.info(f"Found email data in result: {type(email_content)}")
            else:
                logger.warning("No standard output found in response, using direct access")
                email_content = response
            
            # Создаем или обновляем письмо с защитой от ошибок атрибутов
            try:
                # Пытаемся извлечь subject и body
                if hasattr(email_content, 'subject') and hasattr(email_content, 'body'):
                    subject = email_content.subject
                    body = email_content.body
                    logger.info("Successfully extracted subject and body from structured response")
                elif isinstance(email_content, dict):
                    subject = email_content.get('subject', f'Персональное предложение для {recipient.get_full_name()}')
                    body = email_content.get('body')
                    if not body:
                        logger.warning("AI response missing 'body' field, creating fallback content")
                        body = _create_fallback_email_body(user, recipient, context, tone, purpose)
                    logger.info("Successfully extracted from dict response")
                elif hasattr(email_content, '__dict__'):
                    # Используем __dict__ для получения атрибутов объекта
                    content_dict = email_content.__dict__
                    logger.info(f"Object __dict__ content: {content_dict}")
                    subject = content_dict.get('subject', f'Персональное предложение для {recipient.get_full_name()}')
                    body = content_dict.get('body')
                    if not body:
                        logger.warning("AI response object missing 'body' attribute, creating fallback content")
                        body = _create_fallback_email_body(user, recipient, context, tone, purpose)
                    logger.info("Successfully extracted from object __dict__")
                else:
                    # Попытка извлечь данные из текстового ответа AI
                    logger.warning(f"Trying to parse text response: {type(email_content)}")
                    text_content = str(email_content)
                    
                    # Пытаемся найти тему и тело письма в тексте
                    subject = f"Персональное предложение для {recipient.get_full_name()}"
                    body = text_content
                    
                    # Ищем структуру письма в тексте
                    lines = text_content.split('\n')
                    for i, line in enumerate(lines):
                        line_lower = line.lower().strip()
                        if any(keyword in line_lower for keyword in ['тема:', 'subject:', 'заголовок:']):
                            # Нашли тему
                            subject_text = line.split(':', 1)[-1].strip().strip('"').strip("'")
                            if subject_text:
                                subject = subject_text
                        elif line_lower.startswith('уважаемый') or line_lower.startswith('здравствуйте'):
                            # Нашли начало письма
                            body = '\n'.join(lines[i:])
                            break
                    
                    # Если не нашли структурированное письмо, используем fallback
                    if body == text_content and isinstance(text_content, str) and len(text_content) < 50:
                        logger.warning("Text response too short, using fallback content")
                        body = _create_fallback_email_body(user, recipient, context, tone, purpose)
                    
                    logger.info(f"Extracted from text - Subject: {subject[:50]}..., Body length: {len(body)}")
                
                if email_id:
                    # Обновляем существующее письмо
                    email = AiEmail.objects.get(id=email_id)
                    email.subject = subject
                    email.body = body
                    email.status = 'draft'
                    email.save()
                else:
                    # Создаем новое письмо
                    email = AiEmail.objects.create(
                        sales_manager=user,
                        recipient=recipient,
                        subject=subject,
                        body=body,
                        status='draft'
                    )
                    
            except Exception as e:
                logger.error(f"Error processing email content: {e}")
                # Создаем базовое письмо при ошибке извлечения данных
                logger.error(f"Failed to extract content from AI response, creating fallback email")
                fallback_subject = f"Персональное предложение для {recipient.get_full_name()}"
                fallback_body = _create_fallback_email_body(user, recipient, context, tone, purpose)
                
                if email_id:
                    email = AiEmail.objects.get(id=email_id)
                    email.subject = fallback_subject
                    email.body = fallback_body
                    email.status = 'draft'
                    email.save()
                else:
                    email = AiEmail.objects.create(
                        sales_manager=user,
                        recipient=recipient,
                        subject=fallback_subject,
                        body=fallback_body,
                        status='draft'
                    )
            
            logger.info(f"AI письмо (структурированное) успешно {'обновлено' if email_id else 'создано'}: {email.id}")
            return {
                "success": True,
                "email_id": email.id,
                "subject": email.subject,
                "message": f"Письмо успешно {'обновлено' if email_id else 'создано'} (структурированный метод)"
            }
            
    except User.DoesNotExist:
        logger.error(f"Пользователь с ID {user_id} не найден")
        return {"error": "Пользователь не найден"}
    except Person.DoesNotExist:
        logger.error(f"Получатель с ID {recipient_id} не найден")
        return {"error": "Получатель не найден"}
    except Exception as e:
        logger.error(f"Критическая ошибка при структурированной генерации письма через Agno: {str(e)}")
        # Пытаемся создать fallback письмо, если есть доступ к пользователю и получателю
        try:
            user = User.objects.get(id=user_id)
            recipient = Person.objects.get(id=recipient_id)
            
            fallback_subject = f"Персональное предложение для {recipient.get_full_name()}"
            fallback_body = _create_fallback_email_body(user, recipient, context, tone, purpose)
            
            if email_id:
                email = AiEmail.objects.get(id=email_id)
                email.subject = fallback_subject
                email.body = fallback_body
                email.status = 'draft'
                email.save()
            else:
                email = AiEmail.objects.create(
                    sales_manager=user,
                    recipient=recipient,
                    subject=fallback_subject,
                    body=fallback_body,
                    status='draft'
                )
            
            logger.info(f"Создано fallback письмо после критической ошибки: {email.id}")
            return {
                "success": True,
                "email_id": email.id,
                "subject": email.subject,
                "message": f"Письмо создано с базовым содержимым из-за ошибки AI: {str(e)}"
            }
            
        except Exception as fallback_error:
            logger.error(f"Не удалось создать даже fallback письмо: {str(fallback_error)}")
            return {"error": f"Критическая ошибка генерации AI письма: {str(e)}"}


@shared_task(queue=RABBITMQ_GOODS_QUEUE)
def send_ai_email_task(email_id):
    """
    Celery-задача для отправки AI письма по email
    """
    try:
        with transaction.atomic():
            email = AiEmail.objects.get(id=email_id)
            
            if email.status != 'sent':
                logger.warning(f"Письмо {email_id} не в статусе 'sent', отправка отменена")
                return {"error": "Письмо не готово к отправке"}
            
            # Создаем email сообщение
            django_email = EmailMessage(
                subject=email.subject,
                body=email.body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email.recipient.email],
                reply_to=[email.sales_manager.email] if email.sales_manager else None
            )
            
            # Добавляем вложения
            for attachment in email.attachments.all():
                django_email.attach_file(attachment.file.path)
            
            # Отправляем письмо
            django_email.send()
            
            # Обновляем статус
            email.status = 'delivered'
            email.save()
            
            logger.info(f"AI письмо {email_id} успешно отправлено на {email.recipient.email}")
            return {
                "success": True,
                "email_id": email_id,
                "message": "Письмо успешно отправлено"
            }
            
    except AiEmail.DoesNotExist:
        logger.error(f"AI письмо с ID {email_id} не найдено")
        return {"error": "Письмо не найдено"}
    except Exception as e:
        logger.error(f"Ошибка при отправке письма {email_id}: {str(e)}")
        # Обновляем статус на ошибку
        try:
            email = AiEmail.objects.get(id=email_id)
            email.status = 'error'
            email.save()
        except:
            pass
        return {"error": f"Ошибка отправки письма: {str(e)}"}


@shared_task(queue=RABBITMQ_GOODS_QUEUE)
def batch_generate_ai_emails_task(user_id, recipient_ids, context='', tone='professional', 
                                 purpose='offer', products=None, use_structured=True):
    """
    Celery-задача для массовой генерации AI писем с выбором метода генерации
    """
    results = []
    
    # Выбираем функцию генерации
    generation_task = generate_ai_email_structured_task if use_structured else generate_ai_email_task
    
    for recipient_id in recipient_ids:
        try:
            result = generation_task.delay(
                user_id=user_id,
                recipient_id=recipient_id,
                context=context,
                tone=tone,
                purpose=purpose,
                products=products
            )
            results.append({
                "recipient_id": recipient_id,
                "task_id": result.id,
                "status": "scheduled",
                "method": "structured" if use_structured else "basic"
            })
        except Exception as e:
            results.append({
                "recipient_id": recipient_id,
                "error": str(e),
                "status": "error"
            })
    
    logger.info(f"Запущена массовая генерация писем для {len(recipient_ids)} получателей (метод: {'структурированный' if use_structured else 'базовый'})")
    return {
        "success": True,
        "total_recipients": len(recipient_ids),
        "method": "structured" if use_structured else "basic",
        "results": results
    }


@shared_task(queue=RABBITMQ_GOODS_QUEUE)
def cleanup_old_ai_emails_task(days_old=30):
    """
    Celery-задача для очистки старых AI писем в статусе 'draft' или 'error'
    """
    from django.utils import timezone
    from datetime import timedelta
    
    try:
        cutoff_date = timezone.now() - timedelta(days=days_old)
        
        old_emails = AiEmail.objects.filter(
            status__in=['draft', 'error'],
            created_at__lt=cutoff_date,
            deleted_at__isnull=True
        )
        
        count = old_emails.count()
        old_emails.update(deleted_at=timezone.now())
        
        logger.info(f"Удалено {count} старых AI писем старше {days_old} дней")
        return {
            "success": True,
            "deleted_count": count,
            "message": f"Удалено {count} старых писем"
        }
        
    except Exception as e:
        logger.error(f"Ошибка при очистке старых писем: {str(e)}")
        return {"error": f"Ошибка очистки: {str(e)}"}


def get_company_sales_data(company: Company, months_back: int = 12) -> Dict[str, Any]:
    """
    Извлекает данные о продажах компании за указанный период
    """
    # Определяем период для анализа
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=months_back * 30)
    
    # Получаем все счета продаж компании за период
    invoices = Invoice.objects.filter(
        company=company,
        invoice_type=Invoice.InvoiceType.SALE,
        invoice_date__gte=start_date,
        invoice_date__lte=end_date
    ).prefetch_related('lines__product')
    
    # Базовые метрики
    total_invoices = invoices.count()
    total_amount = sum(invoice.total_amount for invoice in invoices)
    
    # Последняя покупка
    last_invoice = invoices.order_by('-invoice_date').first()
    last_purchase_date = last_invoice.invoice_date.strftime('%d.%m.%Y') if last_invoice else None
    
    # Топ товаров
    product_stats = {}
    for invoice in invoices:
        for line in invoice.lines.all():
            product_name = line.product.name
            if product_name in product_stats:
                product_stats[product_name]['quantity'] += line.quantity
                product_stats[product_name]['total_amount'] += line.total_price
                product_stats[product_name]['orders_count'] += 1
            else:
                product_stats[product_name] = {
                    'quantity': line.quantity,
                    'total_amount': line.total_price,
                    'orders_count': 1
                }
    
    # Сортируем товары по общей сумме
    top_products = sorted(
        product_stats.items(), 
        key=lambda x: x[1]['total_amount'], 
        reverse=True
    )[:5]
    
    # Анализ трендов (сравнение с предыдущим периодом)
    prev_start_date = start_date - timedelta(days=months_back * 30)
    prev_invoices = Invoice.objects.filter(
        company=company,
        invoice_type=Invoice.InvoiceType.SALE,
        invoice_date__gte=prev_start_date,
        invoice_date__lt=start_date
    )
    
    prev_total_amount = sum(invoice.total_amount for invoice in prev_invoices)
    prev_total_invoices = prev_invoices.count()
    
    # Вычисляем тренды
    revenue_trend = "стабильно"
    orders_trend = "стабильно"
    
    if prev_total_amount > 0:
        revenue_change = ((total_amount - prev_total_amount) / prev_total_amount) * 100
        if revenue_change > 10:
            revenue_trend = "рост"
        elif revenue_change < -10:
            revenue_trend = "снижение"
    
    if prev_total_invoices > 0:
        orders_change = ((total_invoices - prev_total_invoices) / prev_total_invoices) * 100
        if orders_change > 10:
            orders_trend = "рост"
        elif orders_change < -10:
            orders_trend = "снижение"
    
    # Средний чек
    avg_order_value = total_amount / total_invoices if total_invoices > 0 else 0
    
    return {
        'total_invoices': total_invoices,
        'total_amount': total_amount,
        'avg_order_value': avg_order_value,
        'last_purchase_date': last_purchase_date,
        'top_products': top_products,
        'revenue_trend': revenue_trend,
        'orders_trend': orders_trend,
        'period_months': months_back,
        'currency': 'RUB'  # Можно динамически определять
    }


@shared_task(queue=RABBITMQ_GOODS_QUEUE)
def generate_sales_insights_task(company_id: int, person_id: int) -> Dict[str, Any]:
    """
    Celery-задача для генерации персонализированных инсайтов по продажам через Agno + oper router
    """
    if not OPENROUTER_API_KEY:
        logger.error("OPENROUTER_API_KEY не настроен в переменных окружения")
        return {"error": "OpenRouter API key не настроен"}
    
    try:
        with transaction.atomic():
            # Получаем компанию и персону
            company = Company.objects.get(id=company_id)
            person = Person.objects.get(id=person_id)
            
            # Получаем данные о продажах
            sales_data = get_company_sales_data(company)
            
            # Инициализируем Agno Agent с OpenRouter и oper router
            agent = Agent(
                model=OpenRouter(
                    id="google/gemini-2.5-flash",
                    api_key=OPENROUTER_API_KEY,
                    temperature=0.3,  # Низкая температура для фактичности
                    max_tokens=1500
                ),
                structured_outputs=True,
                response_model=PersonalizationData
            )
            
            # Формируем промпт для анализа продаж
            prompt = f"""
Проанализируй данные о продажах компании и создай персонализированные инсайты для написания email письма.

Информация о компании:
- Название: {company.name}
- Тип: {company.get_company_type_display()}
- Отрасль: {company.industry or 'Не указана'}
- Статус: {company.get_status_display()}
- Количество сотрудников: {company.employees_count or 'Не указано'}

Информация о получателе:
- Имя: {person.get_full_name()}
- Должность: {person.position or 'Не указана'}
- Отдел: {person.department or 'Не указан'}
- Email: {person.email}

Данные о продажах за {sales_data['period_months']} месяцев:
- Общее количество заказов: {sales_data['total_invoices']}
- Общая сумма покупок: {sales_data['total_amount']:,.2f} {sales_data['currency']}
- Средний чек: {sales_data['avg_order_value']:,.2f} {sales_data['currency']}
- Дата последней покупки: {sales_data['last_purchase_date'] or 'Нет данных'}
- Тренд по выручке: {sales_data['revenue_trend']}
- Тренд по количеству заказов: {sales_data['orders_trend']}

Топ-5 покупаемых товаров:
{chr(10).join([f"- {product[0]}: {product[1]['quantity']} шт. на сумму {product[1]['total_amount']:,.2f} {sales_data['currency']} ({product[1]['orders_count']} заказов)" for product in sales_data['top_products']]) if sales_data['top_products'] else '- Нет данных о товарах'}

Задача:
1. Проанализируй данные и создай ключевые инсайты по продажам
2. Определи паттерны покупок и предпочтения
3. Выдели значимые тренды и изменения
4. Создай рекомендации для персонализации письма

Требования к анализу:
- Используй конкретные цифры и факты
- Выдели наиболее интересные паттерны
- Предложи релевантные темы для обсуждения
- Учти должность получателя при формулировке инсайтов
- Создай рекомендации по тону и подходу к письму

Верни структурированный ответ с детальным анализом.
"""
            
            # Получаем структурированный ответ от AI через oper router
            response = agent.run(prompt)
            
            # Отладочная информация для понимания структуры ответа
            logger.info(f"Response type: {type(response)}")
            logger.info(f"Response attributes: {dir(response)}")
            if hasattr(response, '__dict__'):
                logger.info(f"Response dict: {response.__dict__}")
            
            # Извлекаем данные из RunResponse объекта через final_output
            personalization_data = None
            
            # Используем final_output для получения результата
            if hasattr(response, 'final_output') and response.final_output is not None:
                personalization_data = response.final_output
                logger.info(f"Found personalization data in final_output: {type(personalization_data)}")
            else:
                logger.warning("final_output not found in response, trying direct access")
                personalization_data = response
            
            logger.info(f"Сгенерированы инсайты по продажам для компании {company.name} и персоны {person.get_full_name()}")
            
            # Конвертируем в словарь для возврата
            try:
                if hasattr(personalization_data, 'model_dump'):
                    personalization_dict = personalization_data.model_dump()
                elif hasattr(personalization_data, '__dict__'):
                    # Используем __dict__ вместо dict() для получения атрибутов объекта
                    personalization_dict = personalization_data.__dict__
                elif isinstance(personalization_data, dict):
                    personalization_dict = personalization_data
                else:
                    # Если это простой объект, попытаемся преобразовать в словарь
                    logger.warning(f"Converting object to dict manually: {type(personalization_data)}")
                    personalization_dict = {
                        'company_name': getattr(personalization_data, 'company_name', company.name),
                        'person_name': getattr(personalization_data, 'person_name', person.get_full_name()),
                        'person_position': getattr(personalization_data, 'person_position', person.position or 'Не указана'),
                        'total_purchases': getattr(personalization_data, 'total_purchases', 'Нет данных'),
                        'last_purchase_date': getattr(personalization_data, 'last_purchase_date', 'Нет данных'),
                        'top_products': getattr(personalization_data, 'top_products', []),
                        'sales_insights': getattr(personalization_data, 'sales_insights', []),
                        'recommendations': getattr(personalization_data, 'recommendations', [])
                    }
            except Exception as e:
                logger.error(f"Error converting personalization data to dict: {e}")
                # Fallback - создаем базовый словарь с доступными данными
                personalization_dict = {
                    'company_name': company.name,
                    'person_name': person.get_full_name(),
                    'person_position': person.position or 'Не указана',
                    'total_purchases': 'Нет данных',
                    'last_purchase_date': 'Нет данных',
                    'top_products': [],
                    'sales_insights': [],
                    'recommendations': []
                }
            
            return {
                "success": True,
                "company_id": company_id,
                "person_id": person_id,
                "personalization_data": personalization_dict,
                "raw_sales_data": sales_data,
                "message": "Инсайты по продажам успешно сгенерированы"
            }
            
    except Company.DoesNotExist:
        logger.error(f"Компания с ID {company_id} не найдена")
        return {"error": "Компания не найдена"}
    except Person.DoesNotExist:
        logger.error(f"Персона с ID {person_id} не найдена")
        return {"error": "Персона не найдена"}
    except Exception as e:
        logger.error(f"Ошибка при генерации инсайтов по продажам: {str(e)}")
        return {"error": f"Ошибка генерации инсайтов: {str(e)}"}


@shared_task(queue=RABBITMQ_GOODS_QUEUE)
def generate_personalized_ai_email_task(user_id, recipient_id, context='', tone='professional', 
                                       purpose='offer', products=None, email_id=None, 
                                       include_sales_data=True):
    """
    Celery-задача для генерации персонализированного AI письма с данными о продажах через Agno + oper router
    """
    if not OPENROUTER_API_KEY:
        logger.error("OPENROUTER_API_KEY не настроен в переменных окружения")
        return {"error": "OpenRouter API key не настроен"}
    
    try:
        with transaction.atomic():
            # Получаем пользователя и получателя
            user = User.objects.get(id=user_id)
            recipient = Person.objects.get(id=recipient_id)
            company = recipient.company
            
            # Получаем информацию о товарах, если указаны
            products_info = ""
            if products:
                product_objects = Product.objects.filter(id__in=products)
                products_info = "\n".join([
                    f"- {product.name}: {getattr(product, 'description', '')}" for product in product_objects
                ])
            
            # Получаем данные о продажах, если требуется
            sales_insights = None
            if include_sales_data and company:
                try:
                    logger.info(f"Вызываем генерацию инсайтов для компании {company.id} и персоны {recipient.id}")
                    insights_result = generate_sales_insights_task(company.id, recipient.id)
                    logger.info(f"Результат генерации инсайтов: {insights_result}")
                    
                    if insights_result.get('success'):
                        sales_insights = insights_result['personalization_data']
                        logger.info(f"Инсайты успешно получены: {sales_insights}")
                    else:
                        logger.warning(f"Инсайты не получены: {insights_result.get('error', 'Неизвестная ошибка')}")
                except Exception as e:
                    logger.error(f"Ошибка при получении инсайтов по продажам: {str(e)}", exc_info=True)
            
            # Инициализируем Agno Agent с OpenRouter и oper router
            agent = Agent(
                model=OpenRouter(
                    id="google/gemini-2.5-flash",
                    api_key=OPENROUTER_API_KEY,
                    temperature=0.7,
                    max_tokens=1500
                ),
                structured_outputs=True,
                response_model=PersonalizedEmailContent
            )
            
            # Формируем расширенный промпт с данными о продажах
            sales_context = ""
            if sales_insights:
                logger.info(f"Формируем sales_context с данными: {sales_insights}")
                
                # Извлекаем данные из вложенной структуры
                actual_data = sales_insights
                
                # Проверяем, есть ли поле 'content' с PersonalizationData
                if isinstance(sales_insights, dict) and 'content' in sales_insights:
                    actual_data = sales_insights['content']
                    logger.info(f"Извлекли данные из поля 'content': {type(actual_data)}")
                
                # Безопасно извлекаем данные из словаря или объекта
                def safe_get(data, key, default='Нет данных'):
                    if isinstance(data, dict):
                        return data.get(key, default)
                    else:
                        return getattr(data, key, default)
                
                company_name = safe_get(actual_data, 'company_name', '')
                total_purchases = safe_get(actual_data, 'total_purchases', 'Нет данных')
                last_purchase_date = safe_get(actual_data, 'last_purchase_date', 'Нет данных')
                top_products = safe_get(actual_data, 'top_products', [])
                sales_insights_list = safe_get(actual_data, 'sales_insights', [])
                recommendations = safe_get(actual_data, 'recommendations', [])
                
                logger.info(f"Извлеченные данные: company={company_name}, total={total_purchases}, products={len(top_products)}, insights={len(sales_insights_list)}")
                
                # Формируем топ товары
                top_products_text = "- Нет данных"
                if top_products and len(top_products) > 0:
                    top_products_text = chr(10).join(['- ' + str(product) for product in top_products[:5]])
                
                # Формируем инсайты 
                insights_text = "- Нет инсайтов"
                if sales_insights_list and len(sales_insights_list) > 0:
                    insights_lines = []
                    for insight in sales_insights_list:
                        if isinstance(insight, dict):
                            metric = insight.get('metric_name', '')
                            value = insight.get('value', '')
                            trend = insight.get('trend', '')
                            description = insight.get('description', '')
                            insights_lines.append(f"- {metric}: {value} ({trend}) - {description}")
                        else:
                            metric = getattr(insight, 'metric_name', '')
                            value = getattr(insight, 'value', '')
                            trend = getattr(insight, 'trend', '')
                            description = getattr(insight, 'description', '')
                            insights_lines.append(f"- {metric}: {value} ({trend}) - {description}")
                    insights_text = chr(10).join(insights_lines)
                
                # Формируем рекомендации
                recommendations_text = "- Нет рекомендаций"
                if recommendations and len(recommendations) > 0:
                    recommendations_text = chr(10).join(['- ' + str(rec) for rec in recommendations])
                
                sales_context = f"""

ДАННЫЕ О ПРОДАЖАХ КОМПАНИИ {company_name}:
- Общая сумма покупок: {total_purchases}
- Дата последней покупки: {last_purchase_date}

Топ товары:
{top_products_text}

Ключевые инсайты:
{insights_text}

Рекомендации для персонализации:
{recommendations_text}
"""
                logger.info(f"Сформирован sales_context: {sales_context[:500]}...")
            else:
                logger.warning("Данные о продажах отсутствуют, sales_context будет пустым")
            
            prompt = f"""
Создай высокоперсонализированное email письмо на русском языке для B2B продаж, используя данные о продажах клиента.

Информация о получателе:
- Имя: {recipient.get_full_name()}
- Должность: {recipient.position or 'Не указана'}
- Отдел: {recipient.department or 'Не указан'}
- Email: {recipient.email}
- Компания: {company.name}
- Тип компании: {company.get_company_type_display()}
- Отрасль: {company.industry or 'Не указана'}

Информация об отправителе:
- Имя: {user.first_name} {user.last_name}
- Должность: Sales Manager

Параметры письма:
- Тон: {tone} (professional/friendly/formal)
- Цель: {purpose} (offer/follow_up/introduction/meeting)
- Дополнительный контекст: {context}

{f"Товары/услуги для презентации:\n{products_info}" if products_info else ""}

{sales_context}

ТРЕБОВАНИЯ К ПИСЬМУ:
1. Персонализированная тема с отсылкой к истории покупок (макс 60 символов)
2. Персональное обращение по имени и должности
3. Упоминание конкретных данных о покупках (суммы, товары, тренды)
4. Демонстрация понимания бизнеса клиента
5. Релевантные предложения на основе истории покупок
6. Четкий призыв к действию
7. Профессиональная подпись
8. Использование фактов и цифр для убедительности

СТИЛЬ:
- Деловой, но дружелюбный российский стиль
- Используй конкретные цифры и факты из данных о продажах
- Покажи экспертность через анализ покупательского поведения
- Создай ощущение индивидуального подхода

Создай письмо, которое покажет клиенту, что ты изучил его бизнес и готов предложить именно то, что ему нужно.
"""
            
            # Получаем структурированный ответ от AI через oper router
            response = agent.run(prompt)
            
            # Отладочная информация для понимания структуры ответа
            logger.info(f"Personalized email response type: {type(response)}")
            logger.info(f"Personalized email response attributes: {dir(response)}")
            
            # Извлекаем данные из RunResponse объекта через final_output
            email_content = None
            
            # Используем final_output для получения результата
            if hasattr(response, 'final_output') and response.final_output is not None:
                email_content = response.final_output
                logger.info(f"Found personalized email data in final_output: {type(email_content)}")
            else:
                logger.warning("final_output not found in response, trying direct access")
                email_content = response
            
            # Создаем или обновляем письмо с защитой от ошибок атрибутов
            try:
                # Добавляем более детальную отладочную информацию
                logger.info(f"Processing email_content with type: {type(email_content)}")
                if hasattr(email_content, '__dict__'):
                    logger.info(f"email_content.__dict__: {email_content.__dict__}")
                
                # Пытаемся извлечь subject и body
                if hasattr(email_content, 'subject') and hasattr(email_content, 'body'):
                    subject = email_content.subject
                    body = email_content.body
                    key_points = getattr(email_content, 'key_points', [])
                    logger.info("Successfully extracted from direct attributes")
                elif isinstance(email_content, dict):
                    subject = email_content.get('subject', f'Персональное предложение для {recipient.get_full_name()}')
                    body = email_content.get('body')
                    if not body:
                        logger.warning("AI personalized response missing 'body' field, creating fallback content")
                        body = _create_fallback_email_body(user, recipient, context="персонализированное предложение", tone=tone, purpose=purpose)
                    key_points = email_content.get('key_points', [])
                    logger.info("Successfully extracted from dict")
                elif hasattr(email_content, '__dict__'):
                    # Используем __dict__ для получения атрибутов объекта
                    content_dict = email_content.__dict__
                    logger.info(f"Content dict keys: {list(content_dict.keys())}")
                    subject = content_dict.get('subject', f'Персональное предложение для {recipient.get_full_name()}')
                    body = content_dict.get('body')
                    
                    # Более детальная проверка body
                    if not body or (isinstance(body, str) and body.strip() == ''):
                        logger.warning(f"AI personalized response object missing or empty 'body' attribute. Available keys: {list(content_dict.keys())}")
                        # Пытаемся найти альтернативные поля
                        for alt_key in ['content', 'text', 'message', 'email_body']:
                            if alt_key in content_dict and content_dict[alt_key]:
                                alt_content = content_dict[alt_key]
                                # Проверяем, является ли это объектом PersonalizedEmailContent
                                if hasattr(alt_content, 'body') and hasattr(alt_content, 'subject'):
                                    body = alt_content.body
                                    subject = alt_content.subject
                                    key_points = getattr(alt_content, 'key_points', [])
                                    logger.info(f"Found PersonalizedEmailContent object in alternative field: {alt_key}")
                                    break
                                elif isinstance(alt_content, str):
                                    body = alt_content
                                    logger.info(f"Found content string in alternative field: {alt_key}")
                                    break
                                else:
                                    logger.info(f"Found non-string content in {alt_key}: {type(alt_content)}")
                                    continue
                        
                        if not body or (isinstance(body, str) and body.strip() == ''):
                            # Используем полную структуру ответа с инсайтами для создания качественного письма
                            enhanced_context = context
                            if sales_insights:
                                # Извлекаем actual_data так же, как выше
                                fallback_data = sales_insights
                                if isinstance(sales_insights, dict) and 'content' in sales_insights:
                                    fallback_data = sales_insights['content']
                                
                                enhanced_context += f"\n\nДанные о клиенте:\n"
                                total_purchases = safe_get(fallback_data, 'total_purchases', None)
                                if total_purchases:
                                    enhanced_context += f"- Общая сумма покупок: {total_purchases}\n"
                                last_purchase_date = safe_get(fallback_data, 'last_purchase_date', None)  
                                if last_purchase_date:
                                    enhanced_context += f"- Последняя покупка: {last_purchase_date}\n"
                                top_products_fb = safe_get(fallback_data, 'top_products', [])
                                if top_products_fb:
                                    enhanced_context += f"- Топ товары: {', '.join(str(p) for p in top_products_fb[:3])}\n"
                                recommendations_fb = safe_get(fallback_data, 'recommendations', [])
                                if recommendations_fb:
                                    enhanced_context += f"- Рекомендации: {'; '.join(str(r) for r in recommendations_fb[:2])}"
                            
                            logger.warning("Creating fallback content with sales insights")
                            body = _create_fallback_email_body(user, recipient, enhanced_context, tone, purpose)
                    
                    key_points = content_dict.get('key_points', [])
                    logger.info("Successfully extracted from object __dict__")
                else:
                    # Fallback - создаем базовое письмо
                    logger.warning(f"Cannot extract subject/body from personalized email_content type: {type(email_content)}, creating manual content")
                    subject = f"Персональное предложение для {recipient.get_full_name()}"
                    # Используем полную структуру ответа с инсайтами для создания качественного письма
                    enhanced_context = context
                    if sales_insights:
                        # Извлекаем actual_data так же, как выше
                        manual_fallback_data = sales_insights
                        if isinstance(sales_insights, dict) and 'content' in sales_insights:
                            manual_fallback_data = sales_insights['content']
                        
                        # Определяем safe_get функцию локально
                        def safe_get_local(data, key, default=None):
                            if isinstance(data, dict):
                                return data.get(key, default)
                            else:
                                return getattr(data, key, default)
                        
                        enhanced_context += f"\n\nДанные о клиенте:\n"
                        total_purchases = safe_get_local(manual_fallback_data, 'total_purchases')
                        if total_purchases:
                            enhanced_context += f"- Общая сумма покупок: {total_purchases}\n"
                        last_purchase_date = safe_get_local(manual_fallback_data, 'last_purchase_date')
                        if last_purchase_date:
                            enhanced_context += f"- Последняя покупка: {last_purchase_date}\n"
                        top_products_manual = safe_get_local(manual_fallback_data, 'top_products', [])
                        if top_products_manual:
                            enhanced_context += f"- Топ товары: {', '.join(str(p) for p in top_products_manual[:3])}\n"
                    
                    body = _create_fallback_email_body(user, recipient, enhanced_context, tone, purpose)
                    key_points = []
                
                if email_id:
                    # Обновляем существующее письмо
                    email = AiEmail.objects.get(id=email_id)
                    email.subject = subject
                    email.body = body
                    email.status = 'draft'
                    email.save()
                else:
                    # Создаем новое письмо
                    email = AiEmail.objects.create(
                        sales_manager=user,
                        recipient=recipient,
                        subject=subject,
                        body=body,
                        status='draft'
                    )
                    
            except Exception as e:
                logger.error(f"Error processing personalized email content: {e}")
                # Создаем базовое письмо при ошибке
                # Создаем более качественное fallback письмо
                fallback_subject = f"Персональное предложение для {recipient.get_full_name()}"
                fallback_body = _create_fallback_email_body(user, recipient, context="персонализированное предложение с анализом продаж", tone=tone, purpose=purpose)
                
                if email_id:
                    email = AiEmail.objects.get(id=email_id)
                    email.subject = fallback_subject
                    email.body = fallback_body
                    email.status = 'draft'
                    email.save()
                else:
                    email = AiEmail.objects.create(
                        sales_manager=user,
                        recipient=recipient,
                        subject=fallback_subject,
                        body=fallback_body,
                        status='draft'
                    )
                key_points = []
            
            logger.info(f"Персонализированное AI письмо с данными о продажах {'обновлено' if email_id else 'создано'}: {email.id}")
            return {
                "success": True,
                "email_id": email.id,
                "subject": email.subject,
                "key_points": key_points,
                "sales_data_used": sales_insights is not None,
                "message": f"Персонализированное письмо успешно {'обновлено' if email_id else 'создано'}"
            }
            
    except User.DoesNotExist:
        logger.error(f"Пользователь с ID {user_id} не найден")
        return {"error": "Пользователь не найден"}
    except Person.DoesNotExist:
        logger.error(f"Получатель с ID {recipient_id} не найден")
        return {"error": "Получатель не найден"}
    except Exception as e:
        logger.error(f"Ошибка при генерации персонализированного письма: {str(e)}")
        return {"error": f"Ошибка генерации персонализированного письма: {str(e)}"}