import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { useTenant, TENANT_NOT_FOUND } from '@/hooks/useTenant'
import { useTenantId } from '@/hooks/useTenantId'

const LAST_TENANT_KEY = 'lastTenant'

export function TenantLayout() {
  const tenantId = useTenantId()
  const { isLoading, error } = useTenant()

  useEffect(() => {
    if (!isLoading && !error) {
      localStorage.setItem(LAST_TENANT_KEY, tenantId)
    }
  }, [isLoading, error, tenantId])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    const isNotFound = error.message === TENANT_NOT_FOUND
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-2">
        <p className="text-lg font-semibold text-zinc-900">
          {isNotFound ? 'Link inválido' : 'Error de acceso'}
        </p>
        <p className="text-sm text-zinc-400">
          {isNotFound
            ? 'Este acceso no existe. Pedile el link correcto a quien te lo compartió.'
            : 'No pudimos verificar tu acceso. Intentá de nuevo más tarde.'}
        </p>
      </div>
    )
  }

  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  )
}
