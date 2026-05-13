import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { calculateSplits } from '@/lib/calculations'
import { QUERY_KEYS, STALE_TIMES } from '@/constants'
import type { Member, Currency } from '@/types'

export function useMembers() {
  return useQuery({
    queryKey: QUERY_KEYS.MEMBERS,
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    staleTime: STALE_TIMES.MEMBERS,
  })
}

export function useMembersMap() {
  const { data: members = [] } = useMembers()
  return members.reduce<Record<string, Member>>((acc, m) => {
    acc[m.id] = m
    return acc
  }, {})
}

export function useAddMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, salary, salaryCurrency }: { name: string; salary: number; salaryCurrency: Currency }) => {
      const { data, error } = await supabase
        .from('members')
        .insert({ name, salary, salary_currency: salaryCurrency })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MEMBERS }),
  })
}

export function useUpdateMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name, salary, salaryCurrency }: { id: string; name: string; salary: number; salaryCurrency: Currency }) => {
      const { error: memberError } = await supabase
        .from('members')
        .update({ name, salary, salary_currency: salaryCurrency })
        .eq('id', id)
      if (memberError) throw memberError

      // Fetch updated members, exchange rate and all expenses in parallel
      const [membersResult, rateResult, expensesResult] = await Promise.all([
        supabase.from('members').select('*').order('created_at', { ascending: true }),
        supabase.from('exchange_rates').select('rate').eq('from_currency', 'USD').eq('to_currency', 'ARS').limit(1),
        supabase.from('expenses').select('*, splits:expense_splits(*)'),
      ])

      if (membersResult.error) throw membersResult.error
      if (expensesResult.error) throw expensesResult.error

      const members = membersResult.data ?? []
      const exchangeRate = rateResult.data?.[0]?.rate ?? 0
      const expenses = expensesResult.data ?? []

      if (!expenses.length || !members.length) return

      // Recalculate all splits in memory
      const allSplits = expenses.flatMap(expense => {
        const excludedIds = expense.splits
          .filter((s: { is_excluded: boolean }) => s.is_excluded)
          .map((s: { user_id: string }) => s.user_id)
        return calculateSplits(expense.amount, members as Member[], excludedIds, exchangeRate).map(s => ({
          expense_id: expense.id,
          user_id: s.member_id,
          percentage: s.percentage,
          amount: s.amount,
          is_excluded: s.is_excluded,
        }))
      })

      // Replace all splits in two queries (bulk delete + bulk insert)
      const expenseIds = expenses.map(e => e.id)
      const { error: deleteError } = await supabase.from('expense_splits').delete().in('expense_id', expenseIds)
      if (deleteError) throw deleteError

      if (allSplits.length > 0) {
        const { error: insertError } = await supabase.from('expense_splits').insert(allSplits)
        if (insertError) throw insertError
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MEMBERS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EXPENSES })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BALANCE })
    },
  })
}

export function useDeleteMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('members').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MEMBERS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EXPENSES })
    },
  })
}
