import type { VercelRequest, VercelResponse } from '@vercel/node'
import { appendRow, findRows, updateRow } from '../_lib/sheets.js'
import { rowToInstallmentPayment, installmentPaymentToRow } from '../_lib/mappers.js'
import { resolveTenantSheetId } from '../_lib/tenants.js'
import type { InstallmentPayment, NewInstallmentPaymentPayload } from '../../src/types/index.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const tenantId = req.query.tenantId as string | undefined
  if (!tenantId) return res.status(400).json({ error: 'tenantId requerido' })
  const type = req.query.type as string | undefined
  const TAB = type === 'personal' ? 'personal_installment_payments' : 'installment_payments'
  let sheetId: string
  try { sheetId = await resolveTenantSheetId(tenantId) }
  catch { return res.status(404).json({ error: 'Tenant no encontrado' }) }

  if (req.method === 'GET') {
    const { expense_id } = req.query as { expense_id?: string }
    if (!expense_id) return res.status(400).json({ error: 'expense_id requerido' })
    const found = await findRows(sheetId, TAB, 1, expense_id)
    const payments = found.map(r => rowToInstallmentPayment(r.row))
    payments.sort((a, b) => a.installment_number - b.installment_number)
    return res.status(200).json(payments)
  }

  if (req.method === 'POST') {
    const payload = req.body as NewInstallmentPaymentPayload
    const existing = await findRows(sheetId, TAB, 1, payload.expense_id)
    const match = existing.find(r => r.row[2] === String(payload.installment_number))
    const now = new Date().toISOString()

    if (match) {
      const updated: InstallmentPayment = {
        id: match.row[0],
        expense_id: payload.expense_id,
        installment_number: payload.installment_number,
        amount: payload.amount,
        currency: payload.currency,
        paid_date: payload.paid_date,
        notes: payload.notes || null,
        created_at: match.row[7],
      }
      await updateRow(sheetId, TAB, match.rowNumber, installmentPaymentToRow(updated))
      return res.status(200).json(updated)
    }

    const payment: InstallmentPayment = {
      id: crypto.randomUUID(),
      expense_id: payload.expense_id,
      installment_number: payload.installment_number,
      amount: payload.amount,
      currency: payload.currency,
      paid_date: payload.paid_date,
      notes: payload.notes || null,
      created_at: now,
    }
    await appendRow(sheetId, TAB, installmentPaymentToRow(payment))
    return res.status(201).json(payment)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
