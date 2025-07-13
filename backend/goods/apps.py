from django.apps import AppConfig


class GoodsConfig(AppConfig):
    name = "goods"
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self) -> None:
        from django.conf import settings

        from goods.indexers import ProductIndexer

        if settings.ENVIRONMENT == "test":
            return

        ProductIndexer.maybe_create_index()  # pragma: no cover
