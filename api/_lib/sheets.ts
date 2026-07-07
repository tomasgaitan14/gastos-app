import { google } from 'googleapis'

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

async function getClient() {
  const auth = getAuth()
  return google.sheets({ version: 'v4', auth })
}

type CellValue = string | number | boolean | null

function serialize(v: CellValue): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  return String(v)
}

function toColLetter(count: number): string {
  let result = ''
  let n = count
  while (n > 0) {
    n--
    result = String.fromCharCode(65 + (n % 26)) + result
    n = Math.floor(n / 26)
  }
  return result
}

export async function readRows(sheetId: string, tab: string): Promise<string[][]> {
  const sheets = await getClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tab}!A:ZZ`,
  })
  const rows = (res.data.values ?? []) as string[][]
  return rows.length > 1 ? rows.slice(1) : []
}

export async function appendRow(sheetId: string, tab: string, values: CellValue[]): Promise<void> {
  const sheets = await getClient()
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${tab}!A:A`,
    valueInputOption: 'RAW',
    requestBody: { values: [values.map(serialize)] },
  })
}

export async function updateRow(sheetId: string, tab: string, rowNumber: number, values: CellValue[]): Promise<void> {
  const sheets = await getClient()
  const lastCol = toColLetter(values.length)
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${tab}!A${rowNumber}:${lastCol}${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [values.map(serialize)] },
  })
}

export async function findRow(sheetId: string, tab: string, colIndex: number, value: string): Promise<{ row: string[]; rowNumber: number } | null> {
  const sheets = await getClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tab}!A:ZZ`,
  })
  const rows = (res.data.values ?? []) as string[][]
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][colIndex] === value) {
      return { row: rows[i], rowNumber: i + 1 }
    }
  }
  return null
}

export async function findRows(sheetId: string, tab: string, colIndex: number, value: string): Promise<{ row: string[]; rowNumber: number }[]> {
  const sheets = await getClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tab}!A:ZZ`,
  })
  const rows = (res.data.values ?? []) as string[][]
  const results: { row: string[]; rowNumber: number }[] = []
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][colIndex] === value) {
      results.push({ row: rows[i], rowNumber: i + 1 })
    }
  }
  return results
}

export async function deleteRows(sheetId: string, tab: string, rowNumbers: number[]): Promise<void> {
  if (rowNumbers.length === 0) return
  const sheets = await getClient()
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId })
  const sheet = meta.data.sheets?.find(s => s.properties?.title === tab)
  const tabSheetId = sheet?.properties?.sheetId
  if (tabSheetId === undefined) throw new Error(`Tab not found: ${tab}`)

  // Eliminar de abajo hacia arriba para no desplazar índices
  const sorted = [...rowNumbers].sort((a, b) => b - a)
  const requests = sorted.map(rowNumber => ({
    deleteDimension: {
      range: {
        sheetId: tabSheetId,
        dimension: 'ROWS' as const,
        startIndex: rowNumber - 1,
        endIndex: rowNumber,
      },
    },
  }))

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: { requests },
  })
}

// Borra todas las filas de datos (deja el header intacto) y las reescribe
export async function replaceAllRows(sheetId: string, tab: string, allValues: CellValue[][]): Promise<void> {
  const sheets = await getClient()
  await sheets.spreadsheets.values.clear({
    spreadsheetId: sheetId,
    range: `${tab}!A2:ZZ`,
  })
  if (allValues.length === 0) return
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${tab}!A2`,
    valueInputOption: 'RAW',
    requestBody: { values: allValues.map(row => row.map(serialize)) },
  })
}

// Lee/escribe una sola fila de datos (para exchange_rates que siempre es 1 fila)
export async function readSingleDataRow(sheetId: string, tab: string): Promise<string[] | null> {
  const sheets = await getClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tab}!A2:ZZ2`,
  })
  const rows = (res.data.values ?? []) as string[][]
  return rows[0] ?? null
}

export async function createSheetWithHeaders(sheetId: string, name: string, headers: string[]): Promise<void> {
  const sheets = await getClient()
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: name } } }] },
  })
  const lastCol = toColLetter(headers.length)
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${name}!A1:${lastCol}1`,
    valueInputOption: 'RAW',
    requestBody: { values: [headers] },
  })
}

export async function writeSingleDataRow(sheetId: string, tab: string, values: CellValue[]): Promise<void> {
  const sheets = await getClient()
  const lastCol = toColLetter(values.length)
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${tab}!A2:${lastCol}2`,
    valueInputOption: 'RAW',
    requestBody: { values: [values.map(serialize)] },
  })
}
