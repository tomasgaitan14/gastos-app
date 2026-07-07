import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants'
import { useTenantId } from '@/hooks/useTenantId'
import type { PersonalExpense, NewPersonalExpensePayload } from '@/types'

export function usePersonalExpenses(memberId: string | null) {
  const tenantId = useTenantId()
  return useQuery({
    queryKey: [...QUERY_KEYS.PERSONAL_EXPENSES, memberId, tenantId],
    queryFn: async (): Promise<PersonalExpense[]> => {
      if (!memberId) return []
      const res = await fetch(`/api/personal-expenses?member_id=${memberId}&tenantId=${tenantId}`)
      if (!res.ok) throw new Error('Error al cargar gastos personales')
      return res.json()
    },
    enabled: !!memberId,
  })
}

export function usePersonalExpense(id: string) {
  const tenantId = useTenantId()
  return useQuery({
    queryKey: [...QUERY_KEYS.PERSONAL_EXPENSE(id), tenantId],
    queryFn: async (): Promise<PersonalExpense> => {
      const res = await fetch(`/api/personal-expenses/${id}?tenantId=${tenantId}`)
      if (!res.ok) throw new Error('Error al cargar gasto personal')
      return res.json()
    },
  })
}

export function useCreatePersonalExpense() {
  const queryClient = useQueryClient()
  const tenantId = useTenantId()
  return useMutation({
    mutationFn: async (payload: NewPersonalExpensePayload) => {
      const res = await fetch(`/api/personal-expenses?tenantId=${tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Error al crear gasto personal')
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.PERSONAL_EXPENSES, tenantId] }),
  })
}

export function useUpdatePersonalExpense() {
  const queryClient = useQueryClient()
  const tenantId = useTenantId()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: NewPersonalExpensePayload }) => {
      const res = await fetch(`/api/personal-expenses/${id}?tenantId=${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Error al actualizar gasto personal')
      return res.json()
    },
    onSuccess: (_, { id, payload }) => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.PERSONAL_EXPENSES, tenantId] })
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.PERSONAL_EXPENSE(id), tenantId] })
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.PERSONAL_EXPENSES, payload.member_id, tenantId] })
    },
  })
}

export function useDeletePersonalExpense() {
  const queryClient = useQueryClient()
  const tenantId = useTenantId()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/personal-expenses/${id}?tenantId=${tenantId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar gasto personal')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.PERSONAL_EXPENSES, tenantId] }),
  })
}
