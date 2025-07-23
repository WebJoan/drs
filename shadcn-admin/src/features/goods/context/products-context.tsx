import { Product } from '@/lib/types'
import { createContext, useContext, useEffect, useState } from 'react'

interface ProductsContextType {
  editingProduct: Product | null
  setEditingProduct: (product: Product | null) => void
  isCreateDialogOpen: boolean
  setIsCreateDialogOpen: (open: boolean) => void
  isEditDialogOpen: boolean
  setIsEditDialogOpen: (open: boolean) => void
  isDeleteDialogOpen: boolean
  setIsDeleteDialogOpen: (open: boolean) => void
  productToDelete: Product | null
  setProductToDelete: (product: Product | null) => void
  isDeleteMultipleDialogOpen: boolean
  setIsDeleteMultipleDialogOpen: (open: boolean) => void
  productsToDelete: Product[]
  setProductsToDelete: (products: Product[]) => void
  clearSelection: (() => void) | null
  setClearSelection: (clearFn: (() => void) | null) => void
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined)

export const useProductsContext = () => {
  const context = useContext(ProductsContext)
  if (!context) {
    throw new Error('useProductsContext must be used within a ProductsProvider')
  }
  return context
}

interface ProductsProviderProps {
  children: React.ReactNode
}

export default function ProductsProvider({ children }: ProductsProviderProps) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isDeleteMultipleDialogOpen, setIsDeleteMultipleDialogOpen] = useState(false)
  const [productsToDelete, setProductsToDelete] = useState<Product[]>([])
  const [clearSelection, setClearSelection] = useState<(() => void) | null>(null)

  useEffect(() => {
    const handleEditProduct = (event: CustomEvent) => {
      const product = event.detail as Product
      setEditingProduct(product)
      setIsEditDialogOpen(true)
    }

    const handleDeleteProduct = (event: CustomEvent) => {
      const product = event.detail as Product
      setProductToDelete(product)
      setIsDeleteDialogOpen(true)
    }

    window.addEventListener('edit-product', handleEditProduct as EventListener)
    window.addEventListener('delete-product', handleDeleteProduct as EventListener)

    return () => {
      window.removeEventListener('edit-product', handleEditProduct as EventListener)
      window.removeEventListener('delete-product', handleDeleteProduct as EventListener)
    }
  }, [])

  const contextValue: ProductsContextType = {
    editingProduct,
    setEditingProduct,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    productToDelete,
    setProductToDelete,
    isDeleteMultipleDialogOpen,
    setIsDeleteMultipleDialogOpen,
    productsToDelete,
    setProductsToDelete,
    clearSelection,
    setClearSelection,
  }

  return (
    <ProductsContext.Provider value={contextValue}>
      {children}
    </ProductsContext.Provider>
  )
} 