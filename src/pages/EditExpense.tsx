import { useParams, useNavigate } from 'react-router-dom'
import { useExpense, useUpdateExpense } from '@/hooks/useExpenses'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { useTenantId } from '@/hooks/useTenantId'
import { tp } from '@/lib/tenant'
import { ExpenseForm } from '@/components/shared/ExpenseForm'
import { TopBar } from '@/components/layout/TopBar'
import { Skeleton } from '@/components/ui/Skeleton'
import type { NewExpensePayload } from '@/types'

export function EditExpense() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const tenantId = useTenantId()
  const { data: expense, isLoading } = useExpense(id!)
  const { rate } = useExchangeRate()
  const updateExpense = useUpdateExpense()

  async function handleSubmit(payload: NewExpensePayload) {
    await updateExpense.mutateAsync({ id: id!, payload, exchangeRate: rate })
    navigate(tp(tenantId, `/expenses/${id}`), { replace: true })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col pb-24">
        <TopBar title="Editar gasto" back />
        <div className="px-4 py-4 flex flex-col gap-4">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!expense) {
    return (
      <div className="flex flex-col pb-24">
        <TopBar title="Editar gasto" back />
        <div className="px-4 py-12 text-center text-zinc-400">Gasto no encontrado</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col pb-24">
      <TopBar title="Editar gasto" back />
      <ExpenseForm
        initialData={expense}
        isPending={updateExpense.isPending}
        submitLabel="Guardar cambios"
        onSubmit={handleSubmit}
      />
    </div>
  )
}
