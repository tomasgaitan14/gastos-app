import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS, STALE_TIMES } from '@/constants'
import { useTenantId } from '@/hooks/useTenantId'
import type { Member, Currency } from '@/types'

export function useMembers() {
  const tenantId = useTenantId()
  return useQuery({
    queryKey: [...QUERY_KEYS.MEMBERS, tenantId],
    queryFn: async (): Promise<Member[]> => {
      const res = await fetch(`/api/members?tenantId=${tenantId}`)
      if (!res.ok) throw new Error('Error al cargar miembros')
      return res.json()
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
  const tenantId = useTenantId()
  return useMutation({
    mutationFn: async ({ name, salary, salaryCurrency }: { name: string; salary: number; salaryCurrency: Currency }) => {
      const res = await fetch(`/api/members?tenantId=${tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, salary, salary_currency: salaryCurrency }),
      })
      if (!res.ok) throw new Error('Error al agregar miembro')
      return res.json() as Promise<Member>
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.MEMBERS, tenantId] }),
  })
}

export function useUpdateMember() {
  const queryClient = useQueryClient()
  const tenantId = useTenantId()
  return useMutation({
    mutationFn: async ({ id, name, salary, salaryCurrency }: { id: string; name: string; salary: number; salaryCurrency: Currency }) => {
      const res = await fetch(`/api/members/${id}?tenantId=${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, salary, salary_currency: salaryCurrency }),
      })
      if (!res.ok) throw new Error('Error al actualizar miembro')
      return res.json() as Promise<Member>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.MEMBERS, tenantId] })
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.EXPENSES, tenantId] })
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.BALANCE, tenantId] })
    },
  })
}

export function useDeleteMember() {
  const queryClient = useQueryClient()
  const tenantId = useTenantId()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/members/${id}?tenantId=${tenantId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar miembro')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.MEMBERS, tenantId] })
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.EXPENSES, tenantId] })
    },
  })
}
