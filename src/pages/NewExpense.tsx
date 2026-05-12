import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useMembers } from '@/hooks/useMembers'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { useCreateExpense } from '@/hooks/useExpenses'
import { calculateSplits, formatCurrency } from '@/lib/calculations'
import { CATEGORIES, CURRENCIES } from '@/constants'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { TopBar } from '@/components/layout/TopBar'
import type { Currency, ExpenseCategory, RecurrenceType, NewExpensePayload } from '@/types'

export function NewExpense() {
  const navigate = useNavigate()
  const { data: members = [] } = useMembers()
  const { rate } = useExchangeRate()
  const createExpense = useCreateExpense()

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('ARS')
  const [paidBy, setPaidBy] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('otros')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('monthly')
  const [notes, setNotes] = useState('')
  const [excludedIds, setExcludedIds] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const amountNum = parseFloat(amount) || 0

  const splitPreview = useMemo(() => {
    if (amountNum <= 0 || members.length === 0) return []
    return calculateSplits(amountNum, members, excludedIds, rate)
  }, [amountNum, members, excludedIds, rate])

  function toggleExclude(id: string) {
    setExcludedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!description.trim()) errs.description = 'Ingresá una descripción'
    if (!amount || parseFloat(amount) <= 0) errs.amount = 'Ingresá un monto válido'
    if (!paidBy) errs.paidBy = 'Seleccioná quién pagó'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const payload: NewExpensePayload = {
      description: description.trim(),
      amount: parseFloat(amount),
      currency,
      paid_by: paidBy,
      category,
      date,
      is_recurring: isRecurring,
      recurrence_type: isRecurring ? recurrenceType : null,
      notes,
      excluded_member_ids: excludedIds,
    }

    await createExpense.mutateAsync({ payload, members, exchangeRate: rate })
    navigate('/expenses', { replace: true })
  }

  const categoryOptions = Object.entries(CATEGORIES).map(([v, l]) => ({ value: v, label: l }))
  const memberOptions = [
    { value: '', label: 'Seleccioná...' },
    ...members.map(m => ({ value: m.id, label: m.name })),
  ]
  const currencyOptions = CURRENCIES.map(c => ({ value: c, label: c }))

  if (members.length === 0) {
    return (
      <div className="flex flex-col pb-24">
        <TopBar title="Nuevo gasto" back />
        <div className="px-4 py-16 flex flex-col items-center gap-3 text-center">
          <p className="text-zinc-500 text-sm">Primero agregá miembros en Ajustes</p>
          <Button variant="secondary" onClick={() => navigate('/settings')}>Ir a Ajustes</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col pb-24">
      <TopBar title="Nuevo gasto" back />
      <form onSubmit={handleSubmit} className="px-4 py-4 flex flex-col gap-5">
        <Input label="Descripción" placeholder="Ej: Alquiler enero" value={description} onChange={e => setDescription(e.target.value)} error={errors.description} />

        <div className="flex gap-2">
          <div className="flex-1">
            <Input label="Monto" type="number" min="0" step="any" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} error={errors.amount} />
          </div>
          <div className="w-24 mt-auto">
            <Select options={currencyOptions} value={currency} onChange={e => setCurrency(e.target.value as Currency)} />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Select label="¿Quién pagó?" options={memberOptions} value={paidBy} onChange={e => setPaidBy(e.target.value)} />
            {errors.paidBy && <p className="text-xs text-rose-600 mt-1">{errors.paidBy}</p>}
          </div>
          <div className="flex-1">
            <Select label="Categoría" options={categoryOptions} value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)} />
          </div>
        </div>

        <Input label="Fecha" type="date" value={date} onChange={e => setDate(e.target.value)} />

        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => setIsRecurring(p => !p)} className={['w-10 h-6 rounded-full transition-colors relative cursor-pointer', isRecurring ? 'bg-emerald-500' : 'bg-zinc-200'].join(' ')}>
            <div className={['absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform', isRecurring ? 'translate-x-5' : 'translate-x-1'].join(' ')} />
          </div>
          <span className="text-sm font-medium text-zinc-700">Gasto recurrente</span>
        </label>
        {isRecurring && (
          <Select options={[{ value: 'weekly', label: 'Semanal' }, { value: 'monthly', label: 'Mensual' }, { value: 'yearly', label: 'Anual' }]} value={recurrenceType} onChange={e => setRecurrenceType(e.target.value as RecurrenceType)} />
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Notas (opcional)</label>
          <textarea rows={2} placeholder="Detalles adicionales..." value={notes} onChange={e => setNotes(e.target.value)} className="px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-emerald-500 focus:bg-white transition-colors resize-none" />
        </div>

        {members.length > 1 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-zinc-700">Excluir del gasto</p>
            <div className="flex flex-wrap gap-2">
              {members.map(m => {
                const isExcluded = excludedIds.includes(m.id)
                return (
                  <button key={m.id} type="button" onClick={() => toggleExclude(m.id)}
                    className={['flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm transition-colors', isExcluded ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-zinc-200 text-zinc-700'].join(' ')}>
                    <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-semibold text-zinc-600">{m.name.slice(0, 2).toUpperCase()}</div>
                    {m.name.split(' ')[0]}
                    {isExcluded && <span className="text-xs">excluido</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {splitPreview.length > 0 && amountNum > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-zinc-700">Cómo se divide</p>
            <div className="bg-zinc-50 rounded-2xl border border-zinc-200/60 overflow-hidden">
              {splitPreview.filter(s => !s.is_excluded).map((split, i) => (
                <div key={split.member_id} className={['flex items-center gap-3 px-4 py-3', i > 0 ? 'border-t border-zinc-200/60' : ''].join(' ')}>
                  <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-semibold text-zinc-600 shrink-0">{split.member.name.slice(0, 2).toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900">{split.member.name.split(' ')[0]}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="flex-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${split.percentage}%` }} />
                      </div>
                      <span className="text-xs text-zinc-400 w-10 text-right">{split.percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-zinc-900 shrink-0">{formatCurrency(split.amount, currency)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button type="submit" size="lg" fullWidth loading={createExpense.isPending}>Guardar gasto</Button>
      </form>
    </div>
  )
}
