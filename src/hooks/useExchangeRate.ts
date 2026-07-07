import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS, STALE_TIMES } from '@/constants'
import { useTenantId } from '@/hooks/useTenantId'

interface ExchangeRateData {
  rate: number
  source: string | null
  updated_at: string | null
}

export function useExchangeRate() {
  const queryClient = useQueryClient()
  const tenantId = useTenantId()

  const query = useQuery({
    queryKey: [...QUERY_KEYS.EXCHANGE_RATE, tenantId],
    queryFn: async (): Promise<ExchangeRateData> => {
      const res = await fetch(`/api/exchange-rate?tenantId=${tenantId}`)
      if (!res.ok) throw new Error('Error al obtener el tipo de cambio')
      return res.json()
    },
    staleTime: STALE_TIMES.EXCHANGE_RATE,
  })

  const refresh = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/exchange-rate?tenantId=${tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'api' }),
      })
      if (!res.ok) throw new Error('Error al actualizar el tipo de cambio')
      return res.json() as Promise<ExchangeRateData>
    },
    onSuccess: (data) => queryClient.setQueryData([...QUERY_KEYS.EXCHANGE_RATE, tenantId], data),
  })

  const setManual = useMutation({
    mutationFn: async (rate: number) => {
      const res = await fetch(`/api/exchange-rate?tenantId=${tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'manual', rate }),
      })
      if (!res.ok) throw new Error('Error al guardar el tipo de cambio')
      return res.json() as Promise<ExchangeRateData>
    },
    onSuccess: (data) => queryClient.setQueryData([...QUERY_KEYS.EXCHANGE_RATE, tenantId], data),
  })

  return {
    rate: query.data?.rate ?? 0,
    updatedAt: query.data?.updated_at ?? null,
    isLoading: query.isLoading,
    refresh,
    setManual,
  }
}
