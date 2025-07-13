"""
Утилиты для транслитерации и работы с поиском
"""


class TransliterationUtils:
    """Утилита для конвертации между русской и латинской раскладками"""
    
    # Карта соответствия клавиш русской и латинской раскладок
    RU_TO_EN = {
        'а': 'f', 'б': ',', 'в': 'd', 'г': 'u', 'д': 'l', 'е': 't', 'ё': '`',
        'ж': ';', 'з': 'p', 'и': 'b', 'й': 'q', 'к': 'r', 'л': 'k', 'м': 'v',
        'н': 'y', 'о': 'j', 'п': 'g', 'р': 'h', 'с': 'c', 'т': 'n', 'у': 'e',
        'ф': 'a', 'х': '[', 'ц': 'w', 'ч': 'x', 'ш': 'i', 'щ': 'o', 'ъ': ']',
        'ы': 's', 'ь': 'm', 'э': "'", 'ю': '.', 'я': 'z',
        'А': 'F', 'Б': '<', 'В': 'D', 'Г': 'U', 'Д': 'L', 'Е': 'T', 'Ё': '~',
        'Ж': ':', 'З': 'P', 'И': 'B', 'Й': 'Q', 'К': 'R', 'Л': 'K', 'М': 'V',
        'Н': 'Y', 'О': 'J', 'П': 'G', 'Р': 'H', 'С': 'C', 'Т': 'N', 'У': 'E',
        'Ф': 'A', 'Х': '{', 'Ц': 'W', 'Ч': 'X', 'Ш': 'I', 'Щ': 'O', 'Ъ': '}',
        'Ы': 'S', 'Ь': 'M', 'Э': '"', 'Ю': '>', 'Я': 'Z'
    }
    
    # Обратная карта
    EN_TO_RU = {v: k for k, v in RU_TO_EN.items()}
    
    # Семантическая карта транслитерации (как буквы воспринимаются пользователем)
    RU_TO_EN_SEMANTIC = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
        'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'YO',
        'Ж': 'ZH', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
        'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
        'Ф': 'F', 'Х': 'H', 'Ц': 'C', 'Ч': 'CH', 'Ш': 'SH', 'Щ': 'SCH', 'Ъ': '',
        'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'YU', 'Я': 'YA'
    }
    
    # Обратная семантическая карта
    EN_TO_RU_SEMANTIC = {v: k for k, v in RU_TO_EN_SEMANTIC.items() if v}
    
    @classmethod
    def ru_to_en(cls, text: str) -> str:
        """Конвертирует текст с русской раскладки на английскую"""
        if not text:
            return text
        return ''.join(cls.RU_TO_EN.get(char, char) for char in text)
    
    @classmethod
    def en_to_ru(cls, text: str) -> str:
        """Конвертирует текст с английской раскладки на русскую"""
        if not text:
            return text
        return ''.join(cls.EN_TO_RU.get(char, char) for char in text)
    
    @classmethod
    def ru_to_en_semantic(cls, text: str) -> str:
        """Конвертирует текст с русской на английскую семантически"""
        if not text:
            return text
        return ''.join(cls.RU_TO_EN_SEMANTIC.get(char, char) for char in text)
    
    @classmethod
    def en_to_ru_semantic(cls, text: str) -> str:
        """Конвертирует текст с английской на русскую семантически"""
        if not text:
            return text
        return ''.join(cls.EN_TO_RU_SEMANTIC.get(char, char) for char in text)
    
    @classmethod
    def get_transliterated_variants(cls, text: str) -> list:
        """Получает все варианты транслитерации для текста"""
        if not text:
            return [text]
        
        variants = [text]
        
        # Пробуем конвертировать как русский -> английский (раскладка клавиатуры)
        en_variant = cls.ru_to_en(text)
        if en_variant != text:
            variants.append(en_variant)
        
        # Пробуем конвертировать как английский -> русский (раскладка клавиатуры)
        ru_variant = cls.en_to_ru(text)
        if ru_variant != text:
            variants.append(ru_variant)
        
        # Пробуем семантическую конвертацию русский -> английский
        en_semantic_variant = cls.ru_to_en_semantic(text)
        if en_semantic_variant != text:
            variants.append(en_semantic_variant)
        
        # Пробуем семантическую конвертацию английский -> русский
        ru_semantic_variant = cls.en_to_ru_semantic(text)
        if ru_semantic_variant != text:
            variants.append(ru_semantic_variant)
        
        return list(set(variants))  # Убираем дубликаты
    
    @classmethod
    def create_search_text(cls, *texts) -> str:
        """Создает текст для поиска со всеми вариантами транслитерации"""
        all_variants = []
        
        for text in texts:
            if text:
                all_variants.extend(cls.get_transliterated_variants(str(text)))
        
        return ' '.join(all_variants)


def prepare_search_query(query: str) -> list:
    """Подготавливает поисковый запрос с вариантами транслитерации"""
    if not query:
        return [query]
    
    # Разбиваем запрос на слова
    words = query.split()
    all_variants = []
    
    for word in words:
        variants = TransliterationUtils.get_transliterated_variants(word)
        all_variants.extend(variants)
    
    # Возвращаем уникальные варианты
    return list(set(all_variants)) 