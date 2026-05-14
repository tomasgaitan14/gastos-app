import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Plus } from '@phosphor-icons/react'
import { useExpenses } from '@/hooks/useExpenses'
import { useMembers } from '@/hooks/useMembers'
import { usePersonalExpenses } from '@/hooks/usePersonalExpenses'
import { formatCurrency } from '@/lib/calculations'
import { RECURRENCE_LABELS } from '@/constants'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { ExpenseItemSkeleton } from '@/components/ui/Skeleton'
import { TopBar } from '@/components/layout/TopBar'
import type { ExpenseWithSplits, PersonalExpense } from '@/types'

type SharedFilter = 'todos' | 'recurrentes' | 'unicos'
type Tab = 'compartidos' | 'personal'

const SHARED_FILTERS: { value: SharedFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'recurrentes', label: 'Recurrentes' },
  { value: 'unicos', label: 'Únicos' },
]

export function Expenses() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) ?? 'compartidos')
  const [sharedFilter, setSharedFilter] = useState<SharedFilter>('todos')

  const { data: expenses = [], isLoading: loadingShared } = useExpenses()
  const { data: members = [] } = useMembers()

  const [selectedMemberId, setSelectedMemberId] = useState(
    searchParams.get('member') ?? members[0]?.id ?? ''
  )

  useEffect(() => {
    if (!selectedMemberId && members.length > 0) setSelectedMemberId(members[0].id)
  }, [members, selectedMemberId])

  const { data: personalExpenses = [], isLoading: loadingPersonal } = usePersonalExpenses(
    tab === 'personal' ? selectedMemberId : null
  )

  // Shared expenses filtered + grouped
  const filteredShared = useMemo(() => {
    if (sharedFilter === 'recurrentes') return expenses.filter(e => e.is_recurring)
    if (sharedFilter === 'unicos') return expenses.filter(e => !e.is_recurring)
    return expenses
  }, [expenses, sharedFilter])

  const groupedShared = useMemo(() => {
    const groups: Record<string, ExpenseWithSplits[]> = {}
    for (const expense of filteredShared) {
      const key = format(new Date(expense.date), 'yyyy-MM')
      if (!groups[key]) groups[key] = []
      groups[key].push(expense)
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filteredShared])

  // Personal expenses grouped
  const groupedPersonal = useMemo(() => {
    const groups: Record<string, PersonalExpense[]> = {}
    for (const expense of personalExpenses) {
      const key = format(new Date(expense.date), 'yyyy-MM')
      if (!groups[key]) groups[key] = []
      groups[key].push(expense)
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [personalExpenses])

  const memberOptions = members.map(m => ({ value: m.id, label: m.name }))

  return (
    <div className="flex flex-col pb-24">
      <TopBar title="Gastos" />

      {/* Tab toggle */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex bg-zinc-100 rounded-xl p-1">
          {(['compartidos', 'personal'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={['flex-1 py-2 rounded-lg text-sm font-medium transition-colors', tab === t ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'].join(' ')}>
              {t === 'compartidos' ? 'Compartidos' : 'Personales'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'compartidos' ? (
        <>
          <div className="px-4 py-3 flex gap-2">
            {SHARED_FILTERS.map(f => (
              <button key={f.value} onClick={() => setSharedFilter(f.value)}
                className={['px-3 py-1.5 rounded-xl text-sm font-medium transition-colors', sharedFilter === f.value ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-500 border border-zinc-200'].join(' ')}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="px-4 flex flex-col gap-5">
            {loadingShared ? (
              <div className="bg-white rounded-2xl border border-zinc-200/60 overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => <ExpenseItemSkeleton key={i} />)}
              </div>
            ) : groupedShared.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-2">
                <p className="text-zinc-400 text-sm">Sin gastos en esta categoría</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {groupedShared.map(([key, items]) => (
                  <SharedGroup key={key} monthKey={key} items={items} members={members} />
                ))}
              </AnimatePresence>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Member selector + add button */}
          <div className="px-4 py-3 flex items-end gap-2">
            <div className="flex-1">
              {memberOptions.length > 0
                ? <Select label="Miembro" options={memberOptions} value={selectedMemberId} onChange={e => setSelectedMemberId(e.target.value)} />
                : <p className="text-sm text-zinc-400">Sin miembros</p>
              }
            </div>
            {selectedMemberId && (
              <button
                onClick={() => navigate(`/personal/new?member=${selectedMemberId}`)}
                className="h-10 px-3 flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white text-sm font-medium shrink-0"
              >
                <Plus size={16} weight="bold" /> Agregar
              </button>
            )}
          </div>

          <div className="px-4 flex flex-col gap-5">
            {!selectedMemberId ? (
              <div className="py-16 flex flex-col items-center gap-3">
                <UserPlus size={32} className="text-zinc-300" />
                <p className="text-sm text-zinc-400">Agregá miembros en Ajustes primero</p>
              </div>
            ) : loadingPersonal ? (
              <div className="bg-white rounded-2xl border border-zinc-200/60 overflow-hidden">
                {Array.from({ length: 3 }).map((_, i) => <ExpenseItemSkeleton key={i} />)}
              </div>
            ) : groupedPersonal.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-2">
                <p className="text-zinc-400 text-sm">Sin gastos personales todavía</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {groupedPersonal.map(([key, items]) => (
                  <PersonalGroup key={key} monthKey={key} items={items} />
                ))}
              </AnimatePresence>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function SharedGroup({ monthKey, items, members }: { monthKey: string; items: ExpenseWithSplits[]; members: ReturnType<typeof useMembers>['data'] & object[] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-zinc-500 capitalize">
          {format(new Date(monthKey + '-01'), 'MMMM yyyy', { locale: es })}
        </h3>
        <span className="text-xs text-zinc-400">{items.length} gastos</span>
      </div>
      <div className="bg-white rounded-2xl border border-zinc-200/60 overflow-hidden">
        {items.map((expense, i) => {
          const payer = members?.find(m => m.id === expense.paid_by)
          return (
            <Link key={expense.id} to={`/expenses/${expense.id}`}
              className={['flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors active:bg-zinc-100', i > 0 ? 'border-t border-zinc-100' : ''].join(' ')}>
              <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center text-lg shrink-0">
                {categoryEmoji(expense.category)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">{expense.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {payer && <span className="text-xs text-zinc-400">{payer.name.split(' ')[0]}</span>}
                  <span className="text-xs text-zinc-300">·</span>
                  <span className="text-xs text-zinc-400">{format(new Date(expense.date), 'd MMM', { locale: es })}</span>
                  {expense.is_recurring && <Badge variant="neutral">{RECURRENCE_LABELS[expense.recurrence_type!]}</Badge>}
                </div>
              </div>
              <span className="text-sm font-semibold text-zinc-900 shrink-0">{formatCurrency(expense.amount, expense.currency)}</span>
            </Link>
          )
        })}
      </div>
    </motion.section>
  )
}

function PersonalGroup({ monthKey, items }: { monthKey: string; items: PersonalExpense[] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-zinc-500 capitalize">
          {format(new Date(monthKey + '-01'), 'MMMM yyyy', { locale: es })}
        </h3>
        <span className="text-xs text-zinc-400">{items.length} gastos</span>
      </div>
      <div className="bg-white rounded-2xl border border-zinc-200/60 overflow-hidden">
        {items.map((expense, i) => (
          <Link key={expense.id} to={`/personal/${expense.id}`}
            className={['flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors active:bg-zinc-100', i > 0 ? 'border-t border-zinc-100' : ''].join(' ')}>
            <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center text-lg shrink-0">
              {categoryEmoji(expense.category)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">{expense.description}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-zinc-400">{format(new Date(expense.date), 'd MMM', { locale: es })}</span>
                {expense.is_recurring && <Badge variant="neutral">{RECURRENCE_LABELS[expense.recurrence_type!]}</Badge>}
              </div>
            </div>
            <span className="text-sm font-semibold text-zinc-900 shrink-0">{formatCurrency(expense.amount, expense.currency)}</span>
          </Link>
        ))}
      </div>
    </motion.section>
  )
}

function categoryEmoji(category: string): string {
  const map: Record<string, string> = { alquiler: '🏠', servicios: '💡', supermercado: '🛒', salidas: '🍽️', salud: '💊', transporte: '🚌', entretenimiento: '🎬', otros: '📦' }
  return map[category] ?? '📦'
}
