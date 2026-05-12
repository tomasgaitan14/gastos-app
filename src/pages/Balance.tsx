import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { useBalance, useCreateSettlement } from '@/hooks/useBalance'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { formatCurrency, arsToUsd } from '@/lib/calculations'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { TopBar } from '@/components/layout/TopBar'
import { BalanceSkeleton } from '@/components/ui/Skeleton'
import type { DebtSummary } from '@/types'

export function Balance() {
  const { memberBalances, debts } = useBalance()
  const { rate } = useExchangeRate()
  const createSettlement = useCreateSettlement()

  const [viewCurrency, setViewCurrency] = useState<'ARS' | 'USD'>('ARS')
  const [settleDebt, setSettleDebt] = useState<DebtSummary | null>(null)
  const [settleAmount, setSettleAmount] = useState('')
  const [settleCurrency, setSettleCurrency] = useState<'ARS' | 'USD'>('ARS')
  const [settleDate, setSettleDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const convert = (ars: number) => viewCurrency === 'USD' ? arsToUsd(ars, rate) : ars

  async function handleSettle(e: React.FormEvent) {
    e.preventDefault()
    if (!settleDebt || !settleAmount) return
    await createSettlement.mutateAsync({
      from_user_id: settleDebt.from_member_id,
      to_user_id: settleDebt.to_member_id,
      amount: parseFloat(settleAmount),
      currency: settleCurrency,
      date: settleDate,
    })
    setSettleDebt(null)
    setSettleAmount('')
  }

  function openSettle(debt: DebtSummary) {
    setSettleDebt(debt)
    setSettleAmount((viewCurrency === 'USD' ? arsToUsd(debt.amount_ars, rate) : debt.amount_ars).toFixed(0))
    setSettleCurrency(viewCurrency)
    setSettleDate(format(new Date(), 'yyyy-MM-dd'))
  }

  const isLoading = memberBalances.length === 0 && debts.length === 0

  return (
    <div className="flex flex-col pb-24">
      <TopBar
        title="Balance"
        right={
          <div className="flex bg-zinc-100 rounded-lg p-0.5 text-xs font-medium">
            {(['ARS', 'USD'] as const).map(c => (
              <button key={c} onClick={() => setViewCurrency(c)}
                className={['px-2.5 py-1 rounded-md transition-colors', viewCurrency === c ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'].join(' ')}>
                {c}
              </button>
            ))}
          </div>
        }
      />

      <div className="px-4 py-4 flex flex-col gap-5">
        {/* Balance neto por persona */}
        <section>
          <p className="text-sm font-semibold text-zinc-700 mb-2">Balance neto</p>
          {isLoading ? (
            <div className="bg-white rounded-2xl border border-zinc-200/60 overflow-hidden">
              {Array.from({ length: 2 }).map((_, i) => <BalanceSkeleton key={i} />)}
            </div>
          ) : memberBalances.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-200/60 py-8 text-center text-sm text-zinc-400">
              Sin gastos registrados todavía
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200/60 overflow-hidden">
              {memberBalances.map((b, i) => {
                const amount = convert(Math.abs(b.net_ars))
                const isCreditor = b.net_ars > 0.5
                const isDebtor = b.net_ars < -0.5
                return (
                  <motion.div key={b.member_id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
                    className={['flex items-center gap-3 px-4 py-3', i > 0 ? 'border-t border-zinc-100' : ''].join(' ')}
                  >
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-semibold text-zinc-600 shrink-0">
                      {b.member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900">{b.member.name.split(' ')[0]}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{isCreditor ? 'le deben' : isDebtor ? 'debe' : 'al día'}</p>
                    </div>
                    <span className={['text-base font-bold shrink-0', isCreditor ? 'text-emerald-600' : isDebtor ? 'text-rose-600' : 'text-zinc-400'].join(' ')}>
                      {Math.abs(b.net_ars) < 0.5 ? '—' : formatCurrency(amount, viewCurrency)}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          )}
        </section>

        {/* Deudas simplificadas */}
        {debts.length > 0 && (
          <section>
            <p className="text-sm font-semibold text-zinc-700 mb-2">Transacciones para saldar</p>
            <div className="flex flex-col gap-3">
              {debts.map((debt, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 30 }}
                  className="bg-white rounded-2xl border border-zinc-200/60 p-4 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="font-medium text-zinc-900">{debt.from_member.name.split(' ')[0]}</span>
                      <ArrowRight size={14} className="text-zinc-300 shrink-0" />
                      <span className="font-medium text-zinc-900">{debt.to_member.name.split(' ')[0]}</span>
                    </div>
                    <p className="text-base font-bold text-rose-600 mt-0.5">{formatCurrency(convert(debt.amount_ars), viewCurrency)}</p>
                  </div>
                  <button onClick={() => openSettle(debt)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors shrink-0">
                    <CheckCircle size={20} weight="fill" />
                  </button>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {debts.length === 0 && memberBalances.length > 0 && (
          <div className="py-8 flex flex-col items-center gap-2">
            <CheckCircle size={40} weight="fill" className="text-emerald-500" />
            <p className="text-sm font-medium text-zinc-700">Todo saldado</p>
          </div>
        )}
      </div>

      <Modal open={settleDebt !== null} onClose={() => setSettleDebt(null)} title="Registrar pago">
        {settleDebt && (
          <form onSubmit={handleSettle} className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <span className="font-medium text-zinc-900">{settleDebt.from_member.name.split(' ')[0]}</span>
              <ArrowRight size={14} className="text-zinc-300" />
              <span className="font-medium text-zinc-900">{settleDebt.to_member.name.split(' ')[0]}</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input label="Monto pagado" type="number" min="0" step="any" value={settleAmount} onChange={e => setSettleAmount(e.target.value)} />
              </div>
              <div className="w-24 mt-auto">
                <Select options={[{ value: 'ARS', label: 'ARS' }, { value: 'USD', label: 'USD' }]} value={settleCurrency} onChange={e => setSettleCurrency(e.target.value as 'ARS' | 'USD')} />
              </div>
            </div>
            <Input label="Fecha" type="date" value={settleDate} onChange={e => setSettleDate(e.target.value)} />
            <Button type="submit" fullWidth loading={createSettlement.isPending}>Confirmar pago</Button>
          </form>
        )}
      </Modal>
    </div>
  )
}
