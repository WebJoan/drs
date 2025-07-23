import Fuse from 'fuse.js'
import { compareTwoStrings, findBestMatch } from 'string-similarity'

export interface SearchableProduct {
  id: number
  name: string
  brand_name: string
  subgroup_name: string
  group_name: string
  product_manager_name: string
  tech_params?: Record<string, any>
  tech_params_searchable?: string
}

export interface SmartSearchOptions {
  threshold?: number // Порог сходства для fuzzy search (0-1)
  semanticWeight?: number // Вес семантического поиска (0-1)
  fuzzyWeight?: number // Вес fuzzy поиска (0-1)
  exactMatchBoost?: number // Бонус для точных совпадений
  maxResults?: number // Максимальное количество результатов
}

export interface SearchResult {
  item: SearchableProduct
  score: number
  matches: {
    field: string
    value: string
    similarity: number
  }[]
}

export class SmartSearchService {
  private fuse: Fuse<SearchableProduct>
  private options: Required<SmartSearchOptions>

  constructor(
    products: SearchableProduct[],
    options: SmartSearchOptions = {}
  ) {
    this.options = {
      threshold: options.threshold ?? 0.3,
      semanticWeight: options.semanticWeight ?? 0.6,
      fuzzyWeight: options.fuzzyWeight ?? 0.4,
      exactMatchBoost: options.exactMatchBoost ?? 0.3,
      maxResults: options.maxResults ?? 50,
    }

    // Настройка Fuse.js для fuzzy search
    this.fuse = new Fuse(products, {
      keys: [
        { name: 'name', weight: 0.4 },
        { name: 'brand_name', weight: 0.3 },
        { name: 'subgroup_name', weight: 0.2 },
        { name: 'group_name', weight: 0.1 },
        { name: 'product_manager_name', weight: 0.05 },
        { name: 'tech_params_searchable', weight: 0.15 },
      ],
      threshold: this.options.threshold,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
      findAllMatches: true,
      ignoreLocation: true,
      useExtendedSearch: true,
    })
  }

  search(query: string): SearchResult[] {
    if (!query || query.trim().length === 0) {
      return []
    }

    const normalizedQuery = query.toLowerCase().trim()
    
    // 1. Fuzzy search с Fuse.js
    const fuzzyResults = this.performFuzzySearch(normalizedQuery)
    
    // 2. Семантический поиск с string similarity
    const semanticResults = this.performSemanticSearch(normalizedQuery)
    
    // 3. Комбинируем результаты
    const combinedResults = this.combineResults(fuzzyResults, semanticResults, normalizedQuery)
    
    // 4. Сортируем по итоговому score и возвращаем
    return combinedResults
      .sort((a, b) => b.score - a.score)
      .slice(0, this.options.maxResults)
  }

  private performFuzzySearch(query: string): Map<number, SearchResult> {
    const results = new Map<number, SearchResult>()
    
    const fuseResults = this.fuse.search(query)
    
    for (const result of fuseResults) {
      if (result.item && typeof result.score === 'number') {
        const fuzzyScore = 1 - result.score // Fuse.js возвращает расстояние, конвертируем в сходство
        
        const matches = result.matches?.map(match => ({
          field: match.key || '',
          value: match.value || '',
          similarity: fuzzyScore,
        })) || []

        results.set(result.item.id, {
          item: result.item,
          score: fuzzyScore * this.options.fuzzyWeight,
          matches,
        })
      }
    }
    
    return results
  }

  private performSemanticSearch(query: string): Map<number, SearchResult> {
    const results = new Map<number, SearchResult>()
    
    // Получаем все продукты из fuse
    const allProducts = this.fuse.getIndex().docs as SearchableProduct[]
    
    for (const product of allProducts) {
      const searchableFields = [
        { field: 'name', value: product.name, weight: 0.4 },
        { field: 'brand_name', value: product.brand_name, weight: 0.3 },
        { field: 'subgroup_name', value: product.subgroup_name, weight: 0.2 },
        { field: 'group_name', value: product.group_name, weight: 0.1 },
        { field: 'product_manager_name', value: product.product_manager_name, weight: 0.05 },
        { field: 'tech_params_searchable', value: product.tech_params_searchable || '', weight: 0.15 },
      ]

      let totalScore = 0
      let totalWeight = 0
      const matches: SearchResult['matches'] = []

      for (const { field, value, weight } of searchableFields) {
        if (value && value.trim()) {
          const similarity = compareTwoStrings(query.toLowerCase(), value.toLowerCase())
          
          if (similarity > 0.1) { // Минимальный порог сходства
            totalScore += similarity * weight
            totalWeight += weight
            
            matches.push({
              field,
              value,
              similarity,
            })
          }
        }
      }

      if (totalWeight > 0) {
        const averageScore = totalScore / totalWeight
        
        if (averageScore > 0.1) {
          results.set(product.id, {
            item: product,
            score: averageScore * this.options.semanticWeight,
            matches,
          })
        }
      }
    }
    
    return results
  }

