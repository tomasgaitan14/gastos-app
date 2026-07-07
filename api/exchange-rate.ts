import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readSingleDataRow, writeSingleDataRow } from './_lib/sheets.js'
import { resolveTenantSheetId } from './_lib/tenants.js'

const DOLAR_API_URL = 'https://dolarapi.com/v1/dolares/cripto'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const tenantId = req.query.tenantId as string | undefined
  if (!tenantId) return res.status(400).json({ error: 'tenantId requerido' })
  let sheetId: string
  try { sheetId = await resolveTenantSheetId(tenantId) }
  catch { return res.status(404).json({ error: 'Tenant no encontrado' }) }

  if (req.method === 'GET') {
    const row = await readSingleDataRow(sheetId, 'exchange_rates')
    if (!row || !row[0]) {
      return res.status(200).json({ rate: 0, source: null, updated_at: null })
    }
    return res.status(200).json({
      rate: parseFloat(row[0]),
      source: row[1] ?? null,
      updated_at: row[2] ?? null,
    })
  }

  // POST con { source: 'api' } → fetchea de dolarapi; con { source: 'manual', rate: number } → usa el valor enviado
  if (req.method === 'POST') {
    const { source, rate: manualRate } = req.body as { source: 'api' | 'manual'; rate?: number }
    let rate: number

    if (source === 'manual') {
      if (!manualRate || manualRate <= 0) return res.status(400).json({ error: 'Rate inválido' })
      rate = manualRate
    } else {
      const apiRes = await fetch(DOLAR_API_URL)
      if (!apiRes.ok) throw new Error('Error fetching dolarapi')
      const data = await apiRes.json() as { venta: number }
      rate = data.venta
    }

    const now = new Date().toISOString()
    await writeSingleDataRow(sheetId, 'exchange_rates', [rate, source, now])
    return res.status(200).json({ rate, source, updated_at: now })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
