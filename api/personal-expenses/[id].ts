import type { VercelRequest, VercelResponse } from '@vercel/node'
import { findRow, updateRow, deleteRows } from '../_lib/sheets.js'
import { rowToPersonalExpense, personalExpenseToRow } from '../_lib/mappers.js'
import type { NewPersonalExpensePayload } from '../../src/types/index.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id: string }

  if (req.method === 'GET') {
    const found = await findRow('personal_expenses', 0, id)
    if (!found) return res.status(404).json({ error: 'Personal expense not found' })
    return res.status(200).json(rowToPersonalExpense(found.row))
  }

  if (req.method === 'PUT') {
    const payload = req.body as NewPersonalExpensePayload
    const found = await findRow('personal_expenses', 0, id)
    if (!found) return res.status(404).json({ error: 'Personal expense not found' })

    const existing = rowToPersonalExpense(found.row)
    const updated = {
      ...existing,
      description: payload.description,
      amount: payload.amount,
      currency: payload.currency,
      category: payload.category,
      date: payload.date,
      is_recurring: payload.is_recurring,
      recurrence_type: payload.recurrence_type,
      notes: payload.notes || null,
    }
    await updateRow('personal_expenses', found.rowNumber, personalExpenseToRow(updated))
    return res.status(200).json(updated)
  }

  if (req.method === 'DELETE') {
    const found = await findRow('personal_expenses', 0, id)
    if (!found) return res.status(404).json({ error: 'Personal expense not found' })
    await deleteRows('personal_expenses', [found.rowNumber])
    return res.status(204).end()
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
