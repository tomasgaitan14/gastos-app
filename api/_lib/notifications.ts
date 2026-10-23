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
  if (!appId || !apiKey) return

  const formattedAmount = amount.toLocaleString('es-AR')
  const body = `${description} — ${formattedAmount} ${currency} (${paidByName})`

  await fetch(ONESIGNAL_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      filters: [{ field: 'tag', key: 'tenantId', relation: '=', value: tenantId }],
      headings: { en: '💸 Nuevo gasto' },
      contents: { en: body },
    }),
  })
}
