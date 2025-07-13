from typing import Any, Dict

from django_meilisearch_indexer.indexers import MeilisearchModelIndexer

from goods.models import Product
from goods.utils import TransliterationUtils


class ProductIndexer(MeilisearchModelIndexer[Product]):
    """Индексер для товаров в MeiliSearch."""

    MODEL_CLASS = Product
    PRIMARY_KEY = "id"
    SETTINGS = {
        "filterableAttributes": [
            "subgroup_id",
            "subgroup_name",
            "brand_id", 
            "brand_name",
            "product_manager_id",
            "product_manager_name",
            "group_id",
            "group_name"
        ],
        "searchableAttributes": [
            "name",
            "brand_name",
            "subgroup_name",
            "group_name",
            "product_manager_name",
            "tech_params_searchable",
            "transliterated_search"
        ],
        "sortableAttributes": [
            "name",
            "brand_name",
            "subgroup_name",
            "group_name"
        ],
        "displayedAttributes": [
            "id",
            "name",
            "brand_name",
            "subgroup_name",
            "group_name",
            "product_manager_name",
            "tech_params"
        ]
    }

    @classmethod
    def build_object(cls, product: Product) -> Dict[str, Any]:
        # Получаем менеджера товара
        manager = product.get_manager()
        
        # Создаем строку для поиска по техническим параметрам
        tech_params_searchable = ""
        if product.tech_params:
            # Собираем все значения из JSON в одну строку для поиска
            tech_params_searchable = " ".join(
                str(value) for value in product.tech_params.values()
                if value is not None
            )
        
        # Создаем поле для транслитерированного поиска
        transliterated_search = TransliterationUtils.create_search_text(
            product.name,
            product.brand.name if product.brand else "",
            product.subgroup.name,
            product.subgroup.group.name,
            manager.username if manager else "",
            tech_params_searchable
        )
        
        return {
            "id": product.id,
            "name": product.name,
            "brand_id": product.brand.id if product.brand else None,
            "brand_name": product.brand.name if product.brand else "",
            "subgroup_id": product.subgroup.id,
            "subgroup_name": product.subgroup.name,
            "group_id": product.subgroup.group.id,
            "group_name": product.subgroup.group.name,
            "product_manager_id": manager.id if manager else None,
            "product_manager_name": manager.username if manager else "",
            "tech_params": product.tech_params,
            "tech_params_searchable": tech_params_searchable,
            "transliterated_search": transliterated_search,
        }

    @classmethod
    def index_name(cls) -> str:
        return "products" 