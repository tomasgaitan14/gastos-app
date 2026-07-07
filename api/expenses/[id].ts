import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readRows, findRow, findRows, updateRow, deleteRows, appendRow } from '../_lib/sheets.js'
import { rowToExpense, expenseToRow, rowToSplit, rowToMember, splitToRow } from '../_lib/mappers.js'
import { calculateSplits } from '../_lib/calculations.js'
import type { Expense, ExpenseSplit, ExpenseWithSplits, NewExpensePayload } from '../../src/types/index.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id: string }

  if (req.method === 'GET') {
    const [found, splitRows] = await Promise.all([
      findRow('expenses', 0, id),
      findRows('expense_splits', 1, id),
    ])
    if (!found) return res.status(404).json({ error: 'Expense not found' })
    const expense = rowToExpense(found.row)
    const splits = splitRows.map(r => rowToSplit(r.row))
    return res.status(200).json({ ...expense, splits } as ExpenseWithSplits)
  }

  if (req.method === 'PUT') {
    const { payload, exchangeRate } = req.body as { payload: NewExpensePayload; exchangeRate: number }

    const found = await findRow('expenses', 0, id)
    if (!found) return res.status(404).json({ error: 'Expense not found' })

    const existing = rowToExpense(found.row)
    const updated: Expense = {
      ...existing,
      description: payload.description,
      amount: payload.amount,
      currency: payload.currency,
      paid_by: payload.paid_by,
      category: payload.category,
      date: payload.date,
      is_recurring: payload.is_recurring,
      recurrence_type: payload.recurrence_type,
      notes: payload.notes || null,
      updated_at: new Date().toISOString(),
    }
    await updateRow('expenses', found.rowNumber, expenseToRow(updated))

    // Borrar splits existentes y recalcular
    const oldSplits = await findRows('expense_splits', 1, id)
    await deleteRows('expense_splits', oldSplits.map(r => r.rowNumber))

    const memberRows = await readRows('members')
    const members = memberRows.map(rowToMember)
    const splits = calculateSplits(payload.amount, members, payload.excluded_member_ids, exchangeRate)
    const newSplits: ExpenseSplit[] = splits.map(s => ({
      id: crypto.randomUUID(),
      expense_id: id,
      user_id: s.member_id,
      percentage: s.percentage,
      amount: s.amount,
      is_excluded: s.is_excluded,
    }))
    for (const split of newSplits) {
      await appendRow('expense_splits', splitToRow(split))
    }

    return res.status(200).json({ ...updated, splits: newSplits })
  }

  if (req.method === 'DELETE') {
    const [found, splitRows] = await Promise.all([
      findRow('expenses', 0, id),
      findRows('expense_splits', 1, id),
    ])
    if (!found) return res.status(404).json({ error: 'Expense not found' })
    const toDelete = [found.rowNumber, ...splitRows.map(r => r.rowNumber)]
    // Splits primero para no alterar índices en expenses (tabs distintos, no importa orden)
    await deleteRows('expense_splits', splitRows.map(r => r.rowNumber))
    await deleteRows('expenses', [found.rowNumber])
    return res.status(204).end()
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
