from django.db import models
from django.utils.translation import gettext_lazy as _
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from user.models import User
from core.mixins import ExtIdMixin
from django_softdelete.models import SoftDeleteModel


class ProductGroup(ExtIdMixin, models.Model):
    name = models.CharField(
        max_length=200, 
        verbose_name=_('Название группы')
    )

    class Meta:
        verbose_name = _('Группа товаров')
        verbose_name_plural = _('Группы товаров')

    def __str__(self):
        return self.name
    

class ProductSubgroup(ExtIdMixin, models.Model):
    group = models.ForeignKey(
        ProductGroup, 
        on_delete=models.CASCADE, 
        related_name='subgroups',
        verbose_name=_('Группа товаров')
    )
    name = models.CharField(
        max_length=200, 
        verbose_name=_('Название подгруппы')
    )
    # Подгруппа закреплена за конкретным product-менеджером
    product_manager = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': 'product'},
        related_name='product_subgroups',
        verbose_name=_('Ответственный менеджер'),
        help_text=_('Менеджер, отвечающий за данную подгруппу')
    )

    class Meta:
        verbose_name = _('Подгруппа товаров')
        verbose_name_plural = _('Подгруппы товаров')

    def __str__(self):
        return f"{self.group.name} - {self.name}"
    

class Brand(ExtIdMixin, models.Model):
    name = models.CharField(
        max_length=200, 
        verbose_name=_('Название бренда')
    )
    # Если за бренд закреплён конкретный менеджер:
    product_manager = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': 'product'},
        related_name='brands',
        verbose_name=_('Ответственный менеджер за бренд'),
        help_text=_('Менеджер, отвечающий за данный бренд')
    )

    class Meta:
        verbose_name = _('Бренд')
        verbose_name_plural = _('Бренды')

    def __str__(self):
        return self.name
    

class Product(SoftDeleteModel, ExtIdMixin):
    subgroup = models.ForeignKey(
        ProductSubgroup, 
        on_delete=models.CASCADE, 
        related_name='products',
        verbose_name=_('Подгруппа')
    )
    brand = models.ForeignKey(
        Brand,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
        verbose_name=_('Бренд')
    )
    name = models.CharField(
        max_length=200, 
        verbose_name=_('Part number')
    )
    # Переопределение менеджера для конкретного товара:
    product_manager = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': 'product'},
        related_name='products',
        verbose_name=_('Ответственный менеджер'),
        help_text=_('Если не указан, используется менеджер бренда или подгруппы')
    )
    
    # Технические параметры товара в формате JSON
    tech_params = models.JSONField(
        default=dict,
        blank=True,
        verbose_name=_('Технические параметры'),
        help_text=_('Технические характеристики товара в формате JSON')
    )

    class Meta:
        verbose_name = _('Товар')
        verbose_name_plural = _('Товары')

    def __str__(self):
        return self.name
    
    def perform_destroy(self, instance):
        instance.delete()

    def get_manager(self):
        """
        Определяет менеджера товара по следующему порядку приоритета:
        1. Если для товара явно указан менеджер, возвращает его.
        2. Если у товара есть бренд и для бренда назначен менеджер, возвращает его.
        3. Иначе возвращает менеджера подгруппы.
        """
        if self.product_manager:
            return self.product_manager
        if self.brand and self.brand.product_manager:
            return self.brand.product_manager
        return self.subgroup.product_manager


# Сигналы для автоматической индексации товаров в MeiliSearch
@receiver(post_save, sender=Product)
def index_product_on_save(sender, instance, created, **kwargs):
    """Индексируем товар при создании или обновлении."""
    from django.conf import settings
    
    if settings.ENVIRONMENT == "test":
        return
    
    try:
        from goods.tasks import index_products
        index_products.delay([instance.id])
    except Exception as e:
        print(f"Ошибка при индексации товара {instance.id}: {e}")


@receiver(post_delete, sender=Product)
def unindex_product_on_delete(sender, instance, **kwargs):
    """Удаляем товар из индекса при удалении."""
    from django.conf import settings
    
    if settings.ENVIRONMENT == "test":
        return
    
    try:
        from goods.tasks import unindex_products
        unindex_products.delay([instance.id])
    except Exception as e:
        print(f"Ошибка при удалении товара {instance.id} из индекса: {e}")


# Сигналы для переиндексации товаров при изменении связанных объектов
@receiver(post_save, sender=Brand)
def reindex_products_on_brand_change(sender, instance, **kwargs):
    """Переиндексируем товары при изменении бренда."""
    from django.conf import settings
    
    if settings.ENVIRONMENT == "test":
        return
    
    try:
        from goods.tasks import index_products
        product_ids = list(instance.products.values_list('id', flat=True))
        if product_ids:
            index_products.delay(product_ids)
    except Exception as e:
        print(f"Ошибка при переиндексации товаров бренда {instance.id}: {e}")


@receiver(post_save, sender=ProductSubgroup)
def reindex_products_on_subgroup_change(sender, instance, **kwargs):
    """Переиндексируем товары при изменении подгруппы."""
    from django.conf import settings
    
    if settings.ENVIRONMENT == "test":
        return
    
    try:
        from goods.tasks import index_products
        product_ids = list(instance.products.values_list('id', flat=True))
        if product_ids:
            index_products.delay(product_ids)
    except Exception as e:
        print(f"Ошибка при переиндексации товаров подгруппы {instance.id}: {e}")


@receiver(post_save, sender=ProductGroup)
def reindex_products_on_group_change(sender, instance, **kwargs):
    """Переиндексируем товары при изменении группы."""
    from django.conf import settings
    
    if settings.ENVIRONMENT == "test":
        return
    
    try:
        from goods.tasks import index_products
        product_ids = []
        for subgroup in instance.subgroups.all():
            product_ids.extend(subgroup.products.values_list('id', flat=True))
        if product_ids:
            index_products.delay(product_ids)
    except Exception as e:
        print(f"Ошибка при переиндексации товаров группы {instance.id}: {e}")