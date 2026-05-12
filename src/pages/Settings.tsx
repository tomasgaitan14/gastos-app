import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowsClockwise, SignOut, PencilSimple, Trash, UserPlus } from '@phosphor-icons/react'
import { useAuth } from '@/contexts/AuthContext'
import { useMembers, useAddMember, useUpdateMember, useDeleteMember } from '@/hooks/useMembers'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { formatCurrency } from '@/lib/calculations'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TopBar } from '@/components/layout/TopBar'
import type { Currency, Member } from '@/types'

type MemberForm = { name: string; salary: string; currency: Currency }
const emptyForm = (): MemberForm => ({ name: '', salary: '', currency: 'ARS' })

export function Settings() {
  const { user, signOut } = useAuth()
  const { data: members = [] } = useMembers()
  const { rate, updatedAt, refresh, setManual } = useExchangeRate()
  const addMember = useAddMember()
  const updateMember = useUpdateMember()
  const deleteMember = useDeleteMember()

  const [manualRate, setManualRate] = useState('')

  // Modal agregar/editar
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [form, setForm] = useState<MemberForm>(emptyForm())
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Modal eliminar
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null)
  const [deleteError, setDeleteError] = useState('')

  function openAdd() {
    setEditingMember(null)
    setForm(emptyForm())
    setFormErrors({})
    setModalOpen(true)
  }

  function openEdit(m: Member) {
    setEditingMember(m)
    setForm({ name: m.name, salary: m.salary?.toString() ?? '', currency: m.salary_currency })
    setFormErrors({})
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingMember(null)
    setFormErrors({})
  }

  function validateForm(): boolean {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Ingresá el nombre'
    if (!form.salary || parseFloat(form.salary) <= 0) errs.salary = 'Ingresá un salario válido'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSaveMember(e: React.FormEvent) {
    e.preventDefault()
    if (!validateForm()) return
    const salary = parseFloat(form.salary)
    if (editingMember) {
      await updateMember.mutateAsync({ id: editingMember.id, name: form.name.trim(), salary, salaryCurrency: form.currency })
    } else {
      await addMember.mutateAsync({ name: form.name.trim(), salary, salaryCurrency: form.currency })
    }
    closeModal()
  }

  async function handleDeleteMember() {
    if (!deleteTarget) return
    setDeleteError('')
    try {
      await deleteMember.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      if (code === '23503') {
        setDeleteError('Este miembro tiene gastos registrados. Eliminá los gastos primero.')
      } else {
        setDeleteError('No se pudo eliminar. Intentá de nuevo.')
      }
    }
  }

  async function handleSetManualRate(e: React.FormEvent) {
    e.preventDefault()
    const num = parseFloat(manualRate)
    if (!num || num <= 0) return
    await setManual.mutateAsync(num)
    setManualRate('')
  }

  const isPending = addMember.isPending || updateMember.isPending

  return (
    <div className="flex flex-col pb-24">
      <TopBar title="Ajustes" />

      <div className="px-4 py-4 flex flex-col gap-5">
        {/* Miembros */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-zinc-700">Miembros del grupo</p>
            <button onClick={openAdd} className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
              <UserPlus size={14} /> Agregar
            </button>
          </div>

          {members.length === 0 ? (
            <button
              onClick={openAdd}
              className="w-full bg-white rounded-2xl border border-dashed border-zinc-300 py-8 flex flex-col items-center gap-2 text-zinc-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
            >
              <UserPlus size={24} />
              <span className="text-sm">Agregar primer miembro</span>
            </button>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200/60 overflow-hidden">
              {members.map((m, i) => (
                <div key={m.id} className={['flex items-center gap-3 px-4 py-3', i > 0 ? 'border-t border-zinc-100' : ''].join(' ')}>
                  <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-semibold text-zinc-600 shrink-0">
                    {m.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900">{m.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {m.salary ? `${formatCurrency(m.salary, m.salary_currency)} / mes` : 'Sin salario'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(m)} className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors">
                      <PencilSimple size={16} />
                    </button>
                    <button onClick={() => setDeleteTarget(m)} className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Tipo de cambio */}
        <section>
          <p className="text-sm font-semibold text-zinc-700 mb-2">Tipo de cambio (dólar cripto)</p>
          <div className="bg-white rounded-2xl border border-zinc-200/60 p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-zinc-900">{rate > 0 ? formatCurrency(rate, 'ARS') : '—'}</p>
                {updatedAt && (
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Actualizado {format(new Date(updatedAt), "d MMM 'a las' HH:mm", { locale: es })}
                  </p>
                )}
              </div>
              <button onClick={() => refresh.mutate()} disabled={refresh.isPending} className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors disabled:opacity-50">
                <ArrowsClockwise size={18} className={refresh.isPending ? 'animate-spin' : ''} />
              </button>
            </div>
            <form onSubmit={handleSetManualRate} className="flex gap-2">
              <div className="flex-1">
                <Input placeholder="Ingresar valor manual" type="number" min="1" step="any" value={manualRate} onChange={e => setManualRate(e.target.value)} />
              </div>
              <div className="mt-auto">
                <Button type="submit" variant="secondary" loading={setManual.isPending}>Setear</Button>
              </div>
            </form>
          </div>
        </section>

        {/* Cuenta */}
        <section>
          <p className="text-sm font-semibold text-zinc-700 mb-2">Cuenta</p>
          <div className="bg-white rounded-2xl border border-zinc-200/60 px-4 py-3">
            <p className="text-sm text-zinc-500">{user?.email}</p>
          </div>
        </section>

        <Button variant="ghost" fullWidth icon={<SignOut size={18} />} onClick={signOut}>
          Cerrar sesión
        </Button>
      </div>

      {/* Modal agregar / editar miembro */}
      <Modal open={modalOpen} onClose={closeModal} title={editingMember ? 'Editar miembro' : 'Agregar miembro'}>
        <form onSubmit={handleSaveMember} className="p-5 flex flex-col gap-4">
          <Input label="Nombre" placeholder="Ana García" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} error={formErrors.name} autoComplete="off" />
          <div className="flex gap-2">
            <div className="flex-1">
              <Input label="Salario neto mensual" type="number" min="1" step="any" placeholder="85000" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} error={formErrors.salary} />
            </div>
            <div className="w-24 mt-auto">
              <Select options={[{ value: 'ARS', label: 'ARS' }, { value: 'USD', label: 'USD' }]} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value as Currency }))} />
            </div>
          </div>
          <Button type="submit" fullWidth loading={isPending}>
            {editingMember ? 'Guardar cambios' : 'Agregar'}
          </Button>
        </form>
      </Modal>

      {/* Modal confirmar eliminación */}
      <Modal open={deleteTarget !== null} onClose={() => { setDeleteTarget(null); setDeleteError('') }} title="Eliminar miembro">
        <div className="p-5 flex flex-col gap-4">
          <p className="text-sm text-zinc-600">
            ¿Eliminar a <span className="font-medium text-zinc-900">{deleteTarget?.name}</span>? Se perderán sus datos de salario pero los gastos donde participó se mantienen.
          </p>
          {deleteError && (
            <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-3 py-2">{deleteError}</p>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => { setDeleteTarget(null); setDeleteError('') }}>Cancelar</Button>
            <Button variant="danger" fullWidth loading={deleteMember.isPending} onClick={handleDeleteMember}>Eliminar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
