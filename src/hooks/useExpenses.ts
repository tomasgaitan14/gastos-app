import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS, STALE_TIMES } from '@/constants'
import type { ExpenseWithSplits, NewExpensePayload } from '@/types'

export function useExpenses() {
  return useQuery({
    queryKey: QUERY_KEYS.EXPENSES,
    queryFn: async (): Promise<ExpenseWithSplits[]> => {
      const res = await fetch('/api/expenses')
      if (!res.ok) throw new Error('Error al cargar gastos')
      return res.json()
    },
    staleTime: STALE_TIMES.EXPENSES,
  })
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.EXPENSE(id),
    queryFn: async (): Promise<ExpenseWithSplits> => {
      const res = await fetch(`/api/expenses/${id}`)
      if (!res.ok) throw new Error('Error al cargar gasto')
      return res.json()
    },
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ payload, exchangeRate }: { payload: NewExpensePayload; exchangeRate: number }) => {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload, exchangeRate }),
      })
      if (!res.ok) throw new Error('Error al crear gasto')
      return res.json()
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
    mutationFn: async ({ id, payload, exchangeRate }: { id: string; payload: NewExpensePayload; exchangeRate: number }) => {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload, exchangeRate }),
      })
      if (!res.ok) throw new Error('Error al actualizar gasto')
      return res.json()
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
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar gasto')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EXPENSES })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BALANCE })
    },
  })
}
