import { useState, useCallback } from 'react'
import { type CreateQuotationItemData } from '@/lib/types'

interface QuotationProposal extends CreateQuotationItemData {
  id: string // временный ID для фронтенда
}

interface UseQuotationProposalsReturn {
  proposals: Record<number, QuotationProposal[]>
  addProposal: (rfqItemId: number, proposal: CreateQuotationItemData) => void
  updateProposal: (rfqItemId: number, proposalId: string, updates: Partial<CreateQuotationItemData>) => void
  removeProposal: (rfqItemId: number, proposalId: string) => void
  getProposalsForItem: (rfqItemId: number) => QuotationProposal[]
  getTotalProposalsCount: () => number
  clearAllProposals: () => void
  exportProposals: () => CreateQuotationItemData[]
}

export function useQuotationProposals(): UseQuotationProposalsReturn {
  const [proposals, setProposals] = useState<Record<number, QuotationProposal[]>>({})

  const addProposal = useCallback((rfqItemId: number, proposal: CreateQuotationItemData) => {
    const proposalWithId: QuotationProposal = {
      ...proposal,
      id: `${rfqItemId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    setProposals(prev => ({
      ...prev,
      [rfqItemId]: [...(prev[rfqItemId] || []), proposalWithId]
    }))
  }, [])

  const updateProposal = useCallback((rfqItemId: number, proposalId: string, updates: Partial<CreateQuotationItemData>) => {
    setProposals(prev => ({
      ...prev,
      [rfqItemId]: (prev[rfqItemId] || []).map(p => 
        p.id === proposalId ? { ...p, ...updates } : p
      )
    }))
  }, [])

  const removeProposal = useCallback((rfqItemId: number, proposalId: string) => {
    setProposals(prev => ({
      ...prev,
      [rfqItemId]: (prev[rfqItemId] || []).filter(p => p.id !== proposalId)
    }))
  }, [])

  const getProposalsForItem = useCallback((rfqItemId: number): QuotationProposal[] => {
    return proposals[rfqItemId] || []
  }, [proposals])

  const getTotalProposalsCount = useCallback((): number => {
    return Object.values(proposals).reduce((total, itemProposals) => total + itemProposals.length, 0)
  }, [proposals])

  const clearAllProposals = useCallback(() => {
    setProposals({})
  }, [])

  const exportProposals = useCallback((): CreateQuotationItemData[] => {
    const allProposals: CreateQuotationItemData[] = []
    
    Object.values(proposals).forEach(itemProposals => {
      itemProposals.forEach(proposal => {
        const { id, ...proposalData } = proposal
        allProposals.push(proposalData)
      })
    })
    
    return allProposals
  }, [proposals])

  return {
    proposals,
    addProposal,
    updateProposal,
    removeProposal,
    getProposalsForItem,
    getTotalProposalsCount,
    clearAllProposals,
    exportProposals
  }
} 