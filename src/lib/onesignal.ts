import OneSignal from 'react-onesignal'

let initialized = false

export async function initOneSignal(): Promise<void> {
  if (initialized) return
  initialized = true

  await OneSignal.init({
    appId: import.meta.env.VITE_ONESIGNAL_APP_ID as string,
    allowLocalhostAsSecureOrigin: true,
  })
}

export function setTenantTag(tenantId: string): void {
  try {
    OneSignal.User.addTag('tenantId', tenantId)
  } catch {
    // OneSignal puede no estar listo aún; no es crítico
  }
}
