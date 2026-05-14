import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_KEYS } from '@/constants'
import type { PersonalExpense, NewPersonalExpensePayload } from '@/types'

export function usePersonalExpenses(memberId: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEYS.PERSONAL_EXPENSES, memberId],
    queryFn: async (): Promise<PersonalExpense[]> => {
      if (!memberId) return []
      const { data, error } = await supabase
        .from('personal_expenses')
        .select('*')
        .eq('member_id', memberId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!memberId,
  })
}

export function usePersonalExpense(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.PERSONAL_EXPENSE(id),
    queryFn: async (): Promise<PersonalExpense> => {
      const { data, error } = await supabase
        .from('personal_expenses')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as PersonalExpense
    },
  })
}

export function useCreatePersonalExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: NewPersonalExpensePayload) => {
      const { error } = await supabase.from('personal_expenses').insert({
        member_id: payload.member_id,
        description: payload.description,
        amount: payload.amount,
        currency: payload.currency,
        category: payload.category,
        date: payload.date,
        is_recurring: payload.is_recurring,
        recurrence_type: payload.recurrence_type,
        notes: payload.notes || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PERSONAL_EXPENSES })
    },
  })
}

export function useUpdatePersonalExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: NewPersonalExpensePayload }) => {
      const { error } = await supabase
        .from('personal_expenses')
        .update({
          description: payload.description,
          amount: payload.amount,
          currency: payload.currency,
          category: payload.category,
          date: payload.date,
          is_recurring: payload.is_recurring,
          recurrence_type: payload.recurrence_type,
          notes: payload.notes || null,
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, { id, payload }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PERSONAL_EXPENSES })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PERSONAL_EXPENSE(id) })
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.PERSONAL_EXPENSES, payload.member_id] })
    },
  })
}

export function useDeletePersonalExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('personal_expenses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PERSONAL_EXPENSES })
    },
  })
}
