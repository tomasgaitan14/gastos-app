import type { VercelRequest, VercelResponse } from '@vercel/node'
import { findRow, updateRow, deleteRows } from '../_lib/sheets.js'
import { rowToCategory, categoryToRow } from '../_lib/mappers.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id: string }

  if (req.method === 'PUT') {
    const { label } = req.body as { label: string }
    if (!label?.trim()) return res.status(400).json({ error: 'Label requerido' })
    const found = await findRow('categories', 0, id)
    if (!found) return res.status(404).json({ error: 'Categoría no encontrada' })
    const updated = { ...rowToCategory(found.row), label: label.trim() }
    await updateRow('categories', found.rowNumber, categoryToRow(updated))
    return res.status(200).json(updated)
  }

  if (req.method === 'DELETE') {
    const found = await findRow('categories', 0, id)
    if (!found) return res.status(404).json({ error: 'Categoría no encontrada' })
    await deleteRows('categories', [found.rowNumber])
    return res.status(204).end()
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
