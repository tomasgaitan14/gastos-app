import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readRows, appendRow } from '../_lib/sheets.js'
import { rowToPersonalExpense, personalExpenseToRow } from '../_lib/mappers.js'
import type { PersonalExpense, NewPersonalExpensePayload } from '../../src/types/index.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const { member_id } = req.query as { member_id?: string }
    const rows = await readRows('personal_expenses')
    let expenses = rows.map(rowToPersonalExpense)
    if (member_id) {
      expenses = expenses.filter(e => e.member_id === member_id)
    }
    expenses.sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
    return res.status(200).json(expenses)
  }

  if (req.method === 'POST') {
    const payload = req.body as NewPersonalExpensePayload
    const now = new Date().toISOString()
    const expense: PersonalExpense = {
      id: crypto.randomUUID(),
      member_id: payload.member_id,
      description: payload.description,
      amount: payload.amount,
      currency: payload.currency,
      category: payload.category,
      date: payload.date,
      is_recurring: payload.is_recurring,
      recurrence_type: payload.recurrence_type,
      notes: payload.notes || null,
      created_at: now,
    }
    await appendRow('personal_expenses', personalExpenseToRow(expense))
    return res.status(201).json(expense)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
