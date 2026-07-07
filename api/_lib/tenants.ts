import { google } from 'googleapis'

const cache = new Map<string, string>()

function getRegistryClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

export async function resolveTenantSheetId(tenantId: string): Promise<string> {
  if (cache.has(tenantId)) return cache.get(tenantId)!
  const sheets = getRegistryClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.REGISTRY_SHEET_ID!,
    range: 'tenants!A:B',
  })
  const rows = (res.data.values ?? []) as string[][]
  // primera fila es header, buscar desde índice 1
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === tenantId) {
      cache.set(tenantId, rows[i][1])
      return rows[i][1]
    }
  }
  throw new Error(`Tenant not found: ${tenantId}`)
}
