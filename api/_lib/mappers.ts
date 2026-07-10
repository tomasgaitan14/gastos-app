import type { Member, Expense, ExpenseSplit, Settlement, PersonalExpense, Category, InstallmentPayment } from '../../src/types/index.js'

// ---- Members (A=id, B=name, C=salary, D=salary_currency, E=created_at) ----

export function rowToMember(row: string[]): Member {
  return {
    id: row[0],
    name: row[1],
    salary: row[2] ? parseFloat(row[2]) : null,
    salary_currency: row[3] as 'ARS' | 'USD',
    created_at: row[4],
  }
}

export function memberToRow(m: Member): (string | number | null)[] {
  return [m.id, m.name, m.salary ?? '', m.salary_currency, m.created_at]
}

// ---- Expenses (A=id, B=description, C=amount, D=currency, E=paid_by, F=category, G=date, H=is_recurring, I=recurrence_type, J=notes, K=created_at, L=updated_at, M=installments_count, N=variable_amount) ----

export function rowToExpense(row: string[]): Expense {
  return {
    id: row[0],
    description: row[1],
    amount: parseFloat(row[2]),
    currency: row[3] as 'ARS' | 'USD',
    paid_by: row[4],
    category: row[5] as Expense['category'],
    date: row[6],
    is_recurring: row[7] === 'TRUE',
    recurrence_type: (row[8] || null) as Expense['recurrence_type'],
    notes: row[9] || null,
    created_at: row[10],
    updated_at: row[11],
    installments_count: row[12] ? parseInt(row[12]) : null,
    variable_amount: row[13] === 'TRUE',
  }
}

export function expenseToRow(e: Expense): (string | number | boolean | null)[] {
  return [
    e.id, e.description, e.amount, e.currency, e.paid_by,
    e.category, e.date, e.is_recurring, e.recurrence_type ?? '',
    e.notes ?? '', e.created_at, e.updated_at,
    e.installments_count ?? '', e.variable_amount,
  ]
}

// ---- ExpenseSplits (A=id, B=expense_id, C=user_id, D=percentage, E=amount, F=is_excluded) ----

export function rowToSplit(row: string[]): ExpenseSplit {
  return {
    id: row[0],
    expense_id: row[1],
    user_id: row[2],
    percentage: parseFloat(row[3]),
    amount: parseFloat(row[4]),
    is_excluded: row[5] === 'TRUE',
  }
}

export function splitToRow(s: ExpenseSplit): (string | number | boolean)[] {
  return [s.id, s.expense_id, s.user_id, s.percentage, s.amount, s.is_excluded]
}

// ---- Settlements (A=id, B=from_user_id, C=to_user_id, D=amount, E=currency, F=date, G=notes, H=created_at) ----

export function rowToSettlement(row: string[]): Settlement {
  return {
    id: row[0],
    from_user_id: row[1],
    to_user_id: row[2],
    amount: parseFloat(row[3]),
    currency: row[4] as 'ARS' | 'USD',
    date: row[5],
    notes: row[6] || null,
    created_at: row[7],
  }
}

export function settlementToRow(s: Settlement): (string | number | null)[] {
  return [s.id, s.from_user_id, s.to_user_id, s.amount, s.currency, s.date, s.notes ?? '', s.created_at]
}

// ---- PersonalExpenses (A=id, B=member_id, C=description, D=amount, E=currency, F=category, G=date, H=is_recurring, I=recurrence_type, J=notes, K=created_at, L=installments_count, M=variable_amount) ----

export function rowToPersonalExpense(row: string[]): PersonalExpense {
  return {
    id: row[0],
    member_id: row[1],
    description: row[2],
    amount: parseFloat(row[3]),
    currency: row[4] as 'ARS' | 'USD',
    category: row[5] as PersonalExpense['category'],
    date: row[6],
    is_recurring: row[7] === 'TRUE',
    recurrence_type: (row[8] || null) as PersonalExpense['recurrence_type'],
    notes: row[9] || null,
    created_at: row[10],
    installments_count: row[11] ? parseInt(row[11]) : null,
    variable_amount: row[12] === 'TRUE',
  }
}

export function personalExpenseToRow(e: PersonalExpense): (string | number | boolean | null)[] {
  return [
    e.id, e.member_id, e.description, e.amount, e.currency,
    e.category, e.date, e.is_recurring, e.recurrence_type ?? '',
    e.notes ?? '', e.created_at,
    e.installments_count ?? '', e.variable_amount,
  ]
}

// ---- InstallmentPayments (A=id, B=expense_id, C=installment_number, D=amount, E=currency, F=paid_date, G=notes, H=created_at) ----

export function rowToInstallmentPayment(row: string[]): InstallmentPayment {
  return {
    id: row[0],
    expense_id: row[1],
    installment_number: parseInt(row[2]),
    amount: parseFloat(row[3]),
    currency: row[4] as 'ARS' | 'USD',
    paid_date: row[5],
    notes: row[6] || null,
    created_at: row[7],
  }
}

export function installmentPaymentToRow(p: InstallmentPayment): (string | number | null)[] {
  return [p.id, p.expense_id, p.installment_number, p.amount, p.currency, p.paid_date, p.notes ?? '', p.created_at]
}

// ---- Categories (A=id, B=label, C=created_at) ----

export function rowToCategory(row: string[]): Category {
  return { id: row[0], label: row[1], created_at: row[2] }
}

export function categoryToRow(c: Category): string[] {
  return [c.id, c.label, c.created_at]
}
