import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS, STALE_TIMES } from '@/constants'
import { useTenantId } from '@/hooks/useTenantId'
import type { Category } from '@/types'

export function useCategories() {
  const tenantId = useTenantId()
  return useQuery<Category[]>({
    queryKey: [...QUERY_KEYS.CATEGORIES, tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/categories?tenantId=${tenantId}`)
      if (!res.ok) throw new Error('Error al cargar categorías')
      return res.json()
    },
    staleTime: STALE_TIMES.CATEGORIES,
  })
}

export function useCategoryLabel(id: string): string {
  const { data: categories = [] } = useCategories()
  return categories.find(c => c.id === id)?.label ?? id
}

export function useAddCategory() {
  const qc = useQueryClient()
  const tenantId = useTenantId()
  return useMutation({
    mutationFn: async (label: string) => {
      const res = await fetch(`/api/categories?tenantId=${tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Error al agregar categoría')
      }
      return res.json() as Promise<Category>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [...QUERY_KEYS.CATEGORIES, tenantId] }),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  const tenantId = useTenantId()
  return useMutation({
    mutationFn: async ({ id, label }: { id: string; label: string }) => {
      const res = await fetch(`/api/categories/${id}?tenantId=${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Error al actualizar')
      }
      return res.json() as Promise<Category>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [...QUERY_KEYS.CATEGORIES, tenantId] }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  const tenantId = useTenantId()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}?tenantId=${tenantId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar categoría')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [...QUERY_KEYS.CATEGORIES, tenantId] }),
  })
}
