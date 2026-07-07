import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTenantId } from '@/hooks/useTenantId'
import { tp } from '@/lib/tenant'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Trash, PencilSimple } from '@phosphor-icons/react'
import { usePersonalExpense, useDeletePersonalExpense } from '@/hooks/usePersonalExpenses'
import { useMembers } from '@/hooks/useMembers'
import { formatCurrency } from '@/lib/calculations'
import { RECURRENCE_LABELS } from '@/constants'
import { useCategoryLabel } from '@/hooks/useCategories'
import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'

export function PersonalExpenseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const tenantId = useTenantId()
  const { data: expense, isLoading } = usePersonalExpense(id!)
  const { data: members = [] } = useMembers()
  const deleteExpense = useDeletePersonalExpense()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const categoryLabel = useCategoryLabel(expense?.category ?? '')

  const member = members.find(m => m.id === expense?.member_id)

  async function handleDelete() {
    await deleteExpense.mutateAsync(id!)
    navigate(tp(tenantId, '/expenses?tab=personal&member=' + expense?.member_id), { replace: true })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col pb-24">
        <TopBar title="Gasto personal" back />
        <div className="px-4 py-4 flex flex-col gap-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!expense) {
    return (
      <div className="flex flex-col pb-24">
        <TopBar title="Gasto personal" back />
        <div className="px-4 py-12 text-center text-zinc-400">Gasto no encontrado</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col pb-24">
      <TopBar
        title="Detalle"
        back
        right={
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(tp(tenantId, `/personal/${id}/edit`))} className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors">
              <PencilSimple size={18} />
            </button>
            <button onClick={() => setConfirmOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 transition-colors">
              <Trash size={18} />
            </button>
          </div>
        }
      />

      <div className="px-4 py-4 flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200/60 p-5 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">
              {categoryEmoji(expense.category)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-zinc-900 leading-tight">{expense.description}</h2>
              <p className="text-zinc-400 text-sm mt-0.5">{categoryLabel}</p>
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight text-zinc-900">{formatCurrency(expense.amount, expense.currency)}</div>
          <div className="flex flex-wrap gap-2">
            {expense.is_recurring && <Badge variant="neutral">{RECURRENCE_LABELS[expense.recurrence_type!]}</Badge>}
            <Badge variant="default">{expense.currency}</Badge>
            <Badge variant="default">Personal</Badge>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/60 overflow-hidden">
          <InfoRow label="Miembro" value={<span className="text-sm font-medium text-zinc-900">{member?.name ?? '—'}</span>} />
          <InfoRow label="Fecha" value={<span className="text-sm text-zinc-900">{format(new Date(expense.date), "d 'de' MMMM, yyyy", { locale: es })}</span>} border />
          {expense.notes && <InfoRow label="Notas" value={<span className="text-sm text-zinc-600">{expense.notes}</span>} border />}
        </div>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Eliminar gasto">
        <div className="p-5 flex flex-col gap-4">
          <p className="text-sm text-zinc-600">
            ¿Eliminar <span className="font-medium text-zinc-900">"{expense.description}"</span>? No se puede deshacer.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button variant="danger" fullWidth loading={deleteExpense.isPending} onClick={handleDelete}>Eliminar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function InfoRow({ label, value, border }: { label: string; value: React.ReactNode; border?: boolean }) {
  return (
    <div className={['flex items-center justify-between px-4 py-3 gap-3', border ? 'border-t border-zinc-100' : ''].join(' ')}>
      <span className="text-sm text-zinc-400 shrink-0">{label}</span>
      <div className="flex justify-end">{value}</div>
    </div>
  )
}

function categoryEmoji(category: string): string {
  const map: Record<string, string> = { alquiler: '🏠', servicios: '💡', supermercado: '🛒', salidas: '🍽️', salud: '💊', transporte: '🚌', entretenimiento: '🎬', otros: '📦' }
  return map[category] ?? '📦'
}
