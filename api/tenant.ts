import type { VercelRequest, VercelResponse } from '@vercel/node'
import { resolveTenantSheetId } from './_lib/tenants.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const tenantId = req.query.tenantId as string | undefined
  if (!tenantId) return res.status(400).json({ error: 'tenantId requerido' })
  try {
    await resolveTenantSheetId(tenantId)
    return res.status(200).json({ exists: true })
  } catch {
    return res.status(404).json({ error: 'Tenant no encontrado' })
  }
}
