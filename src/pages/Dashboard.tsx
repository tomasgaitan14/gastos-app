import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowRight, TrendUp, TrendDown, Minus } from '@phosphor-icons/react'
import { useExpenses } from '@/hooks/useExpenses'
import { useBalance } from '@/hooks/useBalance'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { useMembers } from '@/hooks/useMembers'
import { usePersonalExpenses } from '@/hooks/usePersonalExpenses'
import { formatCurrency } from '@/lib/calculations'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { TopBar } from '@/components/layout/TopBar'
import { ExpenseItemSkeleton } from '@/components/ui/Skeleton'

type Tab = 'compartidos' | 'personal'

export function Dashboard() {
  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses()
  const { memberBalances, debts } = useBalance()
  const { rate, updatedAt } = useExchangeRate()
  const { data: members = [] } = useMembers()

  const [recentTab, setRecentTab] = useState<Tab>('compartidos')
  const [selectedMemberId, setSelectedMemberId] = useState('')

  useEffect(() => {
    if (!selectedMemberId && members.length > 0) setSelectedMemberId(members[0].id)
  }, [members, selectedMemberId])

  const { data: personalExpenses = [], isLoading: loadingPersonal } = usePersonalExpenses(
    recentTab === 'personal' ? selectedMemberId : null
  )

  const recentExpenses = expenses.slice(0, 5)
  const recentPersonal = personalExpenses.slice(0, 5)

  const thisMonthTotal = useMemo(() => {
    const now = new Date()
    const isThisMonth = (date: string) => {
      const d = new Date(date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }
    if (recentTab === 'personal') {
      return personalExpenses
        .filter(e => isThisMonth(e.date))
        .reduce((sum, e) => sum + (e.currency === 'USD' ? e.amount * rate : e.amount), 0)
    }
    return expenses
      .filter(e => isThisMonth(e.date))
      .reduce((sum, e) => sum + (e.currency === 'USD' ? e.amount * rate : e.amount), 0)
  }, [expenses, personalExpenses, recentTab, rate])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <div className="flex flex-col pb-24">
      <TopBar title="gastos app" />

      <div className="px-4 pt-5 flex flex-col gap-5">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          className="text-lg font-semibold text-zinc-900 tracking-tight"
        >
          {greeting()}
        </motion.p>

        {/* Cards resumen */}
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard
            label={recentTab === 'personal' ? 'Gastos personales' : 'Gastos este mes'}
            value={formatCurrency(thisMonthTotal, 'ARS')}
            sub={`${(recentTab === 'personal' ? personalExpenses : expenses).filter(e => { const d = new Date(e.date); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear() }).length} gastos`}
          />
          <SummaryCard
            label="Miembros"
            value={String(members.length)}
            sub={members.length === 0 ? 'Agregá en Ajustes' : members.map(m => m.name.split(' ')[0]).join(', ')}
          />
        </div>

        {/* Tipo de cambio */}
        {rate > 0 && (
          <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-zinc-200/60">
            <span className="text-xs text-zinc-500">Dólar cripto</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-900">{formatCurrency(rate, 'ARS')}</span>
              {updatedAt && (
                <span className="text-xs text-zinc-400">{format(new Date(updatedAt), 'HH:mm', { locale: es })}</span>
              )}
            </div>
          </div>
        )}

        {/* Deudas activas */}
        {debts.length > 0 && (
          <section>
            <SectionHeader title="Deudas activas" to="/balance" />
            <div className="bg-white rounded-2xl border border-zinc-200/60 overflow-hidden">
              {debts.slice(0, 3).map((debt, i) => (
                <div key={i} className={['flex items-center gap-3 px-4 py-3', i > 0 ? 'border-t border-zinc-100' : ''].join(' ')}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-900 truncate">
                      <span className="font-medium">{debt.from_member.name.split(' ')[0]}</span>
                      <span className="text-zinc-400"> → </span>
                      <span className="font-medium">{debt.to_member.name.split(' ')[0]}</span>
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-rose-600 shrink-0">{formatCurrency(debt.amount_ars, 'ARS')}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Últimos gastos */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-zinc-700">Últimos gastos</h3>
            <Link
              to={recentTab === 'personal' ? `/expenses?tab=personal&member=${selectedMemberId}` : '/expenses'}
              className="flex items-center gap-1 text-xs text-emerald-600 font-medium"
            >
              Ver todo <ArrowRight size={12} />
            </Link>
          </div>

          {/* Toggle compartidos / personal */}
          <div className="flex bg-zinc-100 rounded-xl p-1 mb-3">
            {(['compartidos', 'personal'] as Tab[]).map(t => (
              <button key={t} onClick={() => setRecentTab(t)}
                className={['flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors', recentTab === t ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'].join(' ')}>
                {t === 'compartidos' ? 'Compartidos' : 'Personales'}
              </button>
            ))}
          </div>

          {recentTab === 'compartidos' ? (
            loadingExpenses ? (
              <div className="bg-white rounded-2xl border border-zinc-200/60 overflow-hidden">
                {Array.from({ length: 3 }).map((_, i) => <ExpenseItemSkeleton key={i} />)}
              </div>
            ) : recentExpenses.length === 0 ? (
              <div className="bg-white rounded-2xl border border-zinc-200/60 py-10 flex flex-col items-center gap-2">
                <p className="text-sm text-zinc-500">Sin gastos todavía</p>
                <p className="text-xs text-zinc-400">Tocá el + para agregar el primero</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-zinc-200/60 overflow-hidden">
                {recentExpenses.map((expense, i) => {
                  const payer = members.find(m => m.id === expense.paid_by)
                  return (
                    <Link key={expense.id} to={`/expenses/${expense.id}`}
                      className={['flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors', i > 0 ? 'border-t border-zinc-100' : ''].join(' ')}>
                      <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center text-lg shrink-0">
                        {categoryEmoji(expense.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">{expense.description}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {payer?.name.split(' ')[0]} · {format(new Date(expense.date), 'd MMM', { locale: es })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end shrink-0 gap-1">
                        <span className="text-sm font-semibold text-zinc-900">{formatCurrency(expense.amount, expense.currency)}</span>
                        {expense.is_recurring && <Badge variant="neutral">recurrente</Badge>}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )
          ) : (
            <>
              {members.length > 1 && (
                <div className="mb-3">
                  <Select
                    options={members.map(m => ({ value: m.id, label: m.name }))}
                    value={selectedMemberId}
                    onChange={e => setSelectedMemberId(e.target.value)}
                  />
                </div>
              )}
              {loadingPersonal ? (
                <div className="bg-white rounded-2xl border border-zinc-200/60 overflow-hidden">
                  {Array.from({ length: 3 }).map((_, i) => <ExpenseItemSkeleton key={i} />)}
                </div>
              ) : recentPersonal.length === 0 ? (
                <div className="bg-white rounded-2xl border border-zinc-200/60 py-10 flex flex-col items-center gap-2">
                  <p className="text-sm text-zinc-500">Sin gastos personales</p>
                  <p className="text-xs text-zinc-400">Tocá el + para agregar el primero</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-zinc-200/60 overflow-hidden">
                  {recentPersonal.map((expense, i) => (
                    <Link key={expense.id} to={`/personal/${expense.id}`}
                      className={['flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors', i > 0 ? 'border-t border-zinc-100' : ''].join(' ')}>
                      <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center text-lg shrink-0">
                        {categoryEmoji(expense.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">{expense.description}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {format(new Date(expense.date), 'd MMM', { locale: es })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end shrink-0 gap-1">
                        <span className="text-sm font-semibold text-zinc-900">{formatCurrency(expense.amount, expense.currency)}</span>
                        {expense.is_recurring && <Badge variant="neutral">recurrente</Badge>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* Balance neto rápido */}
        {memberBalances.length > 0 && (
          <section>
            <SectionHeader title="Balance rápido" to="/balance" />
            <div className="bg-white rounded-2xl border border-zinc-200/60 overflow-hidden">
              {memberBalances.map((b, i) => (
                <div key={b.member_id} className={['flex items-center gap-3 px-4 py-3', i > 0 ? 'border-t border-zinc-100' : ''].join(' ')}>
                  <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-xs font-semibold text-zinc-600 shrink-0">
                    {b.member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm font-medium text-zinc-900">{b.member.name.split(' ')[0]}</span>
                  <span className={['text-sm font-semibold shrink-0', b.net_ars > 0.5 ? 'text-emerald-600' : b.net_ars < -0.5 ? 'text-rose-600' : 'text-zinc-400'].join(' ')}>
                    {Math.abs(b.net_ars) < 0.5 ? '—' : (b.net_ars > 0 ? '+' : '') + formatCurrency(b.net_ars, 'ARS')}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, sub, positive }: { label: string; value: string; sub: string; positive?: boolean }) {
  const Icon = positive === undefined ? Minus : positive ? TrendUp : TrendDown
  const iconColor = positive === undefined ? 'text-zinc-400' : positive ? 'text-emerald-500' : 'text-rose-500'
  return (
    <div className="bg-white rounded-2xl border border-zinc-200/60 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400 font-medium">{label}</span>
        <Icon size={16} className={iconColor} />
      </div>
      <div>
        <p className="text-lg font-bold text-zinc-900 tracking-tight leading-none">{value}</p>
        <p className="text-xs text-zinc-400 mt-1 truncate">{sub}</p>
      </div>
    </div>
  )
}

function SectionHeader({ title, to }: { title: string; to?: string }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-semibold text-zinc-700">{title}</h3>
      {to && (
        <Link to={to} className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
          Ver todo <ArrowRight size={12} />
        </Link>
      )}
    </div>
  )
}

function categoryEmoji(category: string): string {
  const map: Record<string, string> = { alquiler: '🏠', servicios: '💡', supermercado: '🛒', salidas: '🍽️', salud: '💊', transporte: '🚌', entretenimiento: '🎬', otros: '📦' }
  return map[category] ?? '📦'
}
