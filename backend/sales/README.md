# API Продаж

Бекенд для работы с продажами, позволяющий клиентам просматривать и скачивать свои продажи.

## Модели

### Invoice (Счет)
- `invoice_number` - номер счета
- `invoice_date` - дата счета
- `company` - связь с компанией
- `invoice_type` - тип счета (закупка/продажа)
- `sale_type` - тип продажи (со склада/под заказ)
- `currency` - валюта

### InvoiceLine (Строка счета)
- `invoice` - связь со счетом
- `product` - связь с товаром
- `quantity` - количество
- `price` - цена

## API Endpoints

### Список счетов
```
GET /sales/api/invoices/
```

**Параметры фильтрации:**
- `date_from` - начальная дата (YYYY-MM-DD)
- `date_to` - конечная дата (YYYY-MM-DD)
- `company` - ID компании
- `invoice_type` - тип счета (purchase/sale)
- `sale_type` - тип продажи (stock/order)
- `currency` - валюта (RUB/USD/CNY)
- `page` - номер страницы
- `page_size` - размер страницы (макс. 100)

**Пример запроса:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:8000/sales/api/invoices/?date_from=2024-01-01&page_size=50"
```

### Детали счета
```
GET /sales/api/invoices/{id}/
```

### Экспорт продаж
```
POST /sales/api/invoices/export/
```

**Параметры:**
```json
{
    "date_from": "2024-01-01",
    "date_to": "2024-12-31",
    "format": "excel",
    "include_lines": true
}
```

**Форматы экспорта:**
- `excel` - Excel файл (.xlsx)
- `csv` - CSV файл
- `json` - JSON файл

### Статистика продаж
```
GET /sales/api/invoices/stats/
```

Возвращает статистику по продажам текущего пользователя.

### Строки счетов
```
GET /sales/api/invoice-lines/
```

## Права доступа

### Роли пользователей

**Администраторы (`admin`, `is_superuser`):**
- Видят все счета и могут экспортировать любые данные

**Менеджеры продаж (`sales`):**
- Видят счета компаний, за которые они ответственны
- Могут экспортировать данные своих клиентов

**Пользователи компаний:**
- Видят только счета своей компании
- Могут экспортировать только свои данные

### Ограничения
- Пользователи видят только счета типа "продажа" (кроме администраторов)
- Доступ к данным ограничен связями пользователя с компаниями

## Celery задачи

### update_sales_from_mysql
Импорт продаж из внешней MySQL базы данных.

### export_sales_to_excel
Экспорт всех продаж в Excel файл.

### export_company_sales_to_excel
Экспорт продаж конкретной компании.

## Настройка

### 1. Добавьте приложение в INSTALLED_APPS

```python
INSTALLED_APPS = [
    # ...
    'sales',
    'rest_framework',
    'django_filters',
]
```

### 2. Подключите URL'ы

```python
# urls.py
urlpatterns = [
    # ...
    path('sales/', include('sales.urls')),
]
```

### 3. Примените миграции

```bash
python manage.py makemigrations sales
python manage.py migrate
```

### 4. Настройте MySQL подключение (если используете импорт)

```python
# settings.py
MYSQL_CONFIG = {
    'host': 'your-mysql-host',
    'database': 'your-mysql-db', 
    'user': 'your-mysql-user',
    'password': 'your-mysql-password',
    'charset': 'utf8mb4',
    'use_unicode': True,
    'autocommit': True
}
```

### 5. Установите зависимости

```bash
pip install pandas openpyxl mysql-connector-python
```

## Примеры использования

### Получение списка продаж компании
```python
import requests

headers = {'Authorization': 'Bearer YOUR_TOKEN'}
response = requests.get(
    'http://localhost:8000/sales/api/invoices/',
    headers=headers,
    params={
        'date_from': '2024-01-01',
        'page_size': 20
    }
)
data = response.json()
```

### Экспорт в Excel
```python
import requests

headers = {'Authorization': 'Bearer YOUR_TOKEN'}
response = requests.post(
    'http://localhost:8000/sales/api/invoices/export/',
    headers=headers,
    json={
        'date_from': '2024-01-01',
        'format': 'excel',
        'include_lines': True
    }
)

# Сохранение файла
with open('sales_export.xlsx', 'wb') as f:
    f.write(response.content)
```

### Получение статистики
```python
import requests

headers = {'Authorization': 'Bearer YOUR_TOKEN'}
response = requests.get(
    'http://localhost:8000/sales/api/invoices/stats/',
    headers=headers
)
stats = response.json()
print(f"Всего счетов: {stats['total_invoices']}")
print(f"Общая сумма: {stats['total_amount']}")
```

## Кастомизация

Вы можете расширить функциональность, создав собственные ViewSet'ы или добавив дополнительные фильтры и сериализаторы.

## Безопасность

- Все API требуют аутентификации
- Доступ к данным ограничен правами пользователя
- Экспорт файлов содержит только разрешенные данные
- Логирование всех операций импорта/экспорта