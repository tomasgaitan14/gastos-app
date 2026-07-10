import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useInstallmentPayments, useUpsertInstallmentPayment } from '@/hooks/useInstallmentPayments'
import { getCurrentInstallment } from '@/lib/installments'
import { formatCurrency } from '@/lib/calculations'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { Currency } from '@/types'

interface InstallmentsSectionProps {
  expenseId: string
  startDate: string
  installmentsCount: number
  variableAmount: boolean
  referenceAmount: number
  currency: Currency
  type: 'shared' | 'personal'
}

export function InstallmentsSection({
  expenseId, startDate, installmentsCount, variableAmount, referenceAmount, currency, type,
}: InstallmentsSectionProps) {
  const { data: payments = [] } = useInstallmentPayments(expenseId, type)
  const upsert = useUpsertInstallmentPayment(type)
  const [modalOpen, setModalOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [paidDate, setPaidDate] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const current = getCurrentInstallment(startDate)
  const remaining = Math.max(0, installmentsCount - current + 1)
  const isFinished = current > installmentsCount
  const currentPayment = payments.find(p => p.installment_number === current)

  function openModal() {
    setAmount(referenceAmount.toString())
    setPaidDate(format(new Date(), 'yyyy-MM-dd'))
    setNotes('')
    setError('')
    setModalOpen(true)
  }

  async function handleSubmit() {
    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0) { setError('Ingresá un monto válido'); return }
    await upsert.mutateAsync({
      expense_id: expenseId,
      installment_number: current,
      amount: parsed,
      currency,
      paid_date: paidDate,
      notes,
    })
    setModalOpen(false)
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-zinc-700">Cuotas</p>
        <div className="bg-white rounded-2xl border border-zinc-200/60 overflow-hidden">
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-900">
                {isFinished ? 'Finalizada' : `Cuota ${current} de ${installmentsCount}`}
              </span>
              <span className="text-xs text-zinc-400">
                {isFinished ? `${installmentsCount} cuotas completadas` : `${remaining} restante${remaining !== 1 ? 's' : ''}`}
              </span>
            </div>
            <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${Math.min((Math.min(current, installmentsCount) / installmentsCount) * 100, 100)}%` }}
              />
            </div>
          </div>

          {variableAmount && !isFinished && (
            <div className="border-t border-zinc-100 px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-zinc-400">Cuota {current}</p>
                {currentPayment
                  ? <p className="text-sm font-semibold text-zinc-900 mt-0.5">{formatCurrency(currentPayment.amount, currentPayment.currency)}</p>
                  : <p className="text-xs text-zinc-500 mt-0.5">Sin registrar · ref: {formatCurrency(referenceAmount, currency)}</p>
                }
              </div>
              <button
                onClick={openModal}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-medium"
              >
                {currentPayment ? 'Actualizar' : 'Registrar monto'}
              </button>
            </div>
          )}

          {payments.length > 0 && (
            <div className="border-t border-zinc-100">
              <p className="px-4 pt-3 pb-1 text-xs font-medium text-zinc-400 uppercase tracking-wide">Historial</p>
              {payments.map((p, i) => (
                <div key={p.id} className={['flex items-center justify-between px-4 py-2.5', i > 0 ? 'border-t border-zinc-50' : ''].join(' ')}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-600">Cuota {p.installment_number}</span>
                    <span className="text-xs text-zinc-300">·</span>
                    <span className="text-xs text-zinc-400">{format(new Date(p.paid_date + 'T00:00:00'), 'd MMM yyyy', { locale: es })}</span>
                  </div>
                  <span className="text-sm font-semibold text-zinc-900">{formatCurrency(p.amount, p.currency)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Registrar cuota ${current} de ${installmentsCount}`}>
        <div className="p-5 flex flex-col gap-4">
          <Input
            label={`Monto (ref: ${formatCurrency(referenceAmount, currency)})`}
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={e => { setAmount(e.target.value); setError('') }}
            error={error}
          />
          <Input
            label="Fecha de pago"
            type="date"
            value={paidDate}
            onChange={e => setPaidDate(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Notas (opcional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ej: incluye interés de este mes"
              className="px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-emerald-500 focus:bg-white transition-colors resize-none"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button fullWidth loading={upsert.isPending} onClick={handleSubmit}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
