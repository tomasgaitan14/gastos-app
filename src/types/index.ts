export type Currency = 'ARS' | 'USD'

export type RecurrenceType = 'weekly' | 'monthly' | 'yearly'

export type ExpenseCategory =
  | 'alquiler'
  | 'servicios'
  | 'supermercado'
  | 'salidas'
  | 'salud'
  | 'transporte'
  | 'entretenimiento'
  | 'otros'

export interface Member {
  id: string
  name: string
  salary: number | null
  salary_currency: Currency
  created_at: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  currency: Currency
  paid_by: string       // members.id
  category: ExpenseCategory
  date: string
  is_recurring: boolean
  recurrence_type: RecurrenceType | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ExpenseSplit {
  id: string
  expense_id: string
  user_id: string       // members.id
  percentage: number
  amount: number
  is_excluded: boolean
}

export interface ExpenseWithSplits extends Expense {
  splits: ExpenseSplit[]
}

export interface Settlement {
  id: string
  from_user_id: string  // members.id
  to_user_id: string    // members.id
  amount: number
  currency: Currency
  date: string
  notes: string | null
  created_at: string
}

export interface ExchangeRate {
  id: string
  from_currency: string
  to_currency: string
  rate: number
  source: string
  updated_at: string
}

export interface MemberBalance {
  member_id: string
  member: Member
  net_ars: number
}

export interface DebtSummary {
  from_member_id: string
  from_member: Member
  to_member_id: string
  to_member: Member
  amount_ars: number
}

export interface SplitPreview {
  member_id: string
  member: Member
  percentage: number
  amount: number
  is_excluded: boolean
}

export interface NewExpensePayload {
  description: string
  amount: number
  currency: Currency
  paid_by: string       // members.id
  category: ExpenseCategory
  date: string
  is_recurring: boolean
  recurrence_type: RecurrenceType | null
  notes: string
  excluded_member_ids: string[]
}
