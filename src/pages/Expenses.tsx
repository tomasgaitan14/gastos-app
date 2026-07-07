import { useState, useMemo, useEffect, Fragment } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Plus } from '@phosphor-icons/react'
import { useExpenses } from '@/hooks/useExpenses'
import { useMembers } from '@/hooks/useMembers'
import { usePersonalExpenses } from '@/hooks/usePersonalExpenses'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { useCategories } from '@/hooks/useCategories'
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

function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number)
  return format(new Date(y, m - 1, 1), 'MMMM yyyy', { locale: es })
}

export function Expenses() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) ?? 'compartidos')
  const [sharedFilter, setSharedFilter] = useState<SharedFilter>('todos')
  const [personalFilter, setPersonalFilter] = useState<SharedFilter>('todos')
  const [filterMemberId, setFilterMemberId] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  const { data: expenses = [], isLoading: loadingShared } = useExpenses()
  const { data: members = [] } = useMembers()
  const { data: categories = [] } = useCategories()

  const [selectedMemberId, setSelectedMemberId] = useState(
    searchParams.get('member') ?? members[0]?.id ?? ''
  )

  useEffect(() => {
    if (!selectedMemberId && members.length > 0) setSelectedMemberId(members[0].id)
  }, [members, selectedMemberId])

  const { data: personalExpenses = [], isLoading: loadingPersonal } = usePersonalExpenses(
    tab === 'personal' ? selectedMemberId : null
  )

  // Reset filters when switching tabs
  useEffect(() => { setFilterMonth(''); setFilterCategory(''); setPersonalFilter('todos') }, [tab])

  // Shared: available months (from all expenses, before month filter)
  const sharedMonthOptions = useMemo(() => {
    const keys = new Set(expenses.map(e => e.date.slice(0, 7)))
    return [{ value: '', label: 'Todos los meses' }, ...[...keys].sort((a, b) => b.localeCompare(a)).map(k => ({ value: k, label: monthLabel(k) }))]
  }, [expenses])

  // Personal: available months
  const personalMonthOptions = useMemo(() => {
    const keys = new Set(personalExpenses.map(e => e.date.slice(0, 7)))
    return [{ value: '', label: 'Todos los meses' }, ...[...keys].sort((a, b) => b.localeCompare(a)).map(k => ({ value: k, label: monthLabel(k) }))]
  }, [personalExpenses])

  // Member options for shared filter
  const memberFilterOptions = useMemo(() => [
    { value: '', label: 'Todos los miembros' },
    ...members.map(m => ({ value: m.id, label: m.name })),
  ], [members])

  const categoryFilterOptions = useMemo(() => [
    { value: '', label: 'Todas las categorías' },
    ...categories.map(c => ({ value: c.id, label: c.label })),
  ], [categories])

  // Shared expenses: apply all filters
  const filteredShared = useMemo(() => {
    let list = expenses
    if (filterMemberId) list = list.filter(e => e.paid_by === filterMemberId)
    if (sharedFilter === 'recurrentes') list = list.filter(e => e.is_recurring)
    else if (sharedFilter === 'unicos') list = list.filter(e => !e.is_recurring)
    if (filterMonth) list = list.filter(e => e.date.slice(0, 7) === filterMonth)
    if (filterCategory) list = list.filter(e => e.category === filterCategory)
    return list
  }, [expenses, filterMemberId, sharedFilter, filterMonth, filterCategory])

  const groupedShared = useMemo(() => {
    const groups: Record<string, ExpenseWithSplits[]> = {}
    for (const expense of filteredShared) {
      const key = expense.date.slice(0, 7)
      if (!groups[key]) groups[key] = []
      groups[key].push(expense)
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filteredShared])

  // Personal expenses: apply all filters
  const filteredPersonal = useMemo(() => {
    let list = personalExpenses
    if (personalFilter === 'recurrentes') list = list.filter(e => e.is_recurring)
    else if (personalFilter === 'unicos') list = list.filter(e => !e.is_recurring)
    if (filterMonth) list = list.filter(e => e.date.slice(0, 7) === filterMonth)
    if (filterCategory) list = list.filter(e => e.category === filterCategory)
    return list
  }, [personalExpenses, personalFilter, filterMonth, filterCategory])

  const groupedPersonal = useMemo(() => {
    const groups: Record<string, PersonalExpense[]> = {}
    for (const expense of filteredPersonal) {
      const key = expense.date.slice(0, 7)
      if (!groups[key]) groups[key] = []
      groups[key].push(expense)
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filteredPersonal])

  const { rate } = useExchangeRate()

  const sharedTotal = useMemo(() =>
    filteredShared.reduce((sum, e) => sum + (e.currency === 'USD' ? e.amount * rate : e.amount), 0),
  [filteredShared, rate])

  const personalTotal = useMemo(() =>
    filteredPersonal.reduce((sum, e) => sum + (e.currency === 'USD' ? e.amount * rate : e.amount), 0),
  [filteredPersonal, rate])

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
          {/* Tipo filter chips */}
          <div className="px-4 pt-3 flex gap-2">
            {SHARED_FILTERS.map(f => (
              <button key={f.value} onClick={() => setSharedFilter(f.value)}
                className={['px-3 py-1.5 rounded-xl text-sm font-medium transition-colors', sharedFilter === f.value ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-500 border border-zinc-200'].join(' ')}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Member + month selects */}
          <div className="px-4 pt-2 pb-1 flex gap-2">
            <div className="flex-1">
              <Select options={memberFilterOptions} value={filterMemberId} onChange={e => setFilterMemberId(e.target.value)} />
            </div>
            <div className="flex-1">
              <Select options={sharedMonthOptions} value={filterMonth} onChange={e => setFilterMonth(e.target.value)} />
            </div>
          </div>

          {/* Category filter */}
          <div className="px-4 pb-1">
            <Select options={categoryFilterOptions} value={filterCategory} onChange={e => setFilterCategory(e.target.value)} />
          </div>

          {!loadingShared && filteredShared.length > 0 && (
            <div className="px-4 pt-2 flex items-center justify-between">
              <span className="text-xs text-zinc-400">{filteredShared.length} gastos</span>
              <div className="text-right">
                <span className="text-sm font-semibold text-zinc-900">{formatCurrency(sharedTotal, 'ARS')}</span>
                {rate > 0 && <span className="text-xs text-zinc-400 ml-1.5">~ {formatCurrency(sharedTotal / rate, 'USD')}</span>}
              </div>
            </div>
          )}

          <div className="px-4 pt-2 flex flex-col gap-5">
            {loadingShared ? (
              <div className="bg-white rounded-2xl border border-zinc-200/60 overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => <ExpenseItemSkeleton key={i} />)}
              </div>
            ) : groupedShared.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-2">
                <p className="text-zinc-400 text-sm">Sin gastos para este filtro</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {groupedShared.map(([key, items], idx) => (
                  <Fragment key={key}>
                    {idx > 0 && !filterMonth && (
                      <div className="flex items-center gap-3 -my-1">
                        <div className="flex-1 h-px bg-zinc-200" />
                      </div>
                    )}
                    <SharedGroup monthKey={key} items={items} members={members} />
                  </Fragment>
                ))}
              </AnimatePresence>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Tipo filter chips */}
          <div className="px-4 pt-3 flex gap-2">
            {SHARED_FILTERS.map(f => (
              <button key={f.value} onClick={() => setPersonalFilter(f.value)}
                className={['px-3 py-1.5 rounded-xl text-sm font-medium transition-colors', personalFilter === f.value ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-500 border border-zinc-200'].join(' ')}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Member selector + month filter + add button */}
          <div className="px-4 pt-2 flex gap-2">
            <div className="flex-1">
              {memberOptions.length > 0
                ? <Select label="Miembro" options={memberOptions} value={selectedMemberId} onChange={e => setSelectedMemberId(e.target.value)} />
                : <p className="text-sm text-zinc-400">Sin miembros</p>
              }
            </div>
            {selectedMemberId && (
              <button
                onClick={() => navigate(`/personal/new?member=${selectedMemberId}`)}
                className="h-10 mt-auto px-3 flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white text-sm font-medium shrink-0"
              >
                <Plus size={16} weight="bold" /> Agregar
              </button>
            )}
          </div>

          {/* Month + category filters for personal */}
          {personalExpenses.length > 0 && (
            <div className="px-4 pt-2 pb-1 flex gap-2">
              <div className="flex-1">
                <Select options={personalMonthOptions} value={filterMonth} onChange={e => setFilterMonth(e.target.value)} />
              </div>
              <div className="flex-1">
                <Select options={categoryFilterOptions} value={filterCategory} onChange={e => setFilterCategory(e.target.value)} />
              </div>
            </div>
          )}

          {!loadingPersonal && filteredPersonal.length > 0 && (
            <div className="px-4 pt-1 flex items-center justify-between">
              <span className="text-xs text-zinc-400">{filteredPersonal.length} gastos</span>
              <div className="text-right">
                <span className="text-sm font-semibold text-zinc-900">{formatCurrency(personalTotal, 'ARS')}</span>
                {rate > 0 && <span className="text-xs text-zinc-400 ml-1.5">~ {formatCurrency(personalTotal / rate, 'USD')}</span>}
              </div>
            </div>
          )}

          <div className="px-4 pt-2 flex flex-col gap-5">
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
                <p className="text-zinc-400 text-sm">
                  {filterMonth ? 'Sin gastos en este mes' : 'Sin gastos personales todavía'}
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {groupedPersonal.map(([key, items], idx) => (
                  <Fragment key={key}>
                    {idx > 0 && !filterMonth && (
                      <div className="flex items-center gap-3 -my-1">
                        <div className="flex-1 h-px bg-zinc-200" />
                      </div>
                    )}
                    <PersonalGroup monthKey={key} items={items} />
                  </Fragment>
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
        <h3 className="text-sm font-semibold text-zinc-500 capitalize">{monthLabel(monthKey)}</h3>
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
                  <span className="text-xs text-zinc-400">{format(new Date(expense.date + 'T00:00:00'), 'd MMM', { locale: es })}</span>
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
        <h3 className="text-sm font-semibold text-zinc-500 capitalize">{monthLabel(monthKey)}</h3>
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
                <span className="text-xs text-zinc-400">{format(new Date(expense.date + 'T00:00:00'), 'd MMM', { locale: es })}</span>
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
