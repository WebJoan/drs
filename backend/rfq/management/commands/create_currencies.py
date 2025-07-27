from django.core.management.base import BaseCommand
from django.db import transaction
from rfq.utils import create_default_currencies
from rfq.models import Currency


class Command(BaseCommand):
    help = 'Создает валюты по умолчанию: доллар, юань, рубль'

    def add_arguments(self, parser):
        parser.add_argument(
            '--recreate',
            action='store_true',
            help='Пересоздать все валюты (удалить существующие)',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('🪙 Начинаю создание валют...')
        )

        try:
            with transaction.atomic():
                if options['recreate']:
                    self.stdout.write('⚠️  Удаляю существующие валюты...')
                    Currency.objects.all().delete()

                # Создаем валюты по умолчанию
                create_default_currencies()
                
                # Показываем результат
                currencies = Currency.objects.filter(is_active=True)
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Успешно создано {currencies.count()} валют:')
                )
                
                for currency in currencies:
                    self.stdout.write(
                        f'   • {currency.code} - {currency.name} ({currency.symbol})'
                    )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Ошибка при создании валют: {e}')
            )
            raise

        self.stdout.write(
            self.style.SUCCESS('🎉 Валюты успешно настроены!')
        ) 