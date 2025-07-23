from django.core.management.base import BaseCommand
from django.conf import settings
from goods.models import Product
from goods.indexers import ProductIndexer


class Command(BaseCommand):
    help = 'Переиндексация всех товаров в MeiliSearch с поддержкой транслитерации'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Очистить индекс перед переиндексацией',
        )

    def handle(self, *args, **options):
        if settings.ENVIRONMENT == "test":
            self.stdout.write(
                self.style.WARNING('Переиндексация пропущена в тестовом окружении')
            )
            return

        try:
            self.stdout.write('Начинаем переиндексацию товаров...')
            
            # Получаем все товары
            products = Product.objects.select_related(
                'brand', 'subgroup__group', 'product_manager'
            ).all()
            
            total_products = products.count()
            self.stdout.write(f'Найдено {total_products} товаров для индексации')
            
            if options['clear']:
                self.stdout.write('Очищаем индекс...')
                try:
                    ProductIndexer.clear_index()
                    self.stdout.write(self.style.SUCCESS('Индекс очищен'))
                except Exception as e:
                    self.stdout.write(
                        self.style.WARNING(f'Ошибка при очистке индекса: {e}')
                    )
            
            # Выполняем атомарную индексацию
            self.stdout.write('Выполняем индексацию...')
            ProductIndexer.index_all_atomically()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Успешно проиндексировано {total_products} товаров в MeiliSearch'
                )
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Ошибка при переиндексации: {e}')
            )
            raise 