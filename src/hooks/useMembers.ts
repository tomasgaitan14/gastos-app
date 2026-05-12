import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
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
      const { error } = await supabase
        .from('members')
        .update({ name, salary, salary_currency: salaryCurrency })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MEMBERS }),
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
