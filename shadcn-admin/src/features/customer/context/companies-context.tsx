import { Company } from '@/features/customer/types'
import { createContext, useContext, useEffect, useState } from 'react'

interface CompaniesContextType {
  editingCompany: Company | null
  setEditingCompany: (company: Company | null) => void
  isCreateDialogOpen: boolean
  setIsCreateDialogOpen: (open: boolean) => void
  isEditDialogOpen: boolean
  setIsEditDialogOpen: (open: boolean) => void
  isDeleteDialogOpen: boolean
  setIsDeleteDialogOpen: (open: boolean) => void
  companyToDelete: Company | null
  setCompanyToDelete: (company: Company | null) => void
  isDeleteMultipleDialogOpen: boolean
  setIsDeleteMultipleDialogOpen: (open: boolean) => void
  companiesToDelete: Company[]
  setCompaniesToDelete: (companies: Company[]) => void
  clearSelection: (() => void) | null
  setClearSelection: (clearFn: (() => void) | null) => void
}

const CompaniesContext = createContext<CompaniesContextType | undefined>(undefined)

export const useCompaniesContext = () => {
  const context = useContext(CompaniesContext)
  if (!context) {
    throw new Error('useCompaniesContext must be used within a CompaniesProvider')
  }
  return context
}

interface CompaniesProviderProps {
  children: React.ReactNode
}

export default function CompaniesProvider({ children }: CompaniesProviderProps) {
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null)
  const [isDeleteMultipleDialogOpen, setIsDeleteMultipleDialogOpen] = useState(false)
  const [companiesToDelete, setCompaniesToDelete] = useState<Company[]>([])
  const [clearSelection, setClearSelection] = useState<(() => void) | null>(null)

  useEffect(() => {
    const handleEditCompany = (event: CustomEvent) => {
      const company = event.detail as Company
      setEditingCompany(company)
      setIsEditDialogOpen(true)
    }

    const handleDeleteCompany = (event: CustomEvent) => {
      const company = event.detail as Company
      setCompanyToDelete(company)
      setIsDeleteDialogOpen(true)
    }

    window.addEventListener('edit-company', handleEditCompany as EventListener)
    window.addEventListener('delete-company', handleDeleteCompany as EventListener)

    return () => {
      window.removeEventListener('edit-company', handleEditCompany as EventListener)
      window.removeEventListener('delete-company', handleDeleteCompany as EventListener)
    }
  }, [])

  const contextValue: CompaniesContextType = {
    editingCompany,
    setEditingCompany,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    companyToDelete,
    setCompanyToDelete,
    isDeleteMultipleDialogOpen,
    setIsDeleteMultipleDialogOpen,
    companiesToDelete,
    setCompaniesToDelete,
    clearSelection,
    setClearSelection,
  }

  return (
    <CompaniesContext.Provider value={contextValue}>
      {children}
    </CompaniesContext.Provider>
  )
} 