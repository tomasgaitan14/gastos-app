import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { useExpenses } from '@/hooks/useExpenses'
import { useMembers } from '@/hooks/useMembers'
import { formatCurrency } from '@/lib/calculations'
import { Badge } from '@/components/ui/Badge'
import { ExpenseItemSkeleton } from '@/components/ui/Skeleton'
import { TopBar } from '@/components/layout/TopBar'
import type { ExpenseWithSplits } from '@/types'

type Filter = 'todos' | 'recurrentes' | 'unicos'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'recurrentes', label: 'Recurrentes' },
  { value: 'unicos', label: 'Únicos' },
]

export function Expenses() {
  const [filter, setFilter] = useState<Filter>('todos')
  const { data: expenses = [], isLoading } = useExpenses()
  const { data: members = [] } = useMembers()

  const filtered = useMemo(() => {
    if (filter === 'recurrentes') return expenses.filter(e => e.is_recurring)
    if (filter === 'unicos') return expenses.filter(e => !e.is_recurring)
    return expenses
  }, [expenses, filter])

  // Agrupar por mes
  const grouped = useMemo(() => {
    const groups: Record<string, ExpenseWithSplits[]> = {}
    for (const expense of filtered) {
      const key = format(new Date(expense.date), 'yyyy-MM')
      if (!groups[key]) groups[key] = []
      groups[key].push(expense)
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  return (
    <div className="flex flex-col pb-24">
      <TopBar title="Gastos" />

      {/* Filtros */}
      <div className="px-4 py-3 flex gap-2">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={[
              'px-3 py-1.5 rounded-xl text-sm font-medium transition-colors',
              filter === f.value
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-500 border border-zinc-200',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-4 flex flex-col gap-5">
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-zinc-200/60 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => <ExpenseItemSkeleton key={i} />)}
          </div>
        ) : grouped.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2">
            <p className="text-zinc-400 text-sm">Sin gastos en esta categoría</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {grouped.map(([key, items]) => (
              <motion.section
                key={key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-zinc-500 capitalize">
                    {format(new Date(key + '-01'), 'MMMM yyyy', { locale: es })}
                  </h3>
                  <span className="text-xs text-zinc-400">{items.length} gastos</span>
                </div>
                <div className="bg-white rounded-2xl border border-zinc-200/60 overflow-hidden">
                  {items.map((expense, i) => {
                    const payer = members.find(m => m.id === expense.paid_by)
                    return (
                      <Link
                        key={expense.id}
                        to={`/expenses/${expense.id}`}
                        className={[
                          'flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors active:bg-zinc-100',
                          i > 0 ? 'border-t border-zinc-100' : '',
                        ].join(' ')}
                      >
                        <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center text-lg shrink-0">
                          {categoryEmoji(expense.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 truncate">{expense.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {payer && (
                              <span className="text-xs text-zinc-400">
                                {payer.name.split(' ')[0]}
                              </span>
                            )}
                            <span className="text-xs text-zinc-300">·</span>
                            <span className="text-xs text-zinc-400">
                              {format(new Date(expense.date), 'd MMM', { locale: es })}
                            </span>
                            {expense.is_recurring && <Badge variant="neutral">recurrente</Badge>}
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-zinc-900 shrink-0">
                          {formatCurrency(expense.amount, expense.currency)}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </motion.section>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

function categoryEmoji(category: string): string {
  const map: Record<string, string> = {
    alquiler: '🏠', servicios: '💡', supermercado: '🛒', salidas: '🍽️',
    salud: '💊', transporte: '🚌', entretenimiento: '🎬', otros: '📦',
  }
  return map[category] ?? '📦'
}
