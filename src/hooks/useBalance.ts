import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
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
      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .order('date', { ascending: false })
      if (error) throw error
      return data ?? []
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
      const { error } = await supabase.from('settlements').insert(payload)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SETTLEMENTS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BALANCE })
    },
  })
}
