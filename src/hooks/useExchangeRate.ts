import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS, STALE_TIMES } from '@/constants'

interface ExchangeRateData {
  rate: number
  source: string | null
  updated_at: string | null
}

async function fetchRate(): Promise<ExchangeRateData> {
  const res = await fetch('/api/exchange-rate')
  if (!res.ok) throw new Error('Error al obtener el tipo de cambio')
  return res.json()
}

export function useExchangeRate() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: QUERY_KEYS.EXCHANGE_RATE,
    queryFn: fetchRate,
    staleTime: STALE_TIMES.EXCHANGE_RATE,
  })

  const refresh = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/exchange-rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'api' }),
      })
      if (!res.ok) throw new Error('Error al actualizar el tipo de cambio')
      return res.json() as Promise<ExchangeRateData>
    },
    onSuccess: (data) => queryClient.setQueryData(QUERY_KEYS.EXCHANGE_RATE, data),
  })

  const setManual = useMutation({
    mutationFn: async (rate: number) => {
      const res = await fetch('/api/exchange-rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'manual', rate }),
      })
      if (!res.ok) throw new Error('Error al guardar el tipo de cambio')
      return res.json() as Promise<ExchangeRateData>
    },
    onSuccess: (data) => queryClient.setQueryData(QUERY_KEYS.EXCHANGE_RATE, data),
  })

  return {
    rate: query.data?.rate ?? 0,
    updatedAt: query.data?.updated_at ?? null,
    isLoading: query.isLoading,
    refresh,
    setManual,
  }
}
