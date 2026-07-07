import type { VercelRequest, VercelResponse } from '@vercel/node'
import { google } from 'googleapis'

// Endpoint temporal para crear el tab tenants y escribir el mapping correcto.
// Se borrará después del primer uso exitoso.

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

  // Verificar si el tab tenants ya existe
  const meta = await sheets.spreadsheets.get({ spreadsheetId: registryId })
  const existingSheets = meta.data.sheets?.map(s => s.properties?.title) ?? []
  const tenantsExists = existingSheets.includes('tenants')

  if (!tenantsExists) {
    // Crear el tab tenants
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: registryId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: 'tenants' } } }],
      },
    })
  }

  // Escribir headers + fila de tomas (sobreescribe desde A1)
  await sheets.spreadsheets.values.update({
    spreadsheetId: registryId,
    range: 'tenants!A1:D2',
    valueInputOption: 'RAW',
    requestBody: {
      values: [
        ['tenantId', 'sheetId', 'name', 'created_at'],
        ['tomas', TOMAS_SHEET_ID, 'Tomas', '2026-07-07'],
      ],
    },
  })

  return res.status(200).json({
    ok: true,
    tabCreated: !tenantsExists,
    tabs: existingSheets,
    tomasSheetId: TOMAS_SHEET_ID,
  })
}
