import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fetchCryptoDollarRate } from '@/lib/dolarapi'
import { QUERY_KEYS, STALE_TIMES } from '@/constants'

export function useExchangeRate() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: QUERY_KEYS.EXCHANGE_RATE,
    queryFn: async (): Promise<{ rate: number; updatedAt: string }> => {
      // Primero intentar desde la DB (cache)
      const { data: rows } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('from_currency', 'USD')
        .eq('to_currency', 'ARS')
        .limit(1)

      const data = rows?.[0] ?? null

      if (data) {
        const updatedAt = new Date(data.updated_at)
        const diffMinutes = (Date.now() - updatedAt.getTime()) / 1000 / 60

        // Si el cache tiene menos de 30 minutos, usarlo
        if (diffMinutes < 30) {
          return { rate: data.rate, updatedAt: data.updated_at }
        }
      }

      // Sino, fetchear de la API y guardar
      const rate = await fetchCryptoDollarRate()
      await supabase.from('exchange_rates').upsert({
        from_currency: 'USD',
        to_currency: 'ARS',
        rate,
        source: 'dolarapi-cripto',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'from_currency,to_currency' })

      return { rate, updatedAt: new Date().toISOString() }
    },
    staleTime: STALE_TIMES.EXCHANGE_RATE,
  })

  const refresh = useMutation({
    mutationFn: async () => {
      const rate = await fetchCryptoDollarRate()
      await supabase.from('exchange_rates').upsert({
        from_currency: 'USD',
        to_currency: 'ARS',
        rate,
        source: 'dolarapi-cripto',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'from_currency,to_currency' })
      return { rate, updatedAt: new Date().toISOString() }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.EXCHANGE_RATE, data)
    },
  })

  const setManual = useMutation({
    mutationFn: async (rate: number) => {
      await supabase.from('exchange_rates').upsert({
        from_currency: 'USD',
        to_currency: 'ARS',
        rate,
        source: 'manual',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'from_currency,to_currency' })
      return { rate, updatedAt: new Date().toISOString() }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.EXCHANGE_RATE, data)
    },
  })

  return {
    rate: query.data?.rate ?? 0,
    updatedAt: query.data?.updatedAt ?? null,
    isLoading: query.isLoading,
    refresh,
    setManual,
  }
}
