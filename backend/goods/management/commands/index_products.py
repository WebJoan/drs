from django.core.management.base import BaseCommand
from django.db import transaction
from goods.models import Product
from goods.indexers import ProductIndexer


class Command(BaseCommand):
    help = 'Индексирует все товары в MeiliSearch'

    def add_arguments(self, parser):
        parser.add_argument(
            '--atomic',
            action='store_true',
            help='Выполнить атомарную переиндексацию (очистить индекс и создать заново)',
        )
        parser.add_argument(
            '--limit',
            type=int,
            help='Ограничить количество индексируемых товаров (для тестирования)',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Начинаем индексацию товаров...'))
        
        try:
            # Получаем товары с необходимыми связями
            queryset = Product.objects.select_related(
                'brand', 'subgroup__group', 'product_manager'
            ).all()
            
            # Применяем лимит если указан
            if options['limit']:
                queryset = queryset[:options['limit']]
            
            products = list(queryset)
            total_count = len(products)
            
            self.stdout.write(f'Найдено {total_count} товаров для индексации')
            
            if options['atomic']:
                # Атомарная переиндексация
                self.stdout.write('Выполняем атомарную переиндексацию...')
                ProductIndexer.index_all_atomically(products)
                self.stdout.write(
                    self.style.SUCCESS(f'Атомарная переиндексация завершена! Проиндексировано {total_count} товаров')
                )
            else:
                # Обычная индексация
                self.stdout.write('Выполняем обычную индексацию...')
                ProductIndexer.index_objects(products)
                self.stdout.write(
                    self.style.SUCCESS(f'Индексация завершена! Проиндексировано {total_count} товаров')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Ошибка при индексации товаров: {str(e)}')
            )
            raise 