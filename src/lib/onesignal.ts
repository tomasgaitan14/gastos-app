import OneSignal from 'react-onesignal'

let initPromise: Promise<void> | null = null

export function initOneSignal(): Promise<void> {
  if (initPromise) return initPromise
  initPromise = OneSignal.init({
    appId: import.meta.env.VITE_ONESIGNAL_APP_ID as string,
    allowLocalhostAsSecureOrigin: true,
  })
  return initPromise
}

export async function setTenantTag(tenantId: string): Promise<void> {
  try {
    await initPromise
    OneSignal.User.addTag('tenantId', tenantId)
  } catch {
    // no es crítico
  }
}
