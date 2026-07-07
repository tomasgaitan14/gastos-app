import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readRows, appendRow, createSheetWithHeaders } from '../_lib/sheets.js'
import { rowToCategory, categoryToRow } from '../_lib/mappers.js'
import { resolveTenantSheetId } from '../_lib/tenants.js'
import type { Category } from '../../src/types/index.js'

const CATEGORY_HEADERS = ['id', 'label', 'created_at']

const DEFAULT_CATEGORIES = [
  { id: 'alquiler', label: 'Alquiler' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'supermercado', label: 'Supermercado' },
  { id: 'salidas', label: 'Salidas' },
  { id: 'salud', label: 'Salud' },
  { id: 'transporte', label: 'Transporte' },
  { id: 'entretenimiento', label: 'Entretenimiento' },
  { id: 'otros', label: 'Otros' },
]

async function seedCategories(sheetId: string): Promise<Category[]> {
  const now = new Date().toISOString()
  const categories: Category[] = DEFAULT_CATEGORIES.map(c => ({ ...c, created_at: now }))
  for (const cat of categories) {
    await appendRow(sheetId, 'categories', categoryToRow(cat))
  }
  return categories
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const tenantId = req.query.tenantId as string | undefined
  if (!tenantId) return res.status(400).json({ error: 'tenantId requerido' })
  let sheetId: string
  try { sheetId = await resolveTenantSheetId(tenantId) }
  catch { return res.status(404).json({ error: 'Tenant no encontrado' }) }

  if (req.method === 'GET') {
    let rows: string[][]
    try {
      rows = await readRows(sheetId, 'categories')
    } catch {
      await createSheetWithHeaders(sheetId, 'categories', CATEGORY_HEADERS)
      return res.status(200).json(await seedCategories(sheetId))
    }
    if (rows.length === 0) {
      return res.status(200).json(await seedCategories(sheetId))
    }
    return res.status(200).json(rows.map(rowToCategory))
  }

  if (req.method === 'POST') {
    const { label } = req.body as { label: string }
    if (!label?.trim()) return res.status(400).json({ error: 'Label requerido' })
    const rows = await readRows(sheetId, 'categories')
    if (rows.some(r => r[1]?.toLowerCase() === label.trim().toLowerCase())) {
      return res.status(409).json({ error: 'Ya existe una categoría con ese nombre' })
    }
    const now = new Date().toISOString()
    const newCat: Category = { id: crypto.randomUUID(), label: label.trim(), created_at: now }
    await appendRow(sheetId, 'categories', categoryToRow(newCat))
    return res.status(201).json(newCat)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
