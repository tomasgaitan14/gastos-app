import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readRows, findRow, updateRow, deleteRows, findRows, replaceAllRows } from '../_lib/sheets.js'
import { rowToMember, memberToRow, rowToExpense, rowToSplit, splitToRow } from '../_lib/mappers.js'
import { calculateSplits } from '../_lib/calculations.js'
import type { Member } from '../../src/types/index.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id: string }

  if (req.method === 'PUT') {
    const { name, salary, salary_currency } = req.body as Pick<Member, 'name' | 'salary' | 'salary_currency'>

    const found = await findRow('members', 0, id)
    if (!found) return res.status(404).json({ error: 'Member not found' })

    const updatedMember: Member = {
      ...rowToMember(found.row),
      name,
      salary,
      salary_currency,
    }
    await updateRow('members', found.rowNumber, memberToRow(updatedMember))

    // Recalcular todos los splits con el salario actualizado
    const [memberRows, expenseRows, splitRows, rateRow] = await Promise.all([
      readRows('members'),
      readRows('expenses'),
      readRows('expense_splits'),
      readRows('exchange_rates'),
    ])

    const members = memberRows.map(rowToMember)
    const expenses = expenseRows.map(rowToExpense)
    const existingSplits = splitRows.map(rowToSplit)
    const exchangeRate = rateRow[0] ? parseFloat(rateRow[0][0]) : 0

    if (expenses.length === 0) return res.status(200).json(updatedMember)

    const newSplits = expenses.flatMap(expense => {
      const excludedIds = existingSplits
        .filter(s => s.expense_id === expense.id && s.is_excluded)
        .map(s => s.user_id)
      return calculateSplits(expense.amount, members, excludedIds, exchangeRate).map(s => ({
        id: existingSplits.find(es => es.expense_id === expense.id && es.user_id === s.member_id)?.id ?? crypto.randomUUID(),
        expense_id: expense.id,
        user_id: s.member_id,
        percentage: s.percentage,
        amount: s.amount,
        is_excluded: s.is_excluded,
      }))
    })

    await replaceAllRows('expense_splits', newSplits.map(splitToRow))
    return res.status(200).json(updatedMember)
  }

  if (req.method === 'DELETE') {
    const found = await findRow('members', 0, id)
    if (!found) return res.status(404).json({ error: 'Member not found' })
    await deleteRows('members', [found.rowNumber])
    return res.status(204).end()
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