  private combineResults(
    fuzzyResults: Map<number, SearchResult>,
    semanticResults: Map<number, SearchResult>,
    query: string
  ): SearchResult[] {
    const combinedMap = new Map<number, SearchResult>()
    
    // Объединяем fuzzy результаты
    for (const [id, result] of fuzzyResults) {
      combinedMap.set(id, { ...result })
    }
    
    // Добавляем/объединяем семантические результаты
    for (const [id, semanticResult] of semanticResults) {
      const existing = combinedMap.get(id)
      
      if (existing) {
        // Комбинируем scores
        existing.score = Math.max(existing.score, semanticResult.score)
        
        // Объединяем matches
        const matchFieldsSet = new Set(existing.matches.map(m => m.field))
        for (const match of semanticResult.matches) {
          if (!matchFieldsSet.has(match.field)) {
            existing.matches.push(match)
          }
        }
      } else {
        combinedMap.set(id, { ...semanticResult })
      }
    }
    
    // Применяем бонус за точные совпадения
    for (const [id, result] of combinedMap) {
      const exactMatchBonus = this.calculateExactMatchBonus(result.item, query)
      result.score += exactMatchBonus
      
      // Нормализуем score (ограничиваем от 0 до 1)
      result.score = Math.min(1, Math.max(0, result.score))
    }
    
    return Array.from(combinedMap.values())
  }

  private calculateExactMatchBonus(product: SearchableProduct, query: string): number {
    const normalizedQuery = query.toLowerCase()
    let bonus = 0
    
    // Проверяем точные совпадения в различных полях
    const fields = [
      { value: product.name, weight: 0.4 },
      { value: product.brand_name, weight: 0.3 },
      { value: product.subgroup_name, weight: 0.2 },
      { value: product.group_name, weight: 0.1 },
    ]
    
    for (const { value, weight } of fields) {
      if (value && value.toLowerCase().includes(normalizedQuery)) {
        bonus += this.options.exactMatchBoost * weight
      }
    }
    
    return bonus
  }

  updateProducts(products: SearchableProduct[]): void {
    this.fuse.setCollection(products)
  }
}

// Утилитарные функции для работы с поиском
export const createSearchableProduct = (product: any): SearchableProduct => {
  // Создаем searchable строку из технических параметров
  let techParamsSearchable = ''
  if (product.tech_params && typeof product.tech_params === 'object') {
    techParamsSearchable = Object.values(product.tech_params)
      .filter(value => value != null)
      .map(value => String(value))
      .join(' ')
  }

  return {
    id: product.id,
    name: product.name || '',
    brand_name: product.brand_name || '',
    subgroup_name: product.subgroup_name || '',
    group_name: product.group_name || '',
    product_manager_name: product.product_manager_name || '',
    tech_params: product.tech_params,
    tech_params_searchable: techParamsSearchable,
  }
}

// Функция для подсветки совпадений в тексте
export const highlightMatches = (text: string, query: string): string => {
  if (!query || !text) return text
  
  const normalizedQuery = query.toLowerCase()
  const normalizedText = text.toLowerCase()
  
  let result = text
  let lastIndex = 0
  
  while (true) {
    const index = normalizedText.indexOf(normalizedQuery, lastIndex)
    if (index === -1) break
    
    const before = result.substring(0, index)
    const match = result.substring(index, index + query.length)
    const after = result.substring(index + query.length)
    
    result = `${before}<mark>${match}</mark>${after}`
    lastIndex = index + query.length + 13 // +13 для тегов <mark></mark>
  }
  
  return result
} 