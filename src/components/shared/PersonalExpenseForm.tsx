import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useCategories } from '@/hooks/useCategories'
import { CURRENCIES } from '@/constants'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import type { Currency, RecurrenceType, NewPersonalExpensePayload } from '@/types'

interface PersonalExpenseFormProps {
  memberId: string
  initialData?: Omit<NewPersonalExpensePayload, 'member_id'>
  isPending: boolean
  submitLabel: string
  onSubmit: (payload: NewPersonalExpensePayload) => void
}

export function PersonalExpenseForm({ memberId, initialData, isPending, submitLabel, onSubmit }: PersonalExpenseFormProps) {
  const { data: categories = [] } = useCategories()
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? '')
  const [currency, setCurrency] = useState<Currency>(initialData?.currency ?? 'ARS')
  const [category, setCategory] = useState<string>(initialData?.category ?? '')

  useEffect(() => {
    if (!category && categories.length > 0) setCategory(categories[0].id)
  }, [categories, category])
  const [date, setDate] = useState(initialData?.date ?? format(new Date(), 'yyyy-MM-dd'))
  const [isRecurring, setIsRecurring] = useState(initialData?.is_recurring ?? false)
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(initialData?.recurrence_type ?? 'monthly')
  const [notes, setNotes] = useState(initialData?.notes ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!description.trim()) errs.description = 'Ingresá una descripción'
    if (!amount || parseFloat(amount) <= 0) errs.amount = 'Ingresá un monto válido'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      member_id: memberId,
      description: description.trim(),
      amount: parseFloat(amount),
      currency,
      category,
      date,
      is_recurring: isRecurring,
      recurrence_type: isRecurring ? recurrenceType : null,
      notes,
    })
  }

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.label }))
  const currencyOptions = CURRENCIES.map(c => ({ value: c, label: c }))

  return (
    <form onSubmit={handleSubmit} className="px-4 py-4 flex flex-col gap-5">
      <Input label="Descripción" placeholder="Ej: Spotify" value={description} onChange={e => setDescription(e.target.value)} error={errors.description} />

      <div className="flex gap-2">
        <div className="flex-1">
          <Input label="Monto" type="number" min="0" step="any" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} error={errors.amount} />
        </div>
        <div className="w-24 mt-auto">
          <Select options={currencyOptions} value={currency} onChange={e => setCurrency(e.target.value as Currency)} />
        </div>
      </div>

      <Select label="Categoría" options={categoryOptions} value={category} onChange={e => setCategory(e.target.value)} />

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

      <Button type="submit" size="lg" fullWidth loading={isPending}>{submitLabel}</Button>
    </form>
  )
}
