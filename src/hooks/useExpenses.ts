import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_KEYS, STALE_TIMES } from '@/constants'
import { calculateSplits } from '@/lib/calculations'
import type { ExpenseWithSplits, NewExpensePayload, Member } from '@/types'

export function useExpenses() {
  return useQuery({
    queryKey: QUERY_KEYS.EXPENSES,
    queryFn: async (): Promise<ExpenseWithSplits[]> => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, splits:expense_splits(*)')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as ExpenseWithSplits[]) ?? []
    },
    staleTime: STALE_TIMES.EXPENSES,
  })
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.EXPENSE(id),
    queryFn: async (): Promise<ExpenseWithSplits> => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, splits:expense_splits(*)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as ExpenseWithSplits
    },
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ payload, members, exchangeRate }: { payload: NewExpensePayload; members: Member[]; exchangeRate: number }) => {
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          description: payload.description,
          amount: payload.amount,
          currency: payload.currency,
          paid_by: payload.paid_by,
          category: payload.category,
          date: payload.date,
          is_recurring: payload.is_recurring,
          recurrence_type: payload.recurrence_type,
          notes: payload.notes || null,
        })
        .select()
        .single()
      if (expenseError) throw expenseError

      const splits = calculateSplits(payload.amount, members, payload.excluded_member_ids, exchangeRate)
      const splitsToInsert = splits.map(s => ({
        expense_id: expense.id,
        user_id: s.member_id,
        percentage: s.percentage,
        amount: s.amount,
        is_excluded: s.is_excluded,
      }))

      const { error: splitsError } = await supabase.from('expense_splits').insert(splitsToInsert)
      if (splitsError) throw splitsError
      return expense
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EXPENSES })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BALANCE })
    },
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload, members, exchangeRate }: { id: string; payload: NewExpensePayload; members: Member[]; exchangeRate: number }) => {
      const { error: expenseError } = await supabase
        .from('expenses')
        .update({
          description: payload.description,
          amount: payload.amount,
          currency: payload.currency,
          paid_by: payload.paid_by,
          category: payload.category,
          date: payload.date,
          is_recurring: payload.is_recurring,
          recurrence_type: payload.recurrence_type,
          notes: payload.notes || null,
        })
        .eq('id', id)
      if (expenseError) throw expenseError

      const { error: deleteError } = await supabase
        .from('expense_splits')
        .delete()
        .eq('expense_id', id)
      if (deleteError) throw deleteError

      const splits = calculateSplits(payload.amount, members, payload.excluded_member_ids, exchangeRate)
      const splitsToInsert = splits.map(s => ({
        expense_id: id,
        user_id: s.member_id,
        percentage: s.percentage,
        amount: s.amount,
        is_excluded: s.is_excluded,
      }))
      const { error: splitsError } = await supabase.from('expense_splits').insert(splitsToInsert)
      if (splitsError) throw splitsError
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EXPENSES })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EXPENSE(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BALANCE })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EXPENSES })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BALANCE })
    },
  })
}
