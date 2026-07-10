import type { RecurrenceType, Currency } from '@/types'

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  weekly: 'Semanal',
  monthly: 'Mensual',
  yearly: 'Anual',
  installments: 'En cuotas',
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
  PERSONAL_EXPENSES: ['personal_expenses'] as const,
  PERSONAL_EXPENSE: (id: string) => ['personal_expenses', id] as const,
  CATEGORIES: ['categories'] as const,
  INSTALLMENT_PAYMENTS: (expenseId: string) => ['installment_payments', expenseId] as const,
  PERSONAL_INSTALLMENT_PAYMENTS: (expenseId: string) => ['personal_installment_payments', expenseId] as const,
}

export const STALE_TIMES = {
  EXCHANGE_RATE: 1000 * 60 * 30, // 30 minutos
  MEMBERS: 1000 * 60 * 5,
  EXPENSES: 1000 * 60 * 2,
  CATEGORIES: 1000 * 60 * 60, // 1 hora
}
