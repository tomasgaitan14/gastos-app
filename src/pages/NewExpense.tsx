import { useNavigate } from 'react-router-dom'
import { useTenantId } from '@/hooks/useTenantId'
import { tp } from '@/lib/tenant'
import { useMembers } from '@/hooks/useMembers'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { useCreateExpense } from '@/hooks/useExpenses'
import { ExpenseForm } from '@/components/shared/ExpenseForm'
import { Button } from '@/components/ui/Button'
import { TopBar } from '@/components/layout/TopBar'
import type { NewExpensePayload } from '@/types'

export function NewExpense() {
  const navigate = useNavigate()
  const tenantId = useTenantId()
  const { data: members = [] } = useMembers()
  const { rate } = useExchangeRate()
  const createExpense = useCreateExpense()

  async function handleSubmit(payload: NewExpensePayload) {
    await createExpense.mutateAsync({ payload, exchangeRate: rate })
    navigate(tp(tenantId, '/expenses'), { replace: true })
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col pb-24">
        <TopBar title="Nuevo gasto" back />
        <div className="px-4 py-16 flex flex-col items-center gap-3 text-center">
          <p className="text-zinc-500 text-sm">Primero agregá miembros en Ajustes</p>
          <Button variant="secondary" onClick={() => navigate(tp(tenantId, '/settings'))}>Ir a Ajustes</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col pb-24">
      <TopBar title="Nuevo gasto" back />
      <ExpenseForm isPending={createExpense.isPending} submitLabel="Guardar gasto" onSubmit={handleSubmit} />
    </div>
  )
}
