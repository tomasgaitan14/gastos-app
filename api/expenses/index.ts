import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readRows, appendRow } from '../_lib/sheets.js'
import { rowToExpense, expenseToRow, rowToSplit, rowToMember, splitToRow } from '../_lib/mappers.js'
import { calculateSplits } from '../_lib/calculations.js'
import { resolveTenantSheetId } from '../_lib/tenants.js'
import type { Expense, ExpenseSplit, ExpenseWithSplits, NewExpensePayload } from '../../src/types/index.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const tenantId = req.query.tenantId as string | undefined
  if (!tenantId) return res.status(400).json({ error: 'tenantId requerido' })
  let sheetId: string
  try { sheetId = await resolveTenantSheetId(tenantId) }
  catch { return res.status(404).json({ error: 'Tenant no encontrado' }) }

  if (req.method === 'GET') {
    const [expenseRows, splitRows] = await Promise.all([
      readRows(sheetId, 'expenses'),
      readRows(sheetId, 'expense_splits'),
    ])
    const expenses = expenseRows.map(rowToExpense)
    const allSplits = splitRows.map(rowToSplit)

    const splitsMap = allSplits.reduce<Record<string, ExpenseSplit[]>>((acc, s) => {
      if (!acc[s.expense_id]) acc[s.expense_id] = []
      acc[s.expense_id].push(s)
      return acc
    }, {})

    const result: ExpenseWithSplits[] = expenses
      .map(e => ({ ...e, splits: splitsMap[e.id] ?? [] }))
      .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))

    return res.status(200).json(result)
  }

  if (req.method === 'POST') {
    const { payload, exchangeRate } = req.body as { payload: NewExpensePayload; exchangeRate: number }

    const now = new Date().toISOString()
    const expense: Expense = {
      id: crypto.randomUUID(),
      description: payload.description,
      amount: payload.amount,
      currency: payload.currency,
      paid_by: payload.paid_by,
      category: payload.category,
      date: payload.date,
      is_recurring: payload.is_recurring,
      recurrence_type: payload.recurrence_type,
      notes: payload.notes || null,
      created_at: now,
      updated_at: now,
    }

    const memberRows = await readRows(sheetId, 'members')
    const members = memberRows.map(rowToMember)

    const splits = calculateSplits(payload.amount, members, payload.excluded_member_ids, exchangeRate)
    const expenseSplits: ExpenseSplit[] = splits.map(s => ({
      id: crypto.randomUUID(),
      expense_id: expense.id,
      user_id: s.member_id,
      percentage: s.percentage,
      amount: s.amount,
      is_excluded: s.is_excluded,
    }))

    await appendRow(sheetId, 'expenses', expenseToRow(expense))
    for (const split of expenseSplits) {
      await appendRow(sheetId, 'expense_splits', splitToRow(split))
    }

    return res.status(201).json({ ...expense, splits: expenseSplits })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
