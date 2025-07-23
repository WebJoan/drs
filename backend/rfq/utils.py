from decimal import Decimal
from django.utils.translation import gettext_lazy as _
from .models import Currency


class CurrencyConverter:
    """Класс для конвертации валют"""
    
    @staticmethod
    def convert_to_rub(amount: Decimal, currency_code: str) -> Decimal:
        """Конвертирует сумму в рубли"""
        try:
            currency = Currency.objects.get(code=currency_code, is_active=True)
            return amount * currency.exchange_rate_to_rub
        except Currency.DoesNotExist:
            raise ValueError(f"Currency {currency_code} not found or inactive")
    
    @staticmethod
    def convert_from_rub(amount_rub: Decimal, target_currency_code: str) -> Decimal:
        """Конвертирует сумму из рублей в другую валюту"""
        try:
            currency = Currency.objects.get(code=target_currency_code, is_active=True)
            if currency.exchange_rate_to_rub == 0:
                raise ValueError(f"Invalid exchange rate for {target_currency_code}")
            return amount_rub / currency.exchange_rate_to_rub
        except Currency.DoesNotExist:
            raise ValueError(f"Currency {target_currency_code} not found or inactive")
    
    @staticmethod
    def convert_currency(amount: Decimal, from_currency: str, to_currency: str) -> Decimal:
        """Конвертирует сумму из одной валюты в другую"""
        if from_currency == to_currency:
            return amount
        
        # Конвертируем через рубли
        amount_rub = CurrencyConverter.convert_to_rub(amount, from_currency)
        return CurrencyConverter.convert_from_rub(amount_rub, to_currency)


class PriceCalculator:
    """Класс для расчета цен с наценками"""
    
    @staticmethod
    def calculate_selling_price(cost_price: Decimal, markup_percent: Decimal) -> Decimal:
        """Рассчитывает продажную цену с учетом наценки"""
        if markup_percent < 0:
            raise ValueError("Markup percent cannot be negative")
        
        markup_amount = cost_price * (markup_percent / Decimal('100'))
        return cost_price + markup_amount
    
    @staticmethod
    def calculate_markup_amount(cost_price: Decimal, markup_percent: Decimal) -> Decimal:
        """Рассчитывает сумму наценки"""
        if markup_percent < 0:
            raise ValueError("Markup percent cannot be negative")
        
        return cost_price * (markup_percent / Decimal('100'))
    
    @staticmethod
    def calculate_total_price(unit_price: Decimal, quantity: int) -> Decimal:
        """Рассчитывает общую стоимость"""
        return unit_price * Decimal(str(quantity))
    
    @staticmethod
    def calculate_price_breakdown(cost_price: Decimal, markup_percent: Decimal, quantity: int) -> dict:
        """Возвращает детальную разбивку цены"""
        markup_amount = PriceCalculator.calculate_markup_amount(cost_price, markup_percent)
        unit_selling_price = cost_price + markup_amount
        total_cost = cost_price * quantity
        total_markup = markup_amount * quantity
        total_selling_price = unit_selling_price * quantity
        
        return {
            'unit_cost_price': cost_price,
            'unit_markup_amount': markup_amount,
            'unit_selling_price': unit_selling_price,
            'quantity': quantity,
            'total_cost_price': total_cost,
            'total_markup_amount': total_markup,
            'total_selling_price': total_selling_price,
            'markup_percent': markup_percent
        }


def get_default_currencies():
    """Возвращает список валют по умолчанию для создания"""
    return [
        {
            'code': 'RUB',
            'name': 'Российский рубль',
            'symbol': '₽',
            'exchange_rate_to_rub': Decimal('1.0000')
        },
        {
            'code': 'USD',
            'name': 'Доллар США',
            'symbol': '$',
            'exchange_rate_to_rub': Decimal('95.0000')  # Примерный курс
        },
        {
            'code': 'CNY',
            'name': 'Китайский юань',
            'symbol': '¥',
            'exchange_rate_to_rub': Decimal('13.0000')  # Примерный курс
        }
    ]


def create_default_currencies():
    """Создает валюты по умолчанию если их нет"""
    for currency_data in get_default_currencies():
        Currency.objects.get_or_create(
            code=currency_data['code'],
            defaults=currency_data
        ) 