import { useParams } from 'react-router-dom'

export function useTenantId(): string {
  const { tenantId } = useParams<{ tenantId: string }>()
  return tenantId!
}
