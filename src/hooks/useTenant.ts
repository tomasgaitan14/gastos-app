import { useQuery } from '@tanstack/react-query'
import { useTenantId } from './useTenantId'

const TENANT_NOT_FOUND = 'TENANT_NOT_FOUND'

export function useTenant() {
  const tenantId = useTenantId()
  return useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/tenant?tenantId=${tenantId}`)
      if (res.status === 404) throw new Error(TENANT_NOT_FOUND)
      if (!res.ok) throw new Error('Error al verificar acceso')
      return true
    },
    retry: false,
    staleTime: Infinity,
  })
}

export { TENANT_NOT_FOUND }
