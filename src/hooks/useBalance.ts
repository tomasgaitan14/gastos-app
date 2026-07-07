import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants'
import { calculateBalances } from '@/lib/calculations'
import { useMembers, useMembersMap } from './useMembers'
import { useExpenses } from './useExpenses'
import { useExchangeRate } from './useExchangeRate'
import type { Settlement, Currency } from '@/types'

export function useSettlements() {
  return useQuery({
    queryKey: QUERY_KEYS.SETTLEMENTS,
    queryFn: async (): Promise<Settlement[]> => {
      const res = await fetch('/api/settlements')
      if (!res.ok) throw new Error('Error al cargar liquidaciones')
      return res.json()
    },
  })
}

export function useBalance() {
  const { data: expenses = [] } = useExpenses()
  const { data: settlements = [] } = useSettlements()
  const { data: members = [] } = useMembers()
  const membersMap = useMembersMap()
  const { rate } = useExchangeRate()

  const { memberBalances, debts } = calculateBalances(expenses, settlements, rate, membersMap)
  return { memberBalances, debts, members }
}

export function useCreateSettlement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { from_user_id: string; to_user_id: string; amount: number; currency: Currency; date: string; notes?: string }) => {
      const res = await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Error al registrar liquidación')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SETTLEMENTS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BALANCE })
    },
  })
}
