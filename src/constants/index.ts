import type { ExpenseCategory, RecurrenceType, Currency } from '@/types'

export const CATEGORIES: Record<ExpenseCategory, string> = {
  alquiler: 'Alquiler',
  servicios: 'Servicios',
  supermercado: 'Supermercado',
  salidas: 'Salidas',
  salud: 'Salud',
  transporte: 'Transporte',
  entretenimiento: 'Entretenimiento',
  otros: 'Otros',
}

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  weekly: 'Semanal',
  monthly: 'Mensual',
  yearly: 'Anual',
}

export const CURRENCIES: Currency[] = ['ARS', 'USD']

export const DOLAR_API_URL = 'https://dolarapi.com/v1/dolares/cripto'

export const QUERY_KEYS = {
  MEMBERS: ['members'] as const,
  EXPENSES: ['expenses'] as const,
  EXPENSE: (id: string) => ['expenses', id] as const,
  BALANCE: ['balance'] as const,
  EXCHANGE_RATE: ['exchange_rate'] as const,
  SETTLEMENTS: ['settlements'] as const,
}

export const STALE_TIMES = {
  EXCHANGE_RATE: 1000 * 60 * 30, // 30 minutos
  MEMBERS: 1000 * 60 * 5,
  EXPENSES: 1000 * 60 * 2,
}
