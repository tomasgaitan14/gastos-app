import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants'
import { useTenantId } from '@/hooks/useTenantId'
import type { InstallmentPayment, NewInstallmentPaymentPayload } from '@/types'

export function useInstallmentPayments(expenseId: string | undefined, type: 'shared' | 'personal' = 'shared') {
  const tenantId = useTenantId()
  const endpoint = type === 'personal' ? 'personal-installment-payments' : 'installment-payments'
  const queryKey = type === 'personal'
    ? [...QUERY_KEYS.PERSONAL_INSTALLMENT_PAYMENTS(expenseId!), tenantId]
    : [...QUERY_KEYS.INSTALLMENT_PAYMENTS(expenseId!), tenantId]

  return useQuery({
    queryKey,
    queryFn: async (): Promise<InstallmentPayment[]> => {
      const res = await fetch(`/api/${endpoint}?tenantId=${tenantId}&expense_id=${expenseId}`)
      if (!res.ok) throw new Error('Error al cargar pagos de cuotas')
      return res.json()
    },
    enabled: !!expenseId,
  })
}

export function useUpsertInstallmentPayment(type: 'shared' | 'personal' = 'shared') {
  const queryClient = useQueryClient()
  const tenantId = useTenantId()
  const endpoint = type === 'personal' ? 'personal-installment-payments' : 'installment-payments'

  return useMutation({
    mutationFn: async (payload: NewInstallmentPaymentPayload): Promise<InstallmentPayment> => {
      const res = await fetch(`/api/${endpoint}?tenantId=${tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Error al registrar cuota')
      return res.json()
    },
    onSuccess: (_, payload) => {
      const qKey = type === 'personal'
        ? [...QUERY_KEYS.PERSONAL_INSTALLMENT_PAYMENTS(payload.expense_id), tenantId]
        : [...QUERY_KEYS.INSTALLMENT_PAYMENTS(payload.expense_id), tenantId]
      queryClient.invalidateQueries({ queryKey: qKey })
    },
  })
}
