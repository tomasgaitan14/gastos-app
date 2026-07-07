import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readRows, appendRow } from '../_lib/sheets.js'
import { rowToMember, memberToRow } from '../_lib/mappers.js'
import { resolveTenantSheetId } from '../_lib/tenants.js'
import type { Member } from '../../src/types/index.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const tenantId = req.query.tenantId as string | undefined
  if (!tenantId) return res.status(400).json({ error: 'tenantId requerido' })
  let sheetId: string
  try { sheetId = await resolveTenantSheetId(tenantId) }
  catch { return res.status(404).json({ error: 'Tenant no encontrado' }) }

  if (req.method === 'GET') {
    const rows = await readRows(sheetId, 'members')
    const members = rows.map(rowToMember).sort(
      (a, b) => a.created_at.localeCompare(b.created_at),
    )
    return res.status(200).json(members)
  }

  if (req.method === 'POST') {
    const { name, salary, salary_currency } = req.body as Pick<Member, 'name' | 'salary' | 'salary_currency'>
    const now = new Date().toISOString()
    const newMember: Member = {
      id: crypto.randomUUID(),
      name,
      salary,
      salary_currency,
      created_at: now,
    }
    await appendRow(sheetId, 'members', memberToRow(newMember))
    return res.status(201).json(newMember)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
