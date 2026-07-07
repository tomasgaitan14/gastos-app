import type { VercelRequest, VercelResponse } from '@vercel/node'
import { google } from 'googleapis'

// Endpoint temporal para corregir el mapping del registry.
// Solo acepta el secret correcto. Se borrará después del primer uso exitoso.

const TOMAS_SHEET_ID = '1CyyQBDgE7hqgkblKQDT7JYNatDDUW2ZM22diloZiZOs'
const SECRET = 'fix-registry-2026'

function getClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.query.secret !== SECRET) return res.status(403).json({ error: 'Forbidden' })

  const registryId = process.env.REGISTRY_SHEET_ID!
  const sheets = getClient()

  // Leer el tab tenants del registry
  const read = await sheets.spreadsheets.values.get({
    spreadsheetId: registryId,
    range: 'tenants!A:D',
  })

  const rows = (read.data.values ?? []) as string[][]
  let tomasRowIndex = -1
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === 'tomas') { tomasRowIndex = i + 1; break }
  }

  if (tomasRowIndex === -1) {
    // No existe la fila, la agrega
    await sheets.spreadsheets.values.append({
      spreadsheetId: registryId,
      range: 'tenants!A:D',
      valueInputOption: 'RAW',
      requestBody: { values: [['tomas', TOMAS_SHEET_ID, 'Tomas', '2026-07-07']] },
    })
    return res.status(200).json({ action: 'appended', sheetId: TOMAS_SHEET_ID })
  }

  // Existe, la actualiza
  await sheets.spreadsheets.values.update({
    spreadsheetId: registryId,
    range: `tenants!A${tomasRowIndex}:D${tomasRowIndex}`,
    valueInputOption: 'RAW',
    requestBody: { values: [['tomas', TOMAS_SHEET_ID, 'Tomas', '2026-07-07']] },
  })
  return res.status(200).json({ action: 'updated', row: tomasRowIndex, sheetId: TOMAS_SHEET_ID })
}
