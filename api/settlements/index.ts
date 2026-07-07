import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readRows, appendRow } from '../_lib/sheets.js'
import { rowToSettlement, settlementToRow } from '../_lib/mappers.js'
import { resolveTenantSheetId } from '../_lib/tenants.js'
import type { Settlement } from '../../src/types/index.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const tenantId = req.query.tenantId as string | undefined
  if (!tenantId) return res.status(400).json({ error: 'tenantId requerido' })
  let sheetId: string
  try { sheetId = await resolveTenantSheetId(tenantId) }
  catch { return res.status(404).json({ error: 'Tenant no encontrado' }) }

  if (req.method === 'GET') {
    const rows = await readRows(sheetId, 'settlements')
    const settlements = rows
      .map(rowToSettlement)
      .sort((a, b) => b.date.localeCompare(a.date))
    return res.status(200).json(settlements)
  }

  if (req.method === 'POST') {
    const { from_user_id, to_user_id, amount, currency, date, notes } = req.body as Omit<Settlement, 'id' | 'created_at'>
    const now = new Date().toISOString()
    const settlement: Settlement = {
      id: crypto.randomUUID(),
      from_user_id,
      to_user_id,
      amount,
      currency,
      date,
      notes: notes ?? null,
      created_at: now,
    }
    await appendRow(sheetId, 'settlements', settlementToRow(settlement))
    return res.status(201).json(settlement)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
