import { useParams, useNavigate } from 'react-router-dom'
import { usePersonalExpense, useUpdatePersonalExpense } from '@/hooks/usePersonalExpenses'
import { useTenantId } from '@/hooks/useTenantId'
import { tp } from '@/lib/tenant'
import { PersonalExpenseForm } from '@/components/shared/PersonalExpenseForm'
import { TopBar } from '@/components/layout/TopBar'
import { Skeleton } from '@/components/ui/Skeleton'
import type { NewPersonalExpensePayload } from '@/types'

export function EditPersonalExpense() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const tenantId = useTenantId()
  const { data: expense, isLoading } = usePersonalExpense(id!)
  const updateExpense = useUpdatePersonalExpense()

  async function handleSubmit(payload: NewPersonalExpensePayload) {
    await updateExpense.mutateAsync({ id: id!, payload })
    navigate(tp(tenantId, `/personal/${id}`), { replace: true })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col pb-24">
        <TopBar title="Editar gasto" back />
        <div className="px-4 py-4 flex flex-col gap-4">
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
      <TopBar title="Editar gasto personal" back />
      <PersonalExpenseForm
        memberId={expense.member_id}
        initialData={{
          description: expense.description,
          amount: expense.amount,
          currency: expense.currency,
          category: expense.category,
          date: expense.date,
          is_recurring: expense.is_recurring,
          recurrence_type: expense.recurrence_type,
          notes: expense.notes ?? '',
        }}
        isPending={updateExpense.isPending}
        submitLabel="Guardar cambios"
        onSubmit={handleSubmit}
      />
    </div>
  )
}
