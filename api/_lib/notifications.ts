const ONESIGNAL_API = 'https://api.onesignal.com/notifications'

export async function notifyNewExpense(
  tenantId: string,
  description: string,
  amount: number,
  currency: string,
  paidByName: string,
): Promise<void> {
  const appId = process.env.ONESIGNAL_APP_ID
  const apiKey = process.env.ONESIGNAL_REST_API_KEY
  if (!appId || !apiKey) {
    console.error('[notifications] Faltan env vars ONESIGNAL_APP_ID o ONESIGNAL_REST_API_KEY')
    return
  }

  const formattedAmount = amount.toLocaleString('es-AR')
  const body = `${description} — ${formattedAmount} ${currency} (${paidByName})`

  const payload = {
    app_id: appId,
    filters: [{ field: 'tag', key: 'tenantId', relation: '=', value: tenantId }],
    headings: { en: '💸 Nuevo gasto' },
    contents: { en: body },
  }

  console.log('[notifications] Enviando a tenantId:', tenantId, '| body:', body)

  const response = await fetch(ONESIGNAL_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  console.log('[notifications] OneSignal response:', JSON.stringify(data))
}
