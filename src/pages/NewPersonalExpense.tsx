import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMembers } from '@/hooks/useMembers'
import { useCreatePersonalExpense } from '@/hooks/usePersonalExpenses'
import { useTenantId } from '@/hooks/useTenantId'
import { tp } from '@/lib/tenant'
import { PersonalExpenseForm } from '@/components/shared/PersonalExpenseForm'
import { Select } from '@/components/ui/Select'
import { TopBar } from '@/components/layout/TopBar'
import { useState } from 'react'
import type { NewPersonalExpensePayload } from '@/types'

export function NewPersonalExpense() {
  const navigate = useNavigate()
  const tenantId = useTenantId()
  const [searchParams] = useSearchParams()
  const { data: members = [] } = useMembers()
  const createExpense = useCreatePersonalExpense()

  const [memberId, setMemberId] = useState(searchParams.get('member') ?? members[0]?.id ?? '')

  const memberOptions = members.map(m => ({ value: m.id, label: m.name }))

  async function handleSubmit(payload: NewPersonalExpensePayload) {
    await createExpense.mutateAsync({ ...payload, member_id: memberId })
    navigate(tp(tenantId, '/expenses?tab=personal&member=' + memberId), { replace: true })
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col pb-24">
        <TopBar title="Gasto personal" back />
        <div className="px-4 py-16 text-center text-sm text-zinc-400">Primero agregá miembros en Ajustes</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col pb-24">
      <TopBar title="Gasto personal" back />
      <div className="px-4 pt-4">
        <Select label="Para quién" options={memberOptions} value={memberId} onChange={e => setMemberId(e.target.value)} />
      </div>
      {memberId && (
        <PersonalExpenseForm
          memberId={memberId}
          isPending={createExpense.isPending}
          submitLabel="Guardar gasto"
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}
